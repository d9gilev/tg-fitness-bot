import cron from "node-cron";
import dayjs from "dayjs"; import utc from "dayjs/plugin/utc"; import tzp from "dayjs/plugin/timezone";
import { db, getUser, ensureUser } from "./storage";
import TelegramBot from "node-telegram-bot-api";
dayjs.extend(utc); dayjs.extend(tzp);

function rand(min:number,max:number){ return Math.floor(Math.random()*(max-min+1))+min; }

export async function createUserJobs(bot:TelegramBot, chatId:number){
  const u = await getUser(chatId); if(!u || !u.tz) return;
  const tz = u.tz;

  // 1) Утренний пинг (07:00–09:30, случайная минута каждый день)
  cron.schedule("0 7 * * *", () => {
    setTimeout(()=> sendMorning(bot, chatId), rand(0, 150)*1000); // 0–150 сек
  }, { timezone: tz });

  // 2) Водные (3–5 окон)
  const windows = ["10:30","12:30","15:00","17:00","19:00"];
  windows.forEach(t=>{
    const [h,m] = t.split(":").map(Number);
    cron.schedule(`${m} ${h} * * *`, () => {
      setTimeout(()=> sendWater(bot, chatId), rand(0,900)*1000); // до 15 мин джиттер
    }, { timezone: tz });
  });

  // 3) Спокойной ночи (окно из плана)
  const [from, to] = u?.plan?.goodnight_window ?? ["22:50","23:10"]; // "HH:mm"
  const [fh,fm] = from.split(":").map(Number);
  cron.schedule(`${fm} ${fh} * * *`, () => {
    // джиттер до разницы между from и to
    const [th,tm] = to.split(":").map(Number);
    const windowSec = (th*60+tm - (fh*60+fm)) * 60;
    setTimeout(()=> sendGoodNight(bot, chatId), rand(0, Math.max(60, windowSec))*1000);
  }, { timezone: tz });

  // 4) Контроль окна тренировки — по-хорошему из расписания; MVP пропустим,
  //   но интерфейс оставим:
  //   cron at T-30 → напомнить; T+120 → проверить отчёт и "пнуть"
}

async function sendMorning(bot:TelegramBot, chatId:number){
  const u = await getUser(chatId); if(!u || mutedOrExpired(u)) return;
  const name = u.preferred_name || u.first_name || "друг";
  await bot.sendMessage(chatId, `Доброе утро, ${name}! Сегодня треня? Глянь план 👇`, { reply_markup:{ inline_keyboard: [[{text:"📅 Открыть план", callback_data:"open_plan"}]] }});
}
async function sendWater(bot:TelegramBot, chatId:number){
  const u = await getUser(chatId); if(!u || mutedOrExpired(u)) return;
  const goal = u?.plan?.water_goal_ml ?? 2300;
  const current = u?.water_today || 0;
  const left = Math.max(0, goal - current);
  await bot.sendMessage(chatId, `Водная проверка: +250 мл? (${current}/${goal} мл, осталось ~${left} мл)`, { disable_notification: true, reply_markup:{ inline_keyboard: [[{text:"+250 мл", callback_data:"water_250"}, {text:"+500 мл", callback_data:"water_500"}]] }});
}
async function sendGoodNight(bot:TelegramBot, chatId:number){
  const u = await getUser(chatId); if(!u || mutedOrExpired(u)) return;
  const lines = [
    "23:00 — время признать, что холодильник победил тебя… Спать! 😈",
    "Саркастичный кэп: мышцы растут во сне, а не в телефоне. Отбой.",
    "Завтра станешь сильнее. А сейчас — 🛌. Не спорь.",
  ];
  await bot.sendMessage(chatId, lines[Math.floor(Math.random()*lines.length)]);
}

function mutedOrExpired(u:any){
  const muted = u.mute_until && Date.now()<u.mute_until;
  const expired = (u.plan_status==="expired") || (u.plan_end && Date.now()>u.plan_end);
  return muted || expired;
}
