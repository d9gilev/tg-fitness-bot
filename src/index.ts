import "dotenv/config";
import express from "express";
import TelegramBot from "node-telegram-bot-api";
import { mainKb } from "./keyboards";
import { guardUser, isExpired, isMuted } from "./guards";
import { ensureUser } from "./storage";
import { startOnboarding, isOnboarding, handleOnboardingAnswer } from "./onboarding/runner";
import { registerFood, registerFoodCallbacks } from "./features/food";
import { registerReports } from "./features/reports";
import { registerPlan } from "./features/plan";
import { createUserJobs } from "./scheduler";
import { initDB } from "./storage";

const token = process.env.BOT_TOKEN!;
const base = process.env.WEBHOOK_URL!; // например: https://tg-fitness-bot-app-production.up.railway.app
const port = Number(process.env.PORT || 8080);

if (!token || !base) {
  throw new Error("BOT_TOKEN или WEBHOOK_URL не заданы в переменных окружения");
}

const app = express();
app.use(express.json({ limit: "2mb" })); // JSON-парсер ДОЛЖЕН быть включён

// 1) БОТ в режиме WEBHOOK (БЕЗ polling!)
const bot = new TelegramBot(token, { webHook: { autoOpen: false } });

// 2) Секретный путь вебхука (включает токен)
const hookPath = `/bot${token}`;
const hookUrl  = `${base}${hookPath}`;

// Инициализация базы данных
async function startBot() {
  try {
    await initDB();
    console.log("Database initialized successfully");

    // регистрируем фичи
    registerFood(bot);
    registerFoodCallbacks(bot);
    registerReports(bot);
    registerPlan(bot);
    
    // Обработка команды /start
    bot.onText(/^\/start$/, async (msg) => {
      const u = await guardUser(msg.chat.id, msg.from);
      if (!u.plan_status) { // нет онбординга/плана — запускаем
        startOnboarding(bot, msg.chat.id);
      } else {
        await bot.sendMessage(msg.chat.id, `Привет, ${u.preferred_name || u.first_name}!`, { reply_markup: mainKb });
      }
      // на всякий случай создадим джобы (если уже есть — просто ничего не будет)
      createUserJobs(bot, msg.chat.id);
    });

    // Команда для сброса плана и запуска онбординга
    bot.onText(/^\/clear$/, async (msg) => {
      const u = await guardUser(msg.chat.id, msg.from);
      // Сбрасываем план
      await ensureUser(msg.chat.id, { 
        plan_status: null, 
        plan_start: null, 
        plan_end: null, 
        plan: undefined 
      });
      await bot.sendMessage(msg.chat.id, "План сброшен! Начинаем онбординг...");
      startOnboarding(bot, msg.chat.id);
    });

    // универсальный Guard (автоблок по окончании месяца)
    bot.on("message", async (msg) => {
      if (/^\/start$/.test(msg.text || "")) return;          // уже обработали
      if (/^\/clear$/.test(msg.text || "")) return;          // уже обработали
      if (isOnboarding(msg.chat.id)) { await handleOnboardingAnswer(bot, msg); return; }

      const u = await guardUser(msg.chat.id, msg.from);
      if (isMuted(u)) return; // молчим
      if (isExpired(u)) {
        return bot.sendMessage(msg.chat.id, "Месяц закончился. 💳 Продлить?", {
          reply_markup: { inline_keyboard: [[{ text: "Продлить", url: "https://t.me/your_payment_link" }]] }
        });
      }
    });

    // 3) Приём апдейтов: отвечаем 200 МГНОВЕННО
    app.post(hookPath, (req, res) => {
      console.log('📨 Получен webhook:', req.body);
      bot.processUpdate(req.body);
      res.sendStatus(200);
    });

    // 4) Health-check на корне — чтобы в браузере было НЕ "Cannot GET /"
    app.get("/", (_req, res) => res.status(200).send("OK"));

    // 5) Старт
    app.listen(port, "0.0.0.0", async () => {
      // Сначала снимем старый вебхук (на случай смены домена/пути)
      await fetch(`https://api.telegram.org/bot${token}/deleteWebhook`, { method: "POST" });

      // Привяжем новый
      await bot.setWebHook(hookUrl);

      console.log("Webhook set to:", hookUrl);
      console.log(`Server is listening on ${port} (WEBHOOK mode)`);
    });

  } catch (error) {
    console.error("Failed to start bot:", error);
    process.exit(1);
  }
}

startBot();
