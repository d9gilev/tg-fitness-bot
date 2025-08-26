import TelegramBot from "node-telegram-bot-api";
import { getUser } from "../storage";

export function registerReports(bot:TelegramBot){
  bot.on("message", async (msg)=>{
    if(msg.text==="📝 Отчёт"){
      await bot.sendMessage(msg.chat.id, "Опиши тренировку текстом и/или пришли скрин (Apple Watch и т.д.).");
      (bot as any)._expectWorkout = (bot as any)._expectWorkout || {};
      (bot as any)._expectWorkout[msg.chat.id] = true;
    } else if((bot as any)._expectWorkout?.[msg.chat.id]) {
      (bot as any)._expectWorkout[msg.chat.id] = false;
      const u = await getUser(msg.chat.id);
      const name = u?.preferred_name || u?.first_name || "друг";
      await bot.sendMessage(msg.chat.id, `Принял отчёт, ${name}. Красавчик(ца)! Если будут детали (вес/повторы/RPE) — пришли, подстрою план.`);
      // здесь можно вызвать GPT для тонкой оценки
    }
  });
}
