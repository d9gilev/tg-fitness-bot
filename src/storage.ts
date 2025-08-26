import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";
import { nanoid } from "nanoid";

type FoodEntry = { id:string; ts:number; photos:string[]; text?:string;
  kcal?:number; protein_g?:number; carbs_g?:number; fat_g?:number };
type ReportEntry = { id:string; ts:number; kind:"workout"; text?:string; photos?:string[]; parsed?:any };

type User = {
  chatId:number; first_name?:string; preferred_name?:string;
  sex?:string; age?:number; tz?:string; quiet_hours?:string;
  goal?:string; reminder_mode?: "Soft"|"Hard"|"Выключено";
  days_per_week?:number; preferred_slots?:string[]; session_length?:string;
  water_ml_goal?: number; water_today?: number; mute_until?: number|null;
  plan_start?: number|null; plan_end?: number|null; plan_status?: "active"|"expired"|null;
  plan?: {
    daily_kcal: number|null;          // цель калорий
    protein_g_per_kg: number|null;    // напр. 1.6
    water_goal_ml: number;            // дневная цель воды
    meals_limit: number;              // лимит приёмов пищи в день
    goodnight_window: [string,string]; // ["22:50","23:10"]
  };
};

type DBSchema = {
  users: User[];
  food: { chatId:number; entry:FoodEntry }[];
  reports: { chatId:number; entry:ReportEntry }[];
};

const adapter = new JSONFile<DBSchema>("db/data.json");
export const db = new Low<DBSchema>(adapter, { users:[], food:[], reports:[] });

// Инициализация базы данных при первом запуске
export async function initDB() {
  await db.read();
  if (!Array.isArray(db.data.users)) {
    db.data.users = [];
  }
  if (!Array.isArray(db.data.food)) {
    db.data.food = [];
  }
  if (!Array.isArray(db.data.reports)) {
    db.data.reports = [];
  }
  await db.write();
}

export async function ensureUser(chatId:number, patch:Partial<User>={}){
  await db.read(); const found = db.data.users.find(u=>u.chatId===chatId);
  if(!found){ db.data.users.push({chatId, ...patch}); }
  else Object.assign(found, patch);
  await db.write(); return db.data.users.find(u=>u.chatId===chatId)!;
}

export async function getUser(chatId:number){ await db.read(); return db.data.users.find(u=>u.chatId===chatId) || null; }

export async function addFood(chatId:number, entry:Omit<FoodEntry,"id">){
  await db.read(); db.data.food.push({ chatId, entry:{ id:nanoid(), ...entry } }); await db.write();
}

export async function getFoodCountToday(chatId:number, dayKey:string, tz:string){
  await db.read();
  return db.data.food.filter(f=>f.chatId===chatId && dayKeyOf(f.entry.ts, tz)===dayKey).length;
}

export async function getFoodSummaryToday(chatId:number, dayKey:string, tz:string){
  await db.read();
  const list = db.data.food.filter(f=>f.chatId===chatId && dayKeyOf(f.entry.ts, tz)===dayKey).map(x=>x.entry);
  if(!list.length) return "";
  return "Сегодняшние приёмы:\n" + list.map((e,i)=>`${i+1}) ${e.text?.slice(0,80)||"без подписи"}`).join("\n");
}

export async function getFoodTotalsToday(chatId:number, dayKey:string, tz:string){
  await db.read();
  const list = db.data.food.filter(f=>f.chatId===chatId && dayKeyOf(f.entry.ts, tz)===dayKey).map(x=>x.entry);
  const sum = { kcal:0, p:0, c:0, f:0 };
  for(const e of list){
    sum.kcal += e.kcal||0; sum.p += e.protein_g||0; sum.c += e.carbs_g||0; sum.f += e.fat_g||0;
  }
  return sum;
}

// утилита (вынесем здесь для простоты)
import dayjs from "dayjs"; import utc from "dayjs/plugin/utc"; import tzp from "dayjs/plugin/timezone";
dayjs.extend(utc); dayjs.extend(tzp);
export function dayKeyOf(ts:number, tz:string){ return dayjs(ts).tz(tz||"Europe/Moscow").format("YYYY-MM-DD"); }
