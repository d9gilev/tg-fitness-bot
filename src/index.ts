import "dotenv/config";
import TelegramBot from "node-telegram-bot-api";
import { mainKb } from "./keyboards";
import { guardUser, isExpired, isMuted } from "./guards";
import { startOnboarding, isOnboarding, handleOnboardingAnswer } from "./onboarding/runner";
import { registerFood, registerFoodCallbacks } from "./features/food";
import { registerReports } from "./features/reports";
import { registerPlan } from "./features/plan";
import { createUserJobs } from "./scheduler";
import { initDB } from "./storage";

const bot = new TelegramBot(process.env.BOT_TOKEN!, { polling: { autoStart: false } });

// /start
bot.onText(/^\/start$/, async (msg)=>{
  const u = await guardUser(msg.chat.id, msg.from);
  if(!u.plan_status){ // нет онбординга/плана — запускаем
    startOnboarding(bot, msg.chat.id);
  } else {
    await bot.sendMessage(msg.chat.id, `Привет, ${u.preferred_name||u.first_name}!`, { reply_markup: mainKb });
  }
  // на всякий случай создадим джобы (если уже есть — просто ничего не будет)
  createUserJobs(bot, msg.chat.id);
});

// универсальный Guard (автоблок по окончании месяца)
bot.on("message", async (msg) => {
  if(/^\/start$/.test(msg.text||"")) return;          // уже обработали
  if(isOnboarding(msg.chat.id)){ await handleOnboardingAnswer(bot, msg); return; }

  const u = await guardUser(msg.chat.id, msg.from);
  if(isMuted(u)) return; // молчим
  if(isExpired(u)){
    return bot.sendMessage(msg.chat.id, "Месяц закончился. 💳 Продлить?", {
      reply_markup: { inline_keyboard: [[{text:"Продлить", url:"https://t.me/your_payment_link"}]] }
    });
  }
});

// Инициализация и запуск
async function startBot() {
  try {
    await initDB();
    console.log("Database initialized successfully");
    
    // safety: убедиться, что webhook точно снят
    await fetch(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/deleteWebhook`);
    console.log("Webhook deleted successfully");
    
    // регистрируем фичи
    registerFood(bot);
    registerFoodCallbacks(bot);
    registerReports(bot);
    registerPlan(bot);
    
    // запускаем polling ровно ОДИН раз
    await bot.startPolling();
    console.log("Bot started. Ctrl+C to stop.");
  } catch (error) {
    console.error("Failed to start bot:", error);
    process.exit(1);
  }
}

startBot();
