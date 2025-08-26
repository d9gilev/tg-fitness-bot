import "dotenv/config";
import TelegramBot from "node-telegram-bot-api";
import express from "express";
import bodyParser from "body-parser";
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
const isProd = !!process.env.WEBHOOK_URL; // если задан WEBHOOK_URL — работаем по вебхуку

// Инициализация и запуск
async function startBot() {
  try {
    await initDB();
    console.log("Database initialized successfully");
    
    if (!isProd) {
      // === DEV / локально ===
      const bot = new TelegramBot(token, { polling: { autoStart: false } });
      await fetch(`https://api.telegram.org/bot${token}/deleteWebhook`); // на всякий случай
      
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
      
      await bot.startPolling();
      console.log("Bot running in POLLING (dev).");
    } else {
      // === PROD / Railway ===
      const app = express();
      const bot = new TelegramBot(token, { webHook: { autoOpen: false } });
      
      const baseUrl = process.env.WEBHOOK_URL!; // https://tg-fitness-bot-app-production.up.railway.app
      const path = `/bot${token}`;              // один и тот же в setWebHook и app.post

      app.use(express.json({ limit: "2mb" }));  // JSON-парсер ДО маршрутов

      app.get('/health', (req: any, res: any) => {
        res.json({ status: 'ok', timestamp: new Date().toISOString() });
      });

      await bot.setWebHook(`${baseUrl}${path}`);
      console.log(`Webhook set to: ${baseUrl}${path}`);

      app.post(path, (req: any, res: any) => {            // <-- именно такой же path
        console.log('📨 Получен webhook:', req.body);
        bot.processUpdate(req.body);
        res.sendStatus(200);
      });

      app.get("/", (_req: any, res: any) => res.status(200).send("OK"));

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

      app.listen(Number(process.env.PORT || 8080), "0.0.0.0", () => {
        console.log("WEBHOOK mode on", process.env.PORT || 8080);
      });
    }
  } catch (error) {
    console.error("Failed to start bot:", error);
    process.exit(1);
  }
}

startBot();
