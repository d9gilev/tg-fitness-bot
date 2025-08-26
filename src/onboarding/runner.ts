import TelegramBot from "node-telegram-bot-api";
import { ONBOARDING_FLOW } from "./flow";
import { ensureUser } from "../storage";
import { createPlanFromGPT } from "../gpt";

interface OnboardingState {
  block: string;
  answers: Record<string, any>;
  qIndex?: number;
}

const S: Record<number, OnboardingState> = {}; // состояние по chatId

export function startOnboarding(bot:TelegramBot, chatId:number){
  console.log(`🚀 Запускаем онбординг для ${chatId}`);
  S[chatId] = { block: ONBOARDING_FLOW.start, answers:{} };
  console.log(`📝 Начальный блок: ${ONBOARDING_FLOW.start}`);
  sendBlock(bot, chatId);
}

export function isOnboarding(chatId:number){ return !!S[chatId]; }

export async function handleOnboardingAnswer(bot:TelegramBot, msg:TelegramBot.Message){
  const st = S[msg.chat.id]; if(!st) return false;
  const block = ONBOARDING_FLOW.blocks[st.block];
  const q = block.questions?.[st.qIndex || 0];
  if(q && q.saveAs){
    // простая запись ответа (single/number/text_short)
    const val = msg.text || msg.caption || "";
    st.answers[q.saveAs] = val;
    st.qIndex = (st.qIndex||0) + 1;
    if(block.questions && st.qIndex < block.questions.length) return sendBlock(bot, msg.chat.id);
  }
  // блок окончен
  const next = block.next || block.cta?.next;
  if(next==="END"){
    // сохраняем в юзера ключевые поля
    const save:Record<string,any> = st.answers;
    const name = save.preferred_name;
    const tz = save.tz || "Europe/Moscow";
    const plan = await createPlanFromGPT(save); // save — ответы онбординга
    const user = await ensureUser(msg.chat.id, { 
      preferred_name: name, 
      tz,
      plan_start: Date.now(), 
      plan_end: Date.now()+30*24*3600*1000, 
      plan_status:"active",
      plan,
      water_ml_goal: plan.water_goal_ml, // синхронизируем для обратной совместимости
    });
    delete S[msg.chat.id];
    await bot.sendMessage(msg.chat.id, `Готово, ${user.preferred_name||user.first_name}! Запускаю план на 30 дней.`, { parse_mode:"HTML" });
    return true;
  }
  if(next) {
    st.block = next; 
    st.qIndex = 0; 
    return sendBlock(bot, msg.chat.id);
  }
  return false;
}

function sendBlock(bot:TelegramBot, chatId:number){
  const st = S[chatId]; 
  const block = ONBOARDING_FLOW.blocks[st.block];
  console.log(`📋 Отправляем блок: ${st.block}`, block);
  
  if(block.infoHtml) {
    console.log(`ℹ️ Отправляем infoHtml`);
    bot.sendMessage(chatId, block.infoHtml, { parse_mode:"HTML" });
  }
  if(block.questions?.length){ 
    const q = block.questions[st.qIndex||0]; 
    console.log(`❓ Отправляем вопрос:`, q);
    if(q.prompt) bot.sendMessage(chatId, q.prompt, { parse_mode:"HTML" }); 
    return true; 
  }
  if(block.cta) {
    console.log(`🔘 Отправляем CTA`);
    bot.sendMessage(chatId, block.cta.text);
  }
  return true;
}
