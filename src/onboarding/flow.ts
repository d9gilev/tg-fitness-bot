interface OnboardingQuestion {
  id: string;
  prompt?: string;
  type: string;
  saveAs?: string;
  required?: boolean;
  validate?: any;
  options?: string[];
  placeholder?: string;
  showIf?: any;
  infoHtml?: string;
  okText?: string;
  valueOnOk?: string;
}

interface OnboardingBlock {
  title: string;
  questions?: OnboardingQuestion[];
  infoHtml?: string;
  cta?: {
    text: string;
    next: string;
  };
  next?: string;
}

export const ONBOARDING_FLOW: {
  version: number;
  start: string;
  blocks: Record<string, OnboardingBlock>;
} = {
  version: 2,
  start: "PRE_NAME",
  blocks: {
    // --- Имя пользователя
    PRE_NAME: {
      title: "Как тебя зовут?",
      questions: [
        { id: "N1", prompt: "Имя или как к тебе обращаться", type: "text_short",
          saveAs: "preferred_name", required: true, validate: { maxLen: 30 } }
      ],
      next: "PRE_IDENTITY"
    },

    // --- Пре-инфо и два первых вопроса (возраст, пол)
    PRE_INFO: {
      title: "Начинаем",
      infoHtml: [
        "<b>Перед тем как собрать тебе персональный план на 4 недели, мне нужно коротко узнать про здоровье, опыт, цели и инвентарь.</b>",
        'Это нужно, чтобы подобрать безопасную интенсивность по принципам предскрининга (ACSM/PAR-Q+) и рекомендациям ВОЗ (150–300 мин/нед умеренной активности + силовые ≥2 р/нед).',
        "Анкета займёт 2–3 минуты. Это не мед. консультация; при симптомах — к врачу."
      ].join("\n"),
      cta: { text: "OK", next: "PRE_NAME" }
    },

    PRE_IDENTITY: {
      title: "Кто ты",
      questions: [
        { id: "P1", prompt: "Возраст (лет)", type: "number",
          saveAs: "age", required: true, validate: { min: 14, max: 90 } },
        { id: "P2", prompt: "Пол", type: "single",
          options: ["М", "Ж"], saveAs: "sex", required: true }
      ],
      next: "A_SAFETY"
    },

    // --- А) Безопасность
    A_SAFETY: {
      title: "Безопасность",
      questions: [
        { id: "A1", prompt: "Есть ли диагностированные проблемы сердца/сосудов/обмена/почек <u>или</u> симптомы при нагрузке (боль в груди, одышка без причины, обмороки, отёки)?",
          type: "single", options: ["Нет", "Да"], saveAs: "medical_flags", required: true },
        { id: "A2", prompt: "Принимаешь лекарства, влияющие на пульс/давление (β-блокаторы и т.п.)?",
          type: "single", options: ["Нет", "Да"], saveAs: "meds_affecting_ex", required: true },

        // 3) Свертываемость крови
        { id: "A3", prompt: "Есть нарушения свёртываемости крови <u>или</u> принимаешь антикоагулянты?",
          type: "single", options: ["Нет", "Да"], saveAs: "clotting_issue", required: true },

        // 4) Беременность — показываем только женщинам
        { id: "A4", prompt: "Беременность/послеродовый период?",
          type: "single", options: ["Не актуально", "Актуально"], saveAs: "pregnancy_status",
          required: true, showIf: { field: "sex", equals: "Ж" } },

        // любые травмы/операции
        { id: "A5", prompt: "Травмы/операции за 12 мес? Движения/упражнения, которые вызывают боль?",
          type: "text_short", placeholder: "Напр.: колено — избегать глубоких приседов",
          saveAs: "injury_notes", required: false, validate: { maxLen: 200 } },

        // 7) подтверждение-инфо с кнопкой OK
        { id: "A7", type: "info_ok",
          infoHtml: "Если ты <b>знаешь</b>, что тебе нужно пройти медосмотр перед занятием спортом (в том числе тяжёлые тренировки), <b>обязательно пройди его</b>.",
          okText: "OK", saveAs: "med_exam_ack", valueOnOk: "ack" }
      ],
      next: "B_GOALS_INTRO"
    },

    // --- Инфо-врезка + Блок целей
    B_GOALS_INTRO: {
      title: "О целях",
      infoHtml: [
        "Пару слов перед целями:",
        '• Предскрининг: <a href="https://eparmedx.com/?page_id=79">PAR-Q+</a>, <a href="https://pubmed.ncbi.nlm.nih.gov/26473759/">ACSM 2015</a>.',
        '• Активность взрослых: <a href="https://bjsm.bmj.com/content/54/24/1451">ВОЗ 2020</a> — 150–300 мин умеренной аэробной нагрузки + силовые ≥2 р/нед.'
      ].join("\n"),
      cta: { text: "Погнали к целям", next: "B_GOALS" }
    },

    B_GOALS: {
      title: "Цели на месяц",
      questions: [
        // 8) главная цель — кнопки
        { id: "B1", prompt: "Главная цель:",
          type: "single", saveAs: "goal", required: true,
          options: ["Похудение", "Набор мышечной массы", "Поддержание здоровья и самочувствия", "Увеличение производительности"] },

        // 9) вторичные цели — кнопки мультивыбор
        { id: "B2", prompt: "Вторичные цели (можно несколько):",
          type: "multi", saveAs: "secondary_goals", required: false,
          options: ["Сила", "Выносливость", "Техника", "Осанка/спина", "Меньше боли"], validate: { maxSelect: 3 } },

        { id: "B3", prompt: "Как поймём, что месяц прошёл удачно? (измеримо)",
          type: "text_short", placeholder: "Напр.: −2 кг, +2 подтягивания, 10k шагов ежедневно",
          saveAs: "goal_kpi", required: true, validate: { maxLen: 120 } }
      ],
      next: "C_PROFILE"
    },

    // --- C) Профиль/опыт/RPE
    C_PROFILE: {
      title: "Профиль",
      questions: [
        { id: "C1", prompt: "Уровень в силовых", type: "single",
          options: ["Новичок", "Средний", "Продвинутый"], saveAs: "level", required: true },
        { id: "C2", prompt: "Стаж/перерывы (коротко)",
          type: "text_short", placeholder: "Напр.: 6 мес, перерыв 3 мес",
          saveAs: "training_history", required: false, validate: { maxLen: 100 } },
        { id: "C3", prompt: "Знаешь шкалу усилий RPE (0–10) и готов(а) ею пользоваться?",
          type: "single", options: ["Да", "Нет"], saveAs: "rpe_ready", required: true }
      ],
      next: "D_LOGISTICS"
    },

    // --- D) Логистика/инвентарь
    D_LOGISTICS: {
      title: "Логистика",
      questions: [
        // 17) свободное число дней
        { id: "D1", prompt: "Сколько дней в неделю реально хочется тренироваться?",
          type: "number", saveAs: "days_per_week", required: true, validate: { min: 1, max: 6 } },

        { id: "D2", prompt: "Предпочтительные дни/время",
          type: "multi", saveAs: "preferred_slots", required: false,
          options: ["Пн","Вт","Ср","Чт","Пт","Сб","Вс","Утро","День","Вечер"], validate: { maxSelect: 5 } },

        // 19) длительность по кнопкам
        { id: "D3", prompt: "Желаемая длительность одной тренировки:",
          type: "single", saveAs: "session_length", required: true,
          options: ["60 мин","75 мин","90 мин"] },

        { id: "D4", prompt: "Где тренируешься и что доступно?",
          type: "multi", saveAs: "equipment", required: true,
          options: ["Дом","Зал","Улица","Штанга","Гантели","Тренажёры","Турник","Эспандеры","Дорожка/вело","Бассейн"], validate: { maxSelect: 8 } },

        // 21–22) кнопка «ограничений нет / есть»
        { id: "D5", prompt: "Есть ли ограничения по инвентарю/движениям?",
          type: "single", options: ["Ограничений нет","Есть ограничения"], saveAs: "equip_limits_flag", required: true },
        { id: "D6", prompt: "Опиши ограничения (если есть)",
          type: "text_short", placeholder: "Напр.: нет лавки; бег нельзя",
          saveAs: "equipment_limits", required: false, showIf: { field: "equip_limits_flag", equals: "Есть ограничения" }, validate: { maxLen: 120 } }
      ],
      next: "D_TZ"
    },

    // --- Временная зона и тихие часы
    D_TZ: {
      title: "Время и тишина",
      questions: [
        { id: "TZ1", prompt: "Часовой пояс", type: "single", saveAs: "tz", required: true,
          options: ["Europe/Moscow","Europe/Amsterdam","Asia/Almaty","Другое"] },
        { id: "TZ2", prompt: "Тихие часы (не беспокоить)",
          type: "single", saveAs: "quiet_hours", required: true,
          options: ["22:00–08:00","23:00–07:00","Свои"] }
      ],
      next: "E_PREFERENCES"
    },

    // --- E) Предпочтения
    E_PREFERENCES: {
      title: "Предпочтения",
      questions: [
        { id: "E1", prompt: "Что НЕ нравится/вызывает дискомфорт?",
          type: "multi", saveAs: "dislikes", required: false,
          options: ["Бег","Выпады","Скручивания","Планка","Становая","Присед","Жим лёжа","Другое"], validate: { maxSelect: 5 } },
        { id: "E2", prompt: "Что нравится из кардио?",
          type: "multi", saveAs: "cardio_pref", required: false,
          options: ["Ходьба в горку","Вело","Эллипс","Гребля","Плавание"], validate: { maxSelect: 3 } }
      ],
      next: "F_NUTRITION_INTRO"
    },

    // --- Инфо-врезка перед питанием (1.6 г/кг)
    F_NUTRITION_INTRO: {
      title: "Перед питанием",
      infoHtml: [
        "Для роста/сохранения мышц при силовых исследования показывают плато эффективности около <b>~1.6 г белка/кг/сут</b> (некоторым — чуть выше).",
        'Источник: <a href="https://pubmed.ncbi.nlm.nih.gov/28698222/">Morton et al., 2018</a> / <a href="https://bjsm.bmj.com/content/52/6/376.abstract">BJSM</a>.'
      ].join("\n"),
      cta: { text: "Дальше", next: "F_NUTRITION" }
    },

    F_NUTRITION: {
      title: "Питание",
      questions: [
        { id: "F1", prompt: "Пищевые ограничения?",
          type: "multi", saveAs: "diet_limits", required: true,
          options: ["Нет","Вегетарианство","Веганство","Аллергии","Религиозные"], validate: { maxSelect: 3 } },
        { id: "F2", prompt: "Готов(а) считать БЖУ/ккал?",
          type: "single", saveAs: "track_style", required: true,
          options: ["Да","Нет","Только калории","Только белок"] },
        { id: "F3", prompt: "Сколько приёмов пищи удобно?",
          type: "single", saveAs: "meals_per_day", required: true,
          options: ["2","3","4","5+"] }
      ],
      next: "G_RECOVERY_INTRO"
    },

    // --- Инфо-врезка перед сном/NEAT
    G_RECOVERY_INTRO: {
      title: "Перед сном и NEAT",
      infoHtml: [
        "Взрослым рекомендуется <b>7+ часов сна</b> на регулярной основе; недосып ухудшает восстановление.",
        'Источники: <a href="https://aasm.org/seven-or-more-hours-of-sleep-per-night-a-health-necessity-for-adults/">AASM/SRS</a>, <a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC4434546/">консенсус SLEEP</a>.',
        'ВОЗ также рекомендует уменьшать сидячее поведение и наращивать регулярную активность: <a href="https://bjsm.bmj.com/content/54/24/1451">Guidelines 2020</a>.'
      ].join("\n"),
      cta: { text: "Ок, дальше", next: "G_RECOVERY" }
    },

    G_RECOVERY: {
      title: "Сон, стресс, активность",
      questions: [
        { id: "G1", prompt: "Сон (ср. часов/ночь)",
          type: "single", saveAs: "sleep_hours", required: true,
          options: ["<6","6–7","7–8","8+"] },
        { id: "G2", prompt: "Стресс/смены/ночные?",
          type: "single", saveAs: "stress_level", required: true,
          options: ["Нет","Иногда","Часто"] },
        { id: "G3", prompt: "Средняя дневная активность (шаги)",
          type: "single", saveAs: "steps_level", required: true,
          options: ["<5k","5–8k","8–11k",">11k"] }
      ],
      next: "H_CARDIO"
    },

    // --- H) Кардио/шаги/плавание
    H_CARDIO: {
      title: "Кардио и шаги",
      questions: [
        { id: "H1", prompt: "Согласен(на) на Z2-кардио 20–30 мин после силовой?",
          type: "single", saveAs: "z2_after_lifts", required: true, options: ["Да","Нет"] },
        { id: "H2", prompt: "Плавание доступно 1–2×/нед по 20–30 мин?",
          type: "single", saveAs: "swim_ok", required: true, options: ["Да","Нет"] },
        { id: "H3", prompt: "Цель по шагам 8–10k/день — ок?",
          type: "single", saveAs: "steps_goal_ok", required: true, options: ["Да","Нет"] }
      ],
      next: "I_SUPP_REPORTING_INTRO"
    },

    // --- Инфо-врезка: как будет работать напоминалка/отчёты/пинки
    I_SUPP_REPORTING_INTRO: {
      title: "Как будем работать дальше",
      infoHtml: [
        "Будь готов(а), что <b>я буду напоминать о тренировках</b>, «пинать» за пропуски и <b>подбадривать</b> за соблюдение режима.",
        "Можно присылать отчёты как кнопками (еда/тренировка), так и детальным текстом/скрином (например, Apple Watch/приложения) — я учту это персонально.",
      ].join("\n"),
      cta: { text: "Ок, понял(а)", next: "I_SUPP_REPORTING" }
    },

    // --- J) Добавки + отчётность/пересборки/согласия
    I_SUPP_REPORTING: {
      title: "Финальные настройки",
      questions: [
        { id: "J1", prompt: "Креатин 3–5 г/д — ок?",
          type: "single", saveAs: "creatine_ok", required: true, options: ["Да","Нет"] },
        { id: "J2", prompt: "Омега-3/витамин D уже принимаешь?",
          type: "single", saveAs: "omega_vitd", required: true,
          options: ["Нет","Да, омега-3","Да, вит.D","Да, оба"] },

        // отчётность/пересборки
        { id: "K1", prompt: "Как удобнее отчитываться?",
          type: "single", saveAs: "report_style", required: true,
          options: ["Сразу после тренировки","Один раз вечером"] },
        { id: "K2", prompt: "Пересборка плана целиком до 2–3 раз/мес — ок?",
          type: "single", saveAs: "plan_rebuilds_ok", required: true, options: ["Да","Нет"] },
        { id: "K3", prompt: "Точечные замены в сессии (1–2 упр.) — ок?",
          type: "single", saveAs: "micro_swaps_ok", required: true, options: ["Да","Нет"] },

        // дедлайны/пинки/дисклеймер
        { id: "L1", prompt: "Есть жёсткие дедлайны или поездки в этом месяце?",
          type: "text_short", saveAs: "month_constraints", required: false, validate: { maxLen: 120 } },
        { id: "L2", prompt: "Режим напоминаний/«пинков»:",
          type: "single", saveAs: "reminder_mode", required: true, options: ["Soft","Hard","Выключено"] },
        { id: "L3", prompt: "Это не мед. рекомендация. При тревожных симптомах — к врачу.",
          type: "single", saveAs: "medical_disclaimer", required: true, options: ["Согласен(на)"] }
      ],
      next: "END"
    }
  }
};
