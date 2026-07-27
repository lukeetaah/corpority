export type Locale = "es-AR" | "en";
export type Stat = "salary" | "health" | "reputation" | "energy" | "motivation" | "influence" | "savings";
export type Changes = Partial<Record<Stat, number>>;

export type Choice = { label: string; consequence: string; changes: Changes; tag?: string; skipTurns?: number; item?: string; delayed?: { turns: number; title: string; message: string; changes: Changes } };
export type CorporateEvent = { id: string; title: string; description: string; category: string; changes: Changes; choices?: Choice[]; rarity: "common" | "uncommon" | "rare" | "legendary" };
type Situation = readonly [string, string];

const situations: Record<Locale, readonly Situation[]> = {
  en: [
    ["Calendar Ambush", "You were added to a two-hour meeting with no topic and fifteen attendees."],
    ["Reply All Incident", "Someone sent an email to the whole company by accident, creating a chaotic chain reaction."],
    ["New Boss Announcement", "Leadership promised to 'do more with less,' effectively doubling your daily workload."],
    ["Boss Inspection Walkthrough", "Upper management is visiting today. Everyone is suddenly pretending to be extremely busy."],
    ["The New Work Method", "A consultant introduced a complicated new process that makes simple tasks take twice as long."],
    ["Coffee Machine Breakdown", "The office coffee machine broke down, creating small informal groups negotiating over hot water."],
    ["'Voluntary' Work Event", "You were invited to an after-work activity described as optional, but attendance is secretly logged."],
    ["Forgotten Email Resurfaces", "An email from six months ago resurfaced marked 'urgent' by a new supervisor."],
    ["Extra Unpaid Work", "A five-minute task grew into a major project with tighter deadlines and no pay raise."],
    ["Team Building Workshop", "You spent three hours sticking colored notes on a wall instead of finishing your real work."],
    ["Key Teammate Left", "The most experienced person on the team resigned, leaving all unorganized files to you."],
    ["No Budget Allowed", "Finance announced that there is zero budget for raises, office supplies, or travel for the rest of the year."],
    ["Computer Password Blocked", "Your computer password expired right as you were about to present your work."],
    ["Company Achievement Speech", "The company announced record profits while simultaneously asking employees to 'tighten their belts.'"],
    ["Offsite Team Activity", "You have to travel two hours outside work hours for mandatory team-bonding exercises."],
    ["Priority Switch", "Yesterday's top-priority emergency is today's completely ignored task."],
    ["Public Thank-You Email", "A company-wide thank-you message praised everyone except the person who actually did the work."],
    ["Endless Permission Signoffs", "You need signoffs from three different managers just to buy a basic office supply."],
    ["Annual Review Form", "Your manager rates your entire year using a confusing rating scale nobody understands."],
    ["Pushy Vendor Demo", "A pushy salesman dragged you into a presentation, wasting your entire morning."],
    ["Noisy Workspace", "Three loud phone calls are happening right next to your desk, making it impossible to focus."],
    ["Layoff Rumors", "Managers are locking themselves in glass rooms and whispering, creating widespread anxiety."],
    ["Creativity Challenge", "You are asked for brilliant, game-changing ideas but given zero budget to implement them."],
    ["Stolen Idea", "A coworker presented your exact suggestion from last week as if they just invented it."],
    ["Mandatory Training Module", "You must complete a two-hour obvious safety quiz while your urgent tasks pile up."],
    ["Awkward Question Moment", "The big boss asks if anyone has questions, and everyone stays completely silent in fear."],
    ["Remote Work Exception Request", "You requested one day working from home and were asked for endless forms and justifications."],
    ["Messy Spreadsheet Handover", "You were handed a massive spreadsheet with fourteen tabs and zero explanations."],
    ["End-of-Month Rush", "Everything is suddenly urgent because the month is ending and numbers need to be closed."],
    ["Over-Energetic New Boss", "Your new manager wants daily check-in meetings with everyone to 'build trust.'"],
    ["Already-Failed Project", "You were offered leadership of a project that has already failed twice with previous managers."],
    ["Clashing Boss Demands", "Two different supervisors gave you contradictory urgent deadlines for the exact same hour."],
    ["Vacation Date Block", "Your vacation request was flagged because it overlaps with a major delivery week."],
    ["Career Progress Chat", "Your manager asks about your five-year plan while subtly checking their phone."],
    ["Quick Stress Webinar", "In the middle of a chaotic day, an email invites you to a 10-minute mindfulness webinar."],
    ["Minor Issue Escalation", "A small mistake in an email reached the top director's inbox."],
    ["Rent Increase Notice", "Your landlord sent a renewal notice with a price increase higher than your annual raise."],
    ["Grocery Price Shock", "Your weekly grocery bill consumed a scary portion of your monthly paycheck."],
    ["Recruiter Outreach", "A recruiter messages you on LinkedIn offering a chat about a position at another company."],
    ["Mild Workday Illness", "You woke up feeling sick, but taking a day off feels harder than pushing through."],
    ["Moving Weekend Launch", "Your lease ends on the exact same weekend your team scheduled a major work release."],
    ["Non-Refundable Deposit", "You need to pay for your vacation spot before HR formally approves your days off."],
    ["Family Dinner Messages", "You are at dinner with loved ones but can't stop checking work group chats."],
    ["Transit Strike Morning", "Public transport is down, turning your morning commute into a chaotic puzzle."],
    ["Emergency Appliance Repair", "Your washing machine broke down, forcing you to tap into your emergency savings."],
    ["Weekend Freelance Gig", "An ex-coworker offers paid weekend work that fixes a bill but ruins your rest."],
    ["Doctor's Appointment Clash", "A medical appointment you waited months for falls right during a mandatory team meeting."],
    ["Layoff Anxiety Wave", "Rumors about budget cuts make you re-evaluate every single monthly expense."]
  ],
  "es-AR": [
    ["Emboscada de calendario", "Te clavaron una reunión de dos horas sin tema claro y con quince personas."],
    ["Incidente de responder a todos", "Alguien mandó un mail a todo el mundo por error y se armó un lío bárbaro."],
    ["Cambio de autoridades", "Los nuevos jefes prometieron 'hacer más con menos' y se duplicó la carga de trabajo."],
    ["Inspección de los jefes", "Vienen a recorrer la oficina. De repente todos tienen que simular que están super ocupados."],
    ["El método nuevo", "Presentaron una forma nueva de trabajar que complica todo y nadie sabe bien cómo usar."],
    ["Diplomacia de la cafetera", "Se rompió la cafetera del trabajo y la gente empieza a discutir por el agua caliente."],
    ["Evento 'voluntario'", "Te invitaron a una actividad fuera de hora que dicen que es opcional, pero anotan quién va."],
    ["Mensaje del pasado", "Resurgió un pedido de hace seis meses que alguien olvidó y ahora es súper urgente."],
    ["Trabajo extra acumulado", "Un pedido que era de cinco minutos se convirtió en un proyecto gigante sin más sueldo."],
    ["Taller de integración", "Pasás tres horas pegando papelitos de colores en una pared en vez de avanzar con lo tuyo."],
    ["Renuncia clave", "Se fue la persona que más sabía del equipo y te dejaron todos los temas sueltos a vos."],
    ["Sin presupuesto", "Finanzas anunció que no hay plata para aumentos ni gastos por el resto del año."],
    ["Computadora bloqueada", "Se te bloqueó la contraseña justo cuando tenías que mostrar tu trabajo."],
    ["Anuncio general", "La empresa anuncia ganancias récord pero pide a los empleados 'hacer un esfuerzo y ajustarse'."],
    ["Jornada fuera de hora", "Te hacen viajar dos horas fuera de tu horario para hacer juegos de equipo."],
    ["Cambio de prioridad", "Lo que ayer era urgente e innegociable hoy a nadie le importa."],
    ["El mensaje de agradecimiento", "Mandan un mail felicitando a todo el equipo pero se olvidan de nombrar a quien hizo el trabajo."],
    ["Trámites interminables", "Necesitás tres firmas y dos permisos aprobados solo para comprar un insumo básico."],
    ["Evaluación de desempeño", "Tu jefe evalúa tu año de trabajo con una planilla confusa que nadie entiende."],
    ["Vendedor pesado", "Vino un proveedor a mostrar un producto nuevo y perdiste la mañana escuchándolo."],
    ["Ruido en la oficina", "Tenés tres llamadas ruidosas a medio metro y es imposible concentrarte."],
    ["Rumores de despidos", "Los jefes se encierran a hablar a puertas cerradas y nadie explica qué pasa."],
    ["Desafío de creatividad", "Te piden ideas brillantes sin poner un peso de presupuesto."],
    ["La idea robada", "Un compañero presentó en una reunión la misma propuesta que vos habías hecho la semana pasada."],
    ["Capacitación obligatoria", "Tenés que completar un curso de dos horas con preguntas obvias mientras se junta el trabajo."],
    ["Pregunta incómoda", "El jefe pide 'preguntas con libertad' en la reunión y todos se quedan callados por miedo."],
    ["Permiso para home office", "Pediste trabajar desde casa un día y te pidieron hasta certificado de nacimiento."],
    ["Planilla sin dueño", "Te mandaron un archivo gigante lleno de pestañas sin explicarte qué tenés que hacer."],
    ["Heroísmo de fin de mes", "Todo se vuelve urgente porque cambia el mes y hay que cerrar los números."],
    ["Jefe nuevo con energía", "Tu nuevo jefe quiere reuniones individuales todos los días para 'generar confianza'."],
    ["El proyecto quemado", "Te ofrecen hacerte cargo de una tarea que ya fracasó dos veces antes."],
    ["Pelea de jefes", "Dos superiores te piden cosas opuestas para la misma hora y tenés que quedar bien con los dos."],
    ["Vacaciones trabadas", "Pediste tus días de descanso pero justo coincide con una entrega urgente."],
    ["Charla sobre tu futuro", "Tu jefe te pregunta dónde te ves en cinco años mientras mira su celular disimuladamente."],
    ["Taller de relajación", "En medio de un día caótico te invitan a una charla de 10 minutos para 'manejar el estrés'."],
    ["El problema escalado", "Un error tonto en un mensaje llegó a la casilla del gerente general."],
    ["Aumento del alquiler", "Te mandaron el aviso de aumento de alquiler y supera tu sueldo mensual."],
    ["Supermercado carísimo", "La compra de comida de la semana te comió la mitad del sueldo."],
    ["Oferta de trabajo", "Un reclutador te escribe por LinkedIn para ofrecerte una entrevista en otra empresa."],
    ["Fiebre de semana", "Te levantás enfermo pero no podés faltar porque se cae todo el trabajo."],
    ["Mudanza apurada", "Tenés que mudarte el mismo fin de semana que te piden hacer horas extras."],
    ["Seña de vacaciones", "Tenés que congelar una reserva de vacaciones antes de que te aprueben los días."],
    ["Cena interrumpida", "Estás cenando con tu familia y no podés parar de contestar mensajes del trabajo."],
    ["Problemas de transporte", "Hay paro de transporte o problemas en la calle y no sabés cómo vas a llegar."],
    ["Gasto inesperado", "Se te rompió un electrodoméstico o el auto y tenés que usar tus ahorros."],
    ["Changa de fin de semana", "Un conocido te ofrece un trabajo extra pagado para el fin de semana."],
    ["Turno médico", "Conseguiste un turno médico tras meses de espera y cae justo en una reunión obligatoria."],
    ["Temor a los recortes", "Escuchás rumores de ajustes y empezás a revisar tus cuentas por si te quedás sin trabajo."]
  ],
};

const twists: Record<Locale, readonly Changes[]> = {
  en: [{ reputation: 4, energy: -2 }, { energy: 2, motivation: -1 }, { reputation: 3, influence: 2 }, { savings: -2, reputation: -1 }, { influence: 4, health: -2 }, { energy: -4, motivation: -3 }, { motivation: 3, reputation: 2 }, { energy: -3, influence: 1 }, { influence: 3, savings: 2 }, { reputation: 4, motivation: 2 }],
  "es-AR": [{ reputation: 4, energy: -2 }, { energy: 2, motivation: -1 }, { reputation: 3, influence: 2 }, { savings: -2, reputation: -1 }, { influence: 4, health: -2 }, { energy: -4, motivation: -3 }, { motivation: 3, reputation: 2 }, { energy: -3, influence: 1 }, { influence: 3, savings: 2 }, { reputation: 4, motivation: 2 }],
};

const outcomeGroups = ["meeting", "incident", "reorg", "leadership", "leadership", "social", "fun", "workload", "workload", "meeting", "credit", "reorg", "incident", "fun", "social", "workload", "credit", "systems", "review", "social", "social", "reorg", "leadership", "credit", "incident", "meeting", "boundary", "systems", "workload", "meeting", "credit", "politics", "boundary", "review", "wellbeing", "politics", "life", "life", "life", "life", "life", "life", "life", "life", "life", "life", "life", "life"] as const;
const outcomes: Record<Locale, Record<string, string[]>> = {
  "es-AR": {
    meeting: ["La reunión termina sin ninguna decisión concreta y se agenda otra para la semana que viene.", "Alguien promete resolverlo en privado y nunca más habla del tema.", "Te recargan a vos con una tarea que nadie quiso tomar."],
    incident: ["Lográs solucionar el tema pero te queda el cansancio de haber corrido todo el día.", "La solución funciona, pero ahora tenés que dar explicaciones de por qué se tardó tanto.", "La ayuda llega cuando ya hiciste todo el trabajo solo."],
    reorg: ["Aparecen nuevos jefes sin que nadie te explique cuál es tu función ahora.", "Hablan de 'eficiencia' mientras todos miran con miedo quién sigue.", "Hoy nadie pierde el puesto, pero nadie promete nada para mañana."],
    leadership: ["La idea suena hermosa hasta que el jefe pregunta quién se encarga de trabajarla.", "La propuesta gana apoyos arriba pero pierde todo el sentido práctico.", "Una presentación prolija disfraza la falta de plan real."],
    social: ["Una charla informal te da un dato clave sobre lo que viene en la empresa.", "El comentario parecía inocente hasta que se empezó a comentar por los pasillos.", "Alguien te promete ayuda, pero antes quiere saber quién está mirando."],
    fun: ["La lista de quién asistió al evento llega directo a las manos del jefe.", "Sacan fotos grupales para mostrar lo 'felices' que están todos en el trabajo.", "El entusiasmo del equipo se mide con un cuestionario que nadie quería responder."],
    workload: ["La tarea cambia de nombre, pero la fecha de entrega sigue siendo hoy.", "Te pasan el problema con una sonrisa y un 'confío en vos'.", "Lo que parecía algo chico ahora te exige seguimiento diario."],
    credit: ["Tu esfuerzo queda flotando justo antes de que lo vea el que toma las decisiones.", "Tu informe aparece presentado con el nombre de otra persona en la portada.", "El agradecimiento público menciona a todos menos a vos."],
    systems: ["El trabajo sale adelante gracias a un parche atado con alambre.", "Aparece una regla nueva después de que el atajo que usaste ya funcionó.", "Te piden instructivos urgentes de algo que aprendiste a hacer solo."],
    review: ["La evaluación mide detalles tontos y evita hablar de tu sueldo.", "Tu futuro en la empresa se define en una escala que nadie te explicó bien.", "El comentario viene con una 'oportunidad de mejora' que nadie sabe definir."],
    politics: ["Las tensiones aumentan a medida que se acerca la fecha límite.", "La decisión de trabajo se frena por una discusión de egos entre jefes.", "Un compañero te apoya hoy, pero la cuenta del favor llega mañana."],
    boundary: ["Tu tiempo libre se vuelve negociable apenas aparece la urgencia de otro.", "Hacés una excepción hoy y a partir de mañana pasa a ser tu obligación cotidiana.", "La regla existe en los papeles, pero aplicarla depende de quién te la pida."],
    wellbeing: ["Te mandan un mail sobre salud mental justo cuando te exigen horas extras.", "La empresa te recomienda descansar pero sin mover ninguna fecha de entrega.", "Tu cansancio es evidente pero las entregas no se frenan."],
    life: ["El trabajo te consume el tiempo que necesitabas para resolver tus cosas personales.", "Una decisión personal se complica porque el trabajo no te da margen.", "No hay opción fácil: elegís entre tu tranquilidad o cumplir en la oficina."],
  },
  en: {
    meeting: ["The meeting ends with no concrete decisions, and another follow-up call is scheduled.", "Someone promises to resolve it offline and disappears completely.", "You end up assigned to a task nobody else wanted to take."],
    incident: ["You manage to contain the issue, but you are left completely exhausted.", "The fix works, but now you have to explain why it took so long.", "Help arrives only after you have already done all the heavy lifting alone."],
    reorg: ["New bosses appear before anyone explains your actual daily role.", "They talk about 'efficiency' while everyone worries about layoffs.", "Nobody loses their job today, but nobody promises anything for tomorrow."],
    leadership: ["The idea sounds great until the boss asks who will actually do the work.", "The proposal gets executive approval but loses all practical sense.", "A polished slide deck disguises the total lack of a real plan."],
    social: ["A casual chat gives you valuable insider info on upcoming changes.", "The comment seemed harmless until it was repeated across departments.", "Someone offers to help, but first checks who is watching them."],
    fun: ["The attendance list from the event ends up on the director's desk.", "Group photos are taken to show how 'happy' everyone is at work.", "Team morale is measured with a mandatory survey nobody wanted to take."],
    workload: ["The task gets renamed, but the deadline remains impossibly tight.", "The urgency is passed to you with a smile and a 'thanks in advance.'", "What looked like a quick ask now requires daily status updates."],
    credit: ["Your hard work gets noticed just before reaching the decision maker.", "Your report is presented with someone else's name on the front page.", "The public praise names everyone except you."],
    systems: ["Work gets done thanks to a quick band-aid solution.", "A new rule appears right after your shortcut already solved the problem.", "Documentation becomes urgent as soon as someone asks who handles it."],
    review: ["The review measures trivial metrics while ignoring your pay raise.", "Your career progress is summarized in a score nobody explained.", "The feedback comes with an 'improvement goal' nobody can clarify."],
    politics: ["Tensions rise just as the project deadline gets closer.", "The work gets blocked by an ego fight between two managers.", "A coworker supports you today, but will ask for a favor tomorrow."],
    boundary: ["Your personal time becomes negotiable as soon as someone else panics.", "You make one exception, and it immediately becomes expected every day.", "The policy exists on paper, but following it depends on who asks."],
    wellbeing: ["A wellness email arrives right as you are asked for overtime.", "Management advises taking breaks without extending a single deadline.", "Your exhaustion is visible, but deadlines stay unchanged."],
    life: ["Work consumes the energy you desperately needed for personal issues.", "A personal choice gets complicated because work leaves zero margin.", "There is no easy answer: you choose between rest or work obligations."],
  },
};

const tiles: Record<Locale, string[]> = {
  en: [
    "Payday 💵", "Long Meeting 💬", "Coffee Break ☕", "Boss Evaluation 📝", "Office Gossip 🗣️",
    "Training Session 📚", "HR Forms 📄", "No Money Allowed 🚫", "New Ideas 💡", "Vacation Request ✈️",
    "Mandatory Quiz 📋", "Work Gathering 🎉", "Working From Home 🏠", "System Crash 💻", "Public Praise 👏",
    "Company Speech 🎤", "New Bosses 👔", "Team Bonding 🤝", "LinkedIn Message ✉️", "Boss Over Shoulder 👁️",
    "Pay Day 💵", "Manager Visit 🏢", "Reorganization 🔄", "Mandatory Fun 🎈", "New Manager 👔",
    "Yearly Review 📊", "Rare Chance 🌟", "Office Rumors 🤫", "Layoff Talk ⚠️", "Promotion Path 📈",
    "Close to Breaking 🛑", "Monthly Budget 💰", "Project Launch 🚀", "Work Birthday 🎂", "Planning Meeting 🗓️",
    "Angry Customer 😠", "Job Interview 💼", "Back to Office 🏢", "Perks Portal 🎁", "Month End Closing 🏁",
    "Coworker Advice 💬", "Desk Move 🪑", "Bosses Trip ✈️", "Safety Talk 🛡️", "Career Plan 🧗",
    "Kitchen Snacks 🍪", "Vendor Demo 📺", "Quick Fix 🛠️", "Budget Review 💵", "All-Company Call 📢",
    "Improvement Plan 📝", "Side Gig 🌙", "End of Year Party 🥳", "Company Values 📜", "Emergency Fix 🚨",
    "Coworkers Chat 💬", "Resignation Chat 🚪", "Dream Retirement 🌴"
  ],
  "es-AR": [
    "Cobro de sueldo 💵", "Reunión larguísima 💬", "Pausa de café ☕", "Evaluación del jefe 📝", "Chisme de pasillo 🗣️",
    "Capacitación 📚", "Trámites de RR. HH. 📄", "Sin un peso para gastos 🚫", "Ideas nuevas 💡", "Pedido de vacaciones ✈️",
    "Trámites obligatorios 📋", "Evento del trabajo 🎉", "Trabajo desde casa 🏠", "Se cayó el sistema 💻", "Agradecimiento público 👏",
    "Anuncio de la empresa 🎤", "Cambio de autoridades 👔", "Jornada de integración 🤝", "Mensaje de reclutador ✉️", "El jefe encima tuyo 👁️",
    "Día de cobro 💵", "Visita del gerente 🏢", "Reorganización 🔄", "Evento obligado 🎈", "Jefe nuevo 👔",
    "Revisión anual 📊", "Oportunidad rara 🌟", "Rumores de pasillo 🤫", "Rumor de despidos ⚠️", "Posibilidad de ascenso 📈",
    "Al borde del colapso 🛑", "Cuentas y sueldos 💰", "Entrega de proyecto 🚀", "Cumpleaños en el trabajo 🎂", "Reunión de planes 🗓️",
    "Cliente furioso 😠", "Entrevista laboral 💼", "Vuelta a la oficina 🏢", "Beneficios del trabajo 🎁", "Cierre de mes 🏁",
    "Consejo de compañero 💬", "Cambio de lugar 🪑", "Reunión de jefes ✈️", "Charla de prevención 🛡️", "Plan de trabajo 🧗",
    "Snacks en la cocina 🍪", "Muestra de producto 📺", "Solución casera 🛠️", "Revisión de gastos 💵", "Reunión general 📢",
    "Plan de mejora 📝", "Changa extra 🌙", "Fiesta de fin de año 🥳", "Compromiso laboral 📜", "Arreglo de emergencia 🚨",
    "Chat de compañeros 💬", "Charla de renuncia 🚪", "Jubilación soñada 🌴"
  ],
};

const labels: Record<Locale, Record<Stat, string>> = {
  en: {
    salary: "Monthly Salary 💵",
    savings: "Savings 🏦",
    health: "Mental Health 🧠",
    energy: "Physical Energy 🔋",
    motivation: "Willpower 🔥",
    reputation: "Boss Approval ⭐",
    influence: "Power to Say NO 🗣️"
  },
  "es-AR": {
    salary: "Sueldo mensual 💵",
    savings: "Tus ahorros 🏦",
    health: "Salud mental 🧠",
    energy: "Batería física 🔋",
    motivation: "Ganas de seguir 🔥",
    reputation: "Mirada del jefe ⭐",
    influence: "Capacidad de decir NO 🗣️"
  },
};

export const copy = {
  en: {
    localeName: "English",
    localeHint: "Workplace reality simulator",
    subtitle: "Job Survival Simulator",
    year: "YEAR",
    employee: "WORKER",
    junior: "Junior Employee",
    manager: "Team Supervisor",
    employed: "Holding on (Still employed)",
    retired: "Goal Reached! Peaceful Retirement",
    leave: "On medical leave from stress",
    kit: "HELPFUL TOOLS & CARDS",
    emptyKit: "No comfy chair. No mentor. Pure resilience.",
    current: "TODAY'S WORK SITUATION",
    escaped: "You escaped with savings and sanity! Farewell bosses, farewell endless meetings.",
    burnout: "You collapsed from stress because you didn't stop in time. Rest needed urgently.",
    prompt: "Roll the die to move forward through the work calendar.",
    roll: "🎲 Roll the die",
    rolling: "Moving forward…",
    nextTurn: "Next turn",
    pulse: "RECENT WORK EVENTS",
    consequences: "Direct impacts",
    reset: "Restart career",
    odds: "RETIREMENT CHANCES",
    oddsHint: "Protect your mental health and save money to leave work on your own terms.",
    card: "DECISION",
    accept: "Accept what happened",
    neutral: "an expected outcome",
    passedYear: "A full work year passed! Paycheck collected and experience gained.",
    landed: "You landed on:",
    startLog: "First day at work. You arrange your desk and try to understand how everything works.",
    chooseTitle: "Choose your language",
    chooseDescription: "Workplace survival has regional realities. Select one to start playing.",
    start: "Start surviving",
    language: "Language",
    rarities: { common: "frequent", uncommon: "typical", rare: "tough", legendary: "critical" }
  },
  "es-AR": {
    localeName: "Español (Argentina)",
    localeHint: "La vida real en el trabajo",
    subtitle: "Simulador de supervivencia laboral",
    year: "AÑO",
    employee: "EMPLEADO",
    junior: "Empleado inicial",
    manager: "Responsable de equipo",
    employed: "Trabajando (todavía aguantás)",
    retired: "¡Objetivo logrado! Te jubilaste a tiempo",
    leave: "De licencia por colapso laboral",
    kit: "HERRAMIENTAS Y RECURSOS",
    emptyKit: "Sin silla cómoda. Sin ayuda. Puro aguante.",
    current: "SITUACIÓN DE HOY",
    escaped: "¡Lograste retirarte con ahorros y salud mental! Chau jefe, chau reuniones interminables.",
    burnout: "Te quemaste la cabeza por no parar a tiempo. Necesitás descanso urgente.",
    prompt: "Tirá el dado para avanzar en la semana laboral.",
    roll: "🎲 Tirar el dado",
    rolling: "Avanzando…",
    nextTurn: "Siguiente turno",
    pulse: "LO QUE PASÓ RECIENTEMENTE",
    consequences: "Efectos directos",
    reset: "Volver a empezar",
    odds: "CHANCES DE RETIRARTE",
    oddsHint: "Cuidá tu salud mental y junta ahorros para dejar el trabajo cuando vos quieras.",
    card: "DECISIÓN",
    accept: "Aceptar lo que tocó",
    neutral: "un resultado sin sorpresas",
    passedYear: "Pasó un año entero de trabajo. Cobraste tu sueldo y aumentás la experiencia.",
    landed: "Te tocó:",
    startLog: "Primer día de trabajo. Acomodás tus cosas y tratás de entender cómo funciona todo.",
    chooseTitle: "Elegí cómo querés jugar",
    chooseDescription: "La vida laboral cambia según el lugar. Elegí el idioma para empezar.",
    start: "Empezar a jugar",
    language: "Idioma",
    rarities: { common: "frecuente", uncommon: "típico", rare: "difícil", legendary: "crítico" }
  },
} as const;

const eventChoices: Record<Locale, Record<string, Omit<CorporateEvent, "id" | "rarity">>> = {
  en: {
    "Mandatory Fun 🎈": {
      title: "'Voluntary' Work Gathering",
      category: "Culture",
      description: "Your boss asks if you can stay after hours for a team social event.",
      changes: {},
      choices: [
        { label: "Stay with a polite smile", consequence: "You learned random karaoke choices of your coworkers.", changes: { reputation: 3, health: -5, energy: -7 } },
        { label: "Politely decline", consequence: "Your boundary was noticed and silently logged.", changes: { health: 3, motivation: 2, reputation: -2 } },
        { label: "Make up a believable excuse", consequence: "The excuse worked. Your rest is saved.", changes: { energy: 3, reputation: -1, influence: 1 } }
      ]
    },
    "Promotion Path 📈": {
      title: "Offer for Promotion",
      category: "Career",
      description: "Your manager offers you a higher title. More responsibilities and way more meetings.",
      changes: {},
      choices: [
        { label: "Accept the promotion", consequence: "Congratulations! Expectations are now endless.", changes: { salary: 12, influence: 8, health: -9, energy: -6 }, tag: "promoted" },
        { label: "Decline and stay in your current role", consequence: "You keep your free evenings and earn a quiet reputation for balance.", changes: { health: 4, motivation: 3, reputation: 1 } }
      ]
    },
    "Vacation Request ✈️": {
      title: "Requesting Vacation Days",
      category: "Balance",
      description: "You need time off, but the team is in a busy phase once again.",
      changes: {},
      choices: [
        { label: "Book the days anyway", consequence: "Setting your out-of-office message feels wonderful.", changes: { health: 12, energy: 14, motivation: 7, reputation: -2 } },
        { label: "Postpone your trip", consequence: "Management appreciates your sacrifice for roughly four seconds.", changes: { reputation: 4, health: -7, energy: -5 } }
      ]
    }
  },
  "es-AR": {
    "Evento obligado 🎈": {
      title: "Evento 'voluntario' del trabajo",
      category: "Cultura",
      description: "Tu jefe pregunta si podés quedarte después de hora para una reunión social del equipo.",
      changes: {},
      choices: [
        { label: "Aceptar con una sonrisa", consequence: "Te quedaste hasta tarde. Te enteraste de chismes pero terminás exhausto.", changes: { reputation: 3, health: -5, energy: -7 } },
        { label: "Decir que no podés con respeto", consequence: "Marcaste un límite. Recuperás la noche pero a tu jefe no le gustó tanto.", changes: { health: 3, motivation: 2, reputation: -2 } },
        { label: "Inventar una buena excusa", consequence: "La excusa funcionó. Salvaste tu descanso por hoy.", changes: { energy: 3, reputation: -1, influence: 1 } }
      ]
    },
    "Posibilidad de ascenso 📈": {
      title: "Propuesta de ascenso",
      category: "Carrera",
      description: "Tu jefe te ofrece un cargo más alto. Mejor título, pero el doble de responsabilidad y reuniones.",
      changes: {},
      choices: [
        { label: "Aceptar el ascenso", consequence: "¡Felicitaciones! Cobrás más pero las exigencias ahora son interminables.", changes: { salary: 12, influence: 8, health: -9, energy: -6 }, tag: "promoted" },
        { label: "Seguir en tu puesto actual", consequence: "Conservás tus noches libres y ganás la reputación de cuidar tu vida personal.", changes: { health: 4, motivation: 3, reputation: 1 } }
      ]
    },
    "Pedido de vacaciones ✈️": {
      title: "Pedido de vacaciones",
      category: "Equilibrio",
      description: "Necesitás descansar unos días, pero el equipo está justo en una etapa cargada.",
      changes: {},
      choices: [
        { label: "Pedirte los días igual", consequence: "Poner el mensaje de 'fuera de oficina' se siente hermoso.", changes: { health: 12, energy: 14, motivation: 7, reputation: -2 } },
        { label: "Postergarlas para más adelante", consequence: "En la empresa valoran tu esfuerzo durante cuatro segundos.", changes: { reputation: 4, health: -7, energy: -5 } }
      ]
    }
  },
};

export function getGameData(locale: Locale) {
  const stats = (Object.keys(labels[locale]) as Stat[]).reduce((result, key) => ({
    ...result,
    [key]: {
      label: labels[locale][key],
      icon: { salary: "💵", savings: "🏦", health: "🧠", energy: "🔋", motivation: "🔥", reputation: "⭐", influence: "🗣️" }[key],
      tone: { salary: "blue", savings: "green", health: "pink", energy: "orange", motivation: "yellow", reputation: "violet", influence: "cyan" }[key]
    }
  }), {} as Record<Stat, { label: string; icon: string; tone: string }>);

  const events = situations[locale].flatMap(([title, description], situationIndex) =>
    twists[locale].map((changes, twistIndex) => ({
      id: `event-${locale}-${situationIndex}-${twistIndex}`,
      title,
      description: `${description} ${outcomes[locale][outcomeGroups[situationIndex]][twistIndex % 3]}`,
      category: locale === "es-AR" ? ["Día a día", "Convivencia", "Supervisión", "Organización"][situationIndex % 4] : ["Daily Life", "Coworkers", "Management", "Operations"][situationIndex % 4],
      changes,
      rarity: twistIndex === 9 ? ("legendary" as const) : twistIndex > 6 ? ("rare" as const) : twistIndex > 3 ? ("uncommon" as const) : ("common" as const)
    }))
  );

  return { tiles: tiles[locale], stats, events, choices: eventChoices[locale], text: copy[locale] };
}
