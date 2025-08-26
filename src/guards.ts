import { getUser, ensureUser } from "./storage";

export async function guardUser(chatId:number, from?:{first_name?:string}){
  const u = await getUser(chatId);
  if(!u){
    return ensureUser(chatId, { first_name: from?.first_name, water_ml_goal: 2300, water_today: 0, plan_status:null, mute_until:null });
  }
  return u;
}

export function isMuted(u:any){ return u.mute_until && Date.now() < u.mute_until; }
export function isExpired(u:any){ return u.plan_status==="expired" || (u.plan_end && Date.now() > u.plan_end); }
