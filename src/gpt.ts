export async function foodFeedback({user,note,photos}:{user:any; note?:string; photos?:string[]}){
  const kcal = user?.plan?.daily_kcal;
  const prot = user?.plan?.protein_g_per_kg;
  const name = user?.preferred_name || "друг";
  return [
    `🍽️ ${name}, приём учтён.`,
    kcal ? `• Цель по калориям: ~${kcal} ккал/день.` : "",
    prot ? `• Белок: ~${prot} г/кг/сут (ориентир).` : "",
    "• Фото БЖУ или цифры в подписи ускоряют оценку.",
    note ? `• Комментарий учёл: «${note.slice(0,120)}»` : ""
  ].filter(Boolean).join("\n");
}

export async function createPlanFromGPT(user: any){
  // Пока без реального GPT: вернём дефолт, позже подключим Responses API.
  return {
    daily_kcal: user.goal === "Похудение" ? 2100 : 2500,
    protein_g_per_kg: 1.6,
    water_goal_ml: 2300,
    meals_limit: 4,
    goodnight_window: ["22:50","23:10"] as [string, string],
  };
}
