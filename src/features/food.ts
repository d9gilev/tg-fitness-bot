import TelegramBot from "node-telegram-bot-api";
import { addFood, dayKeyOf, getFoodCountToday, getFoodSummaryToday, getFoodTotalsToday, getUser } from "../storage";
import { foodIKB } from "../keyboards";
import { foodFeedback } from "../gpt";

// Парсинг БЖУ из текста
function parseNutritionFromText(text: string): { kcal?: number; protein_g?: number; carbs_g?: number; fat_g?: number } {
  const result: { kcal?: number; protein_g?: number; carbs_g?: number; fat_g?: number } = {};
  
  // Парсим калории: 520 ккал, 520ккал, 520 калорий
  const kcalMatch = text.match(/(\d+)\s*(?:ккал|калорий)/i);
  if (kcalMatch) result.kcal = parseInt(kcalMatch[1]);
  
  // Парсим белки: Б18, Б 18, белок 18г, белок18
  const proteinMatch = text.match(/[Бб](?:елки?)?\s*(\d+)(?:г)?/);
  if (proteinMatch) result.protein_g = parseInt(proteinMatch[1]);
  
  // Парсим жиры: Ж14, Ж 14, жиры 14г, жир14
  const fatMatch = text.match(/[Жж](?:иры?)?\s*(\d+)(?:г)?/);
  if (fatMatch) result.fat_g = parseInt(fatMatch[1]);
  
  // Парсим углеводы: У72, У 72, углеводы 72г, угл72
  const carbsMatch = text.match(/[Уу](?:глеводы?)?\s*(\d+)(?:г)?/);
  if (carbsMatch) result.carbs_g = parseInt(carbsMatch[1]);
  
  return result;
}

export function registerFood(bot:TelegramBot){
  bot.on("message", async (msg) => {
    if(!msg.text) return; if(msg.text !== "🍽️ Еда") return;
    const u = await getUser(msg.chat.id);
    const FOOD_LIMIT = u?.plan?.meals_limit ?? 4;
    const tz = u?.tz || "Europe/Moscow";
    const key = dayKeyOf(Date.now(), tz);
    const used = await getFoodCountToday(msg.chat.id, key, tz);
    if(used>=FOOD_LIMIT){
      return bot.sendMessage(msg.chat.id, `На сегодня лимит приёмов пищи исчерпан (${FOOD_LIMIT}/${FOOD_LIMIT}).`, { reply_markup: foodIKB });
    }
    await bot.sendMessage(msg.chat.id, `Пришли скрин(ы) еды одним сообщением (можно альбом) + короткий коммент. Осталось: ${FOOD_LIMIT-used}/${FOOD_LIMIT}.`, { reply_markup: foodIKB });
    // пометим, что ждём следующее сообщение как еду
    (bot as any)._expectFood = (bot as any)._expectFood || {};
    (bot as any)._expectFood[msg.chat.id] = true;
  });

  bot.on("photo", async (msg) => handleFoodPayload(bot, msg));
  bot.on("document", async (msg) => handleFoodPayload(bot, msg));
  bot.on("text", async (msg) => {
    // если ждём еду и пришёл текст — тоже считаем как запись с комментом
    if((bot as any)._expectFood?.[msg.chat.id]) await handleFoodPayload(bot, msg);
  });
}

async function handleFoodPayload(bot:TelegramBot, msg:TelegramBot.Message){
  if(!(bot as any)._expectFood?.[msg.chat.id]) return;
  const u = await getUser(msg.chat.id);
  const FOOD_LIMIT = u?.plan?.meals_limit ?? 4;
  const tz = u?.tz || "Europe/Moscow";
  const key = dayKeyOf(Date.now(), tz);
  const used = await getFoodCountToday(msg.chat.id, key, tz);
  if(used>=FOOD_LIMIT){
    (bot as any)._expectFood[msg.chat.id] = false;
    return bot.sendMessage(msg.chat.id, `Лимит ${FOOD_LIMIT}/день. Завтра продолжим 👌`);
  }

  const photos:string[] = [];
  if("photo" in msg && msg.photo?.length){ const v = msg.photo[msg.photo.length-1]; photos.push(v.file_id); }
  if("document" in msg && msg.document?.mime_type?.startsWith("image/")) photos.push(msg.document.file_id);
  const text = msg.caption || msg.text || "";

  // Парсим БЖУ из текста
  const nutritionData = parseNutritionFromText(text);
  
  await addFood(msg.chat.id, { 
    ts: Date.now(), 
    photos, 
    text,
    ...nutritionData
  });
  (bot as any)._expectFood[msg.chat.id] = false;

  const fb = await foodFeedback({ user:u, note:text, photos });
  await bot.sendMessage(msg.chat.id, fb, { parse_mode:"HTML" });

  const left = FOOD_LIMIT - (used+1);
  await bot.sendMessage(msg.chat.id, `Записал приём пищи. Осталось: ${left}/${FOOD_LIMIT}.`);
}

// Итоги дня (inline кнопка)
export function registerFoodCallbacks(bot:TelegramBot){
  bot.on("callback_query", async (q) => {
    if(!q.data) return;
    if(q.data==="food_add"){
      (bot as any)._expectFood = (bot as any)._expectFood || {};
      (bot as any)._expectFood[q.message!.chat.id] = true;
      await bot.answerCallbackQuery(q.id);
      await bot.sendMessage(q.message!.chat.id, "Жду скрин(ы) еды одним сообщением. Можно с подписью.");
    }
    if(q.data==="food_summary"){
      const u = await getUser(q.message!.chat.id); 
      const tz = u?.tz || "Europe/Moscow";
      const key = dayKeyOf(Date.now(), tz);
      const planKcal = u?.plan?.daily_kcal ?? null;
      const t = await getFoodTotalsToday(q.message!.chat.id, key, tz);
      await bot.answerCallbackQuery(q.id);
      await bot.sendMessage(q.message!.chat.id,
        `Итоги: ${t.kcal|0} ккал` + (planKcal ? ` / цель ${planKcal}`:"") +
        `\nБ:${t.p|0}г Ж:${t.f|0}г У:${t.c|0}г`);
    }
  });
}
