import TelegramBot from "node-telegram-bot-api";
import { ensureUser, getUser } from "../storage";
import { mainKb, morningIKB } from "../keyboards";

export function registerPlan(bot:TelegramBot){
  bot.on("message", async (msg)=>{
    if(msg.text==="📅 План"){
      const u = await getUser(msg.chat.id);
      const day = u?.plan_start ? Math.ceil((Date.now()-u.plan_start)/(24*3600e3)) : 0;
      await bot.sendMessage(msg.chat.id, `День ${day}/30. Тренировка сегодня в … (настрой в Расписании).`, { reply_markup: morningIKB });
    }
    if(msg.text==="👤 Профиль"){ const u = await getUser(msg.chat.id);
      await bot.sendMessage(msg.chat.id, `Имя: ${u?.preferred_name||u?.first_name}\nTZ: ${u?.tz||"—"}\nЦель: ${u?.goal||"—"}`);
    }
    if(msg.text==="🕒 Расписание"){ await bot.sendMessage(msg.chat.id, "Редактор расписания — в разработке. Пока треня по выбранным дням/времени."); }
    if(msg.text==="🔕 Пауза 24ч"){ const u = await ensureUser(msg.chat.id); u.mute_until = Date.now()+24*3600e3; await bot.sendMessage(msg.chat.id,"Напоминалки выключены на 24 часа."); }
    if(msg.text==="❓ Помощь"){ await bot.sendMessage(msg.chat.id, "Меню: План / Отчёт / Еда / +250 мл / Расписание / Пауза / Профиль."); }
    if(msg.text==="💧 +250 мл"){ 
      const u = await ensureUser(msg.chat.id); 
      const goal = u?.plan?.water_goal_ml ?? 2300;
      u.water_today = (u.water_today||0) + 250;
      const left = Math.max(0, goal - (u.water_today||0));
      await bot.sendMessage(msg.chat.id, `+250 мл. Сегодня: ${(u.water_today||0)} из ${goal} мл (осталось ~${left} мл).`); 
    }
  });

  // Обработка водных callback'ов
  bot.on("callback_query", async (q) => {
    if(!q.data) return;
    
    if(q.data === "water_250" || q.data === "water_500") {
      const amount = q.data === "water_250" ? 250 : 500;
      const u = await ensureUser(q.message!.chat.id);
      const goal = u?.plan?.water_goal_ml ?? 2300;
      u.water_today = (u.water_today||0) + amount;
      const left = Math.max(0, goal - (u.water_today||0));
      
      await bot.answerCallbackQuery(q.id);
      await bot.sendMessage(q.message!.chat.id, `+${amount} мл. Сегодня: ${(u.water_today||0)} из ${goal} мл (осталось ~${left} мл).`);
    }
  });
}
