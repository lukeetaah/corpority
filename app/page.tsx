"use client";

import { useEffect, useMemo, useState } from "react";
import { Changes, Choice, CorporateEvent, getGameData, Locale, Stat } from "./game-data";

type RiskKey = Stat;
type PendingConsequence = { turns: number; title: string; message: string; changes: Changes; origin?: string };
type Game = { position: number; year: number; turn: number; stats: Record<Stat, number>; items: string[]; flags: string[]; log: string[]; skippedTurns: number; seenEventIds: string[]; recentEventTitles: string[]; pending: PendingConsequence[]; riskWarnings: Record<RiskKey, number>; riskCooldown: number; ended?: "won" | "burnout" };
type Resolution = { title: string; message: string; changes: Changes; skippedTurns?: number; item?: string; state: string };
type BusyTask = { kind: "reconcile" | "tickets" | "approvals"; event: CorporateEvent };
type TeamMate = { name: string; role: string; tenure: string; rank: number; reputation: number; favor: number; note: string; tone: string };
type ScenarioKey = "meeting" | "incident" | "reorg" | "leadership" | "social" | "fun" | "workload" | "credit" | "systems" | "review" | "politics" | "boundary" | "wellbeing" | "life";

const SAVE_KEY = "corpority-save-v1";
const LANGUAGE_KEY = "corpority-language-v1";
const BRIEFING_KEY = "corpority-briefing-v2";
const CAREER_YEARS = 8;
const TASK_TILES = [6, 7, 10, 20, 31, 39, 48, 50];
const clamp = (value: number) => Math.max(0, Math.min(100, value));
const pick = <T,>(items: readonly T[]) => items[Math.floor(Math.random() * items.length)];

function createGame(locale: Locale): Game {
  return { position: 0, year: 1, turn: 1, stats: { salary: 38, savings: 14, health: 76, energy: 72, motivation: 68, reputation: 18, influence: 4 }, items: [], flags: [], skippedTurns: 0, seenEventIds: [], recentEventTitles: [], pending: [], riskWarnings: { salary: 0, savings: 0, health: 0, energy: 0, motivation: 0, reputation: 0, influence: 0 }, riskCooldown: 0, log: [getGameData(locale).text.startLog] };
}

function teamFor(locale: Locale): TeamMate[] {
  return locale === "es-AR" ? [
    { name: "Clara M.", role: "Jefa de Área", tenure: "9 años", rank: 91, reputation: 34, favor: 96, tone: "gold", note: "Entró por recomendación directa del director. Firma planillas y nadie cuestiona lo que hace." },
    { name: "Tomás R.", role: "Supervisación Senior", tenure: "6 años", rank: 76, reputation: 72, favor: 63, tone: "blue", note: "Hace bien su trabajo y siempre sabe estar cerca del jefe cuando hay que repartir créditos." },
    { name: "Mica V.", role: "Analista principal", tenure: "2 años", rank: 48, reputation: 83, favor: 22, tone: "green", note: "La persona que más trabaja de todo el equipo. Por eso le dan el doble de tareas." },
    { name: "Bruno P.", role: "Coordinador de entregas", tenure: "4 años", rank: 67, reputation: 19, favor: 79, tone: "pink", note: "Llega tarde a las reuniones pero se lleva excelente con quienes aprueban los presupuestos." },
  ] : [
    { name: "Clara M.", role: "Department Head", tenure: "9 years", rank: 91, reputation: 34, favor: 96, tone: "gold", note: "Hired directly by the director. She signs forms and nobody questions her decisions." },
    { name: "Tom R.", role: "Senior Supervisor", tenure: "6 years", rank: 76, reputation: 72, favor: 63, tone: "blue", note: "Does good work and knows when to stand near the boss when credit is handed out." },
    { name: "Mika V.", role: "Lead Analyst", tenure: "2 years", rank: 48, reputation: 83, favor: 22, tone: "green", note: "The hardest worker on the entire team. That is why she gets twice the workload." },
    { name: "Bruno P.", role: "Delivery Lead", tenure: "4 years", rank: 67, reputation: 19, favor: 79, tone: "pink", note: "Always late to meetings but has a great relationship with whoever signs budget approvals." },
  ];
}

function resourceDescription(item: string, locale: Locale) {
  const descriptions: Record<string, [string, string]> = {
    "Contacto de confianza": ["+1 Capacidad de decir NO cuando tomás decisiones estratégicas.", "+1 Power to say NO when making key decisions."],
    "Internal contact": ["+1 Capacidad de decir NO cuando tomás decisiones estratégicas.", "+1 Power to say NO when making key decisions."],
    "Guía de supervivencia laboral": ["Reduce en 1 el gasto de Batería física en cada decisión.", "Reduces physical energy cost of every decision by 1."],
    "Survival manual": ["Reduce en 1 el gasto de Batería física en cada decisión.", "Reduces physical energy cost of every decision by 1."],
  };
  return descriptions[item]?.[locale === "es-AR" ? 0 : 1] ?? (locale === "es-AR" ? "Una ventaja ganada en una situación anterior." : "A leverage earned through a previous decision.");
}

function adjustedChanges(changes: Changes, items: string[]): Changes {
  const result = { ...changes };
  const hasContact = items.includes("Contacto de confianza") || items.includes("Internal contact");
  const hasManual = items.includes("Guía de supervivencia laboral") || items.includes("Survival manual");
  if (hasContact && (result.influence ?? 0) > 0) result.influence = (result.influence ?? 0) + 1;
  if (hasManual && (result.energy ?? 0) < 0) result.energy = Math.min(0, (result.energy ?? 0) + 1);
  return result;
}

function teamVerdict(member: TeamMate, locale: Locale) {
  if (member.favor - member.reputation > 25) return locale === "es-AR" ? "Protegido/a: tiene la confianza del jefe." : "Protected: has the boss's favor.";
  if (member.reputation - member.favor > 25) return locale === "es-AR" ? "Trabaja mucho, pero no lo valoran." : "Works hard, but underrated.";
  return locale === "es-AR" ? "Sabe llevarse bien y cumplir el trabajo." : "Knows how to handle work and people.";
}

function riskEventFor(game: Game, locale: Locale): { key: RiskKey; event: CorporateEvent } | null {
  const critical = game.stats.energy <= 5 || game.stats.health <= 15;
  if ((game.year < 2 && !critical) || (game.riskCooldown > 0 && !critical)) return null;
  const es = locale === "es-AR";

  if (game.stats.energy <= 5) return {
    key: "energy",
    event: {
      id: "risk-energy-critical",
      title: es ? "¡Te estás quedando sin batería!" : "Critical exhaustion!",
      category: es ? "Cansancio" : "Fatigue",
      rarity: "rare",
      description: es ? "Llegaste a tu límite físico. Se te pasó un detalle en el trabajo porque venís funcionando sin descanso. Hay que decidir qué hacer ahora." : "You hit physical limits. A detail slipped because you worked without rest. Decide what to do now.",
      changes: {},
      choices: [
        { label: es ? "Pedir el día para descansar" : "Take the day off to rest", consequence: es ? "Frenás a tiempo. El equipo cubre tu puesto por hoy, perdés un turno pero recuperás energía." : "You stop in time. The team covers for today, losing a turn but regaining energy.", changes: { energy: 12, health: 7, reputation: -1 }, skipTurns: 1 },
        { label: es ? "Corregirlo esta noche a pura fuerza" : "Fix it tonight with sheer willpower", consequence: es ? "Lográs entregar todo a tiempo, pero tu cansancio es evidente ante tus superiores." : "You deliver on time, but your severe fatigue is obvious to management.", changes: { reputation: -3, health: -5, energy: -1 } }
      ]
    }
  };

  if (game.stats.health <= 15) return {
    key: "health",
    event: {
      id: "risk-health-critical",
      title: es ? "¡No podés más del estrés!" : "Mental health alert!",
      category: es ? "Salud" : "Health",
      rarity: "rare",
      description: es ? "Tu salud mental está en zona crítica. Estar tanto tiempo bajo presión afectó tu paciencia y concentración en las reuniones." : "Your mental health is in the red. Staying under constant pressure has severely drained your patience.",
      changes: {},
      choices: [
        { label: es ? "Desconectarte por un turno" : "Disconnect for one turn", consequence: es ? "Parás la pelota antes de quemarte por completo. Recuperás aire fresco." : "You take a pause before complete burnout. Fresh air restored.", changes: { health: 12, energy: 8, reputation: -2 }, skipTurns: 1 },
        { label: es ? "Ir a la reunión igual" : "Go to the meeting anyway", consequence: es ? "Asistís pero se nota tu malestar. Dejás una impresión tensa." : "You attend but your stress is obvious. Leaves a tense impression.", changes: { health: -4, energy: -3, reputation: -2 } }
      ]
    }
  };

  if (game.stats.motivation <= 18) return {
    key: "motivation",
    event: {
      id: "risk-motivation",
      title: es ? "Falta de ganas evidente" : "Visible low morale",
      category: es ? "Ánimo" : "Morale",
      rarity: "uncommon",
      description: es ? "Se nota que perdiste el entusiasmo. Te cuesta arrancar la jornada y tus compañeros lo perciben." : "It shows that you lost enthusiasm. Starting the day takes extra effort.",
      changes: {},
      choices: [
        { label: es ? "Hablar con tu equipo y pedir aire" : "Talk with your team for space", consequence: es ? "Expresás lo que sentís y recuperás algo de control sobre tus tareas." : "You express your feelings and regain control over your tasks.", changes: { motivation: 5, influence: 1, reputation: -1 } },
        { label: es ? "Seguir en piloto automático" : "Stay on autopilot", consequence: es ? "Cumplís lo mínimo indispensable para salir del paso." : "You do the bare minimum to get through the day.", changes: { reputation: -1, influence: -2, motivation: -2 } }
      ]
    }
  };

  if (game.year >= 3 && game.stats.salary <= 32) return {
    key: "salary",
    event: {
      id: "risk-salary",
      title: es ? "El sueldo no alcanza para los gastos" : "Salary not covering expenses",
      category: es ? "Cuentas" : "Finances",
      rarity: "uncommon",
      description: es ? "Los gastos mensuales aumentaron y tu sueldo quedó desfasado. Te obliga a cuidar cada peso que gastás." : "Monthly expenses went up and your salary fell behind. Forces careful spending.",
      changes: {},
      choices: [
        { label: es ? "Pedir una revisión de sueldo" : "Ask for a pay review", consequence: es ? "Planteás el tema con firmeza. Tu pedido queda registrado." : "You raise the issue firmly. Your request is registered.", changes: { influence: 1, reputation: 1, motivation: -1 } },
        { label: es ? "Buscar una changa extra" : "Take extra side work", consequence: es ? "Consigués algo de dinero extra sacrificando tu fin de semana." : "You earn extra money by giving up your weekend rest.", changes: { savings: 4, energy: -3, health: -1 } }
      ]
    }
  };

  if (game.stats.reputation <= 10) return {
    key: "reputation",
    event: {
      id: "risk-reputation",
      title: es ? "El jefe dudando de tu trabajo" : "Management doubts your work",
      category: es ? "Desempeño" : "Performance",
      rarity: "uncommon",
      description: es ? "Tus últimas entregas dejaron dudas en tus superiores. Tus errores ahora se miran con más lupa." : "Recent deliverables raised questions with management. Mistakes get extra scrutiny.",
      changes: {},
      choices: [
        { label: es ? "Pedir objetivos claros por escrito" : "Ask for clear goals in writing", consequence: es ? "Aclarás lo que esperan de vos y recuperás la confianza gradualmente." : "You clarify expectations and rebuild confidence step by step.", changes: { reputation: 2, energy: -2 } },
        { label: es ? "Dejar pasar el comentario" : "Let the comment pass", consequence: es ? "No pasa nada hoy, pero la próxima reunión será tensa." : "Nothing happens today, but the next meeting will be tense.", changes: { motivation: -1 } }
      ]
    }
  };

  return null;
}

function taskMeta(task: BusyTask, locale: Locale) {
  const es = locale === "es-AR";
  const meta = {
    reconcile: {
      title: es ? "Mails y mensajes urgentes 📧" : "Urgent unread messages 📧",
      description: es ? "Te entraron 5 mensajes que requieren una respuesta. Podés responderlos uno a uno o pateárselos a otro." : "You have 5 pending messages that need a reply. Answer them or pass the work along.",
      action: es ? "Responder" : "Reply",
      done: es ? "Mensajes respondidos" : "Messages answered",
      rows: es ? ["Mail de un cliente molesto", "Consulta de tu compañero de equipo", "Mensaje en el grupo de trabajo", "Recordatorio de reunión pendiente", "Solicitud de datos de planilla"] : ["Client inquiry about delays", "Coworker asking for help", "Work chat notification", "Meeting reminder", "Request for project update"]
    },
    tickets: {
      title: es ? "Archivar y ordenar planillas 📁" : "Organizing messy files 📁",
      description: es ? "Tenés 5 archivos tirados en la máquina que hay que ordenar antes de cerrar el día." : "You have 5 loose files on your desktop that need to be organized before the day ends.",
      action: es ? "Ordenar" : "Organize",
      done: es ? "Archivos ordenados" : "Files organized",
      rows: es ? ["Planilla_Final_v2.xlsx", "Notas_del_lunes.docx", "Recibo_gastos.pdf", "Precios_actualizados.xlsx", "Documento_sin_titulo.docx"] : ["Final_Sheet_v2.xlsx", "Monday_Notes.docx", "Expense_Receipt.pdf", "Updated_Prices.xlsx", "Untitled_Document.docx"]
    },
    approvals: {
      title: es ? "Firmar pedidos de insumos ✍️" : "Approving routine requests ✍️",
      description: es ? "Tenés 5 solicitudes de insumos y trámites diarios que necesitan tu visto bueno." : "You have 5 routine requests for office supplies that need your quick approval.",
      action: es ? "Aprobar" : "Approve",
      done: es ? "Pedidos aprobados" : "Requests approved",
      rows: es ? ["Pedido de resmas de papel", "Permiso de vacaciones de un compañero", "Solicitud de arreglo de cafetera", "Rendición de viáticos", "Pedido de cartucho de impresora"] : ["Paper reams request", "Teammate vacation form", "Coffee machine repair request", "Travel expense form", "Printer ink cartridge order"]
    },
  };
  return meta[task.kind];
}

const scenarioGroups: ScenarioKey[] = ["meeting", "incident", "reorg", "leadership", "leadership", "social", "fun", "workload", "workload", "meeting", "credit", "reorg", "incident", "fun", "social", "workload", "credit", "systems", "review", "social", "social", "reorg", "leadership", "credit", "incident", "meeting", "boundary", "systems", "workload", "meeting", "credit", "politics", "boundary", "review", "wellbeing", "politics", "life", "life", "life", "life", "life", "life", "life", "life", "life", "life", "life", "life"];
const tileScenarioGroups: ScenarioKey[] = ["life", "meeting", "social", "review", "politics", "leadership", "boundary", "reorg", "leadership", "life", "incident", "fun", "boundary", "incident", "credit", "meeting", "reorg", "social", "life", "workload", "life", "leadership", "reorg", "fun", "meeting", "review", "boundary", "systems", "workload", "review", "wellbeing", "reorg", "workload", "life", "leadership", "incident", "social", "boundary", "life", "workload", "social", "life", "leadership", "incident", "review", "social", "social", "systems", "reorg", "meeting", "review", "workload", "fun", "leadership", "incident", "politics", "review", "life"];

function scenarioForEvent(event: CorporateEvent): ScenarioKey {
  const parts = event.id.split("-");
  return scenarioGroups[Number(parts[parts.length - 2])] ?? "workload";
}

function choicesForScenario(locale: Locale, event: CorporateEvent): Choice[] {
  const key = scenarioForEvent(event);
  const es = locale === "es-AR";
  const sets: Record<ScenarioKey, Choice[]> = es ? {
    meeting: [
      { label: "Pedir una decisión concreta", consequence: "Lográs acortar la reunión y dejar asentada una tarea clara.", changes: { reputation: 2, energy: -1 } },
      { label: "Hacer una pregunta incómoda", consequence: "La sala se queda en silencio. Mostrás valentía pero al jefe no le gusta el tono.", changes: { influence: 3, reputation: -2 } },
      { label: "Guardar silencio y tomar notas", consequence: "Evitás discusiones pero terminás armando el resumen para todos.", changes: { energy: -3, reputation: 1 } },
    ],
    incident: [
      { label: "Resolver el problema vos mismo", consequence: "Evitás un desastre mayor, aunque te deja bastante cansado.", changes: { reputation: 3, energy: -3 } },
      { label: "Pedir ayuda a tu jefe", consequence: "Compartís la responsabilidad del problema y la solución.", changes: { influence: 2, reputation: 1 } },
      { label: "Esperar a que lo arregle otro", consequence: "El problema se agranda y perdés tiempo esperando.", changes: { health: 1, reputation: -3 }, skipTurns: 1 },
    ],
    reorg: [
      { label: "Preguntar qué va a pasar", consequence: "No te dan mucha certeza, pero ven que te importa tu trabajo.", changes: { reputation: 2, influence: 1 } },
      { label: "Hacerte cargo de más tareas", consequence: "Te volvés indispensable pero aumenta tu nivel de cansancio.", changes: { reputation: 4, energy: -4, health: -2 } },
      { label: "Mantener la calma y observar", consequence: "Evitás el pánico general y cuidás tu salud mental.", changes: { health: 2, influence: -2 } },
    ],
    leadership: [
      { label: "Organizar los pasos concretos", consequence: "Transformás las palabras en un plan de trabajo real.", changes: { reputation: 3, energy: -3 } },
      { label: "Sumarte a las felicitaciones", consequence: "Quedás bien con los jefes pero el trabajo real sigue pendiente.", changes: { influence: 4, motivation: -2 } },
      { label: "Avisar que no hay tiempo suficiente", consequence: "Decís la verdad pero te miran de reojo por 'negativo'.", changes: { reputation: -2, health: 1 }, skipTurns: 1 },
    ],
    social: [
      { label: "Charlar un rato con tus compañeros", consequence: "Fortalecés el vínculo y conseguís información útil de pasillo.", changes: { influence: 3, energy: -2 }, item: "Contacto de confianza" },
      { label: "Quedarte trabajando solo", consequence: "Avanzás con lo tuyo pero te aislás de lo que pasa en el equipo.", changes: { health: 2, influence: -1 } },
      { label: "Decir exactamente lo que pensás", consequence: "Descargás la bronca, pero tus dichos llegan al jefe.", changes: { motivation: 2, reputation: -4 } },
    ],
    fun: [
      { label: "Ir un rato para cumplir", consequence: "Te ven presente y te podés ir a descansar a tu casa.", changes: { reputation: 2, energy: -1 } },
      { label: "Mostrar entusiasmo exagerado", consequence: "Sumás puntos con superiores pero quedás exhausto.", changes: { influence: 3, energy: -4, motivation: -2 } },
      { label: "Inventar un compromiso urgente", consequence: "Safás del evento y disfrutás de tu tarde libre.", changes: { health: 2, reputation: -2 } },
    ],
    workload: [
      { label: "Explicar que no llegás con todo", consequence: "Lográs achicar la tarea, aunque tenés que dar explicaciones.", changes: { reputation: 2, energy: -2 } },
      { label: "Quedarte haciendo horas extras", consequence: "Cumplís con la entrega a costa de tu descanso personal.", changes: { reputation: 4, energy: -5, health: -3 } },
      { label: "Dejar que el trabajo se atrase", consequence: "Muestrás que era imposible llegar, pero recibís un llamado de atención.", changes: { influence: 1, reputation: -4, health: 1 }, skipTurns: 1 },
    ],
    credit: [
      { label: "Aclarar con calma que el trabajo fue tuyo", consequence: "Dejás las cosas claras de buena manera.", changes: { reputation: 2, influence: 1 } },
      { label: "Dejar pasar el tema para no pelear", consequence: "Evitás un conflicto hoy pero te queda un trago amargo.", changes: { health: -2, motivation: -3 } },
      { label: "Reclamar tu autoría delante de todos", consequence: "Todos se enteran de la verdad, pero el ambiente queda tenso.", changes: { influence: 3, reputation: -3 }, skipTurns: 1 },
    ],
    systems: [
      { label: "Arreglar la falla y dejar la guía", consequence: "Creás orden y tus compañeros te lo agradecen.", changes: { reputation: 3, energy: -3 }, item: "Guía de supervivencia laboral" },
      { label: "Pedir que un encargado lo solucione", consequence: "Arman un grupo de chat que no resuelve nada rápido.", changes: { influence: 1, motivation: -2 } },
      { label: "Usar un atajo provisorio", consequence: "Safás del apuro hoy, pero después tenés que explicarlo.", changes: { energy: 2, reputation: -3 }, skipTurns: 1 },
    ],
    review: [
      { label: "Mostrar todo lo que hiciste en el año", consequence: "Demostrás tu valor con datos concretos y claros.", changes: { reputation: 3, influence: 1 } },
      { label: "Prometer que vas a rendir más", consequence: "Sonás motivado, aunque te comprometés a más tareas.", changes: { influence: 3, motivation: -1, energy: -2 } },
      { label: "Decir la verdad sobre las dificultades", consequence: "La charla se vuelve honesta pero el jefe nota tus quejas.", changes: { health: 2, reputation: -3 } },
    ],
    politics: [
      { label: "Apoyar al compañero que tiene razón", consequence: "Ganás un aliado confiable para el futuro.", changes: { influence: 4, reputation: 1 } },
      { label: "Enfocarte solo en resolver el trabajo", consequence: "El trabajo avanza pero no quedás bien con ningún bando.", changes: { reputation: 2, motivation: -2 } },
      { label: "Tomar bando públicamente", consequence: "Te la jugás toda por una postura en la oficina.", changes: { influence: 2, reputation: -4 }, skipTurns: 1 },
    ],
    boundary: [
      { label: "Respetar tu horario de salida", consequence: "Recuperás la noche para vos y tus afectos.", changes: { health: 4, energy: 3, reputation: -2 } },
      { label: "Aceptar quedarte una hora más", consequence: "Das una mano sin regalar toda la noche.", changes: { influence: 2, energy: -1 } },
      { label: "Ceder y quedarte hasta terminar", consequence: "Demostrás compromiso pero terminás agotado.", changes: { reputation: 3, health: -4, energy: -4 } },
    ],
    wellbeing: [
      { label: "Tomarte un descanso de verdad", consequence: "Desconectás la cabeza y recuperás energía.", changes: { health: 6, energy: 3, reputation: -2 } },
      { label: "Hacer una pausa rápida y seguir", consequence: "Respirás cinco minutos y volvés a la carga.", changes: { motivation: 2, energy: -1 } },
      { label: "Admitir que estás muy cansado", consequence: "Tu jefe te escucha pero anota tu falta de aire.", changes: { health: 4, reputation: -2 }, skipTurns: 1 },
    ],
    life: [
      { label: "Priorizar tu vida personal hoy", consequence: "Resolvés tus asuntos personales con tranquilidad.", changes: { savings: -5, health: -1 } },
      { label: "Pedir flexibilidad para salir antes", consequence: "Hacés visible que tenés vida fuera del trabajo.", changes: { health: 3, reputation: -2, influence: 1 } },
      { label: "Patear lo personal para más adelante", consequence: "Cumplís en el trabajo pero acumulás tensión.", changes: { energy: 1, motivation: -2 }, delayed: { turns: 3, title: "El asunto pendiente vuelve", message: "Lo que postergaste volvió con recargo. Exige solución urgente.", changes: { savings: -7, health: -2 } } },
    ],
  } : {
    meeting: [{ label: "Ask for one clear decision", consequence: "Cuts the call short and leaves a clear action item.", changes: { reputation: 2, energy: -1 } }, { label: "Ask the awkward question", consequence: "The room goes silent. Shows courage but the boss dislikes the tone.", changes: { influence: 3, reputation: -2 } }, { label: "Keep quiet and take notes", consequence: "Avoids arguments but leaves you making meeting summaries for everyone.", changes: { energy: -3, reputation: 1 } }],
    incident: [{ label: "Fix it yourself", consequence: "Prevents a major disaster, though leaves you exhausted.", changes: { reputation: 3, energy: -3 } }, { label: "Ask your boss for help", consequence: "Shares responsibility and the solution with your team.", changes: { influence: 2, reputation: 1 } }, { label: "Wait for someone else to fix it", consequence: "The issue gets worse while you lose time waiting.", changes: { health: 1, reputation: -3 }, skipTurns: 1 }],
    reorg: [{ label: "Ask about your role", consequence: "Doesn't yield complete certainty, but shows you care.", changes: { reputation: 2, influence: 1 } }, { label: "Take on extra tasks", consequence: "Makes you indispensable but increases your fatigue.", changes: { reputation: 4, energy: -4, health: -2 } }, { label: "Stay calm and observe", consequence: "Avoids panic and protects your mental health.", changes: { health: 2, influence: -2 } }],
    leadership: [{ label: "Organize concrete next steps", consequence: "Turns big talk into an actual action plan.", changes: { reputation: 3, energy: -3 } }, { label: "Join the applause", consequence: "Looks good to management while actual work waits.", changes: { influence: 4, motivation: -2 } }, { label: "State that resources are missing", consequence: "Tells the truth but earns sideways glances for being 'negative'.", changes: { reputation: -2, health: 1 }, skipTurns: 1 }],
    social: [{ label: "Chat with your teammates", consequence: "Strengthens relationships and gets useful insider info.", changes: { influence: 3, energy: -2 }, item: "Internal contact" }, { label: "Keep working alone", consequence: "Gets work done but isolates you from team updates.", changes: { health: 2, influence: -1 } }, { label: "Say exactly what you think", consequence: "Vents frustration, but your words reach the boss's ears.", changes: { motivation: 2, reputation: -4 } }],
    fun: [{ label: "Show up briefly to comply", consequence: "Seen present, then free to head home early.", changes: { reputation: 2, energy: -1 } }, { label: "Show high enthusiasm", consequence: "Earns points with bosses but leaves you fully drained.", changes: { influence: 3, energy: -4, motivation: -2 } }, { label: "Invent an urgent commitment", consequence: "Skips the event and preserves your free evening.", changes: { health: 2, reputation: -2 } }],
    workload: [{ label: "Explain you can't finish all", consequence: "Shrinks the load slightly, though requires explanations.", changes: { reputation: 2, energy: -2 } }, { label: "Work overtime to deliver", consequence: "Delivers on time at the cost of personal rest.", changes: { reputation: 4, energy: -5, health: -3 } }, { label: "Let the task slip", consequence: "Shows the workload was impossible, earning a minor warning.", changes: { influence: 1, reputation: -4, health: 1 }, skipTurns: 1 }],
    credit: [{ label: "Calmly clarify it was your work", consequence: "Sets things straight politely.", changes: { reputation: 2, influence: 1 } }, { label: "Let it pass to avoid a fight", consequence: "Avoids conflict today but leaves a bitter taste.", changes: { health: -2, motivation: -3 } }, { label: "Claim credit in front of everyone", consequence: "Everyone learns the truth, but leaves tension.", changes: { influence: 3, reputation: -3 }, skipTurns: 1 }],
    systems: [{ label: "Fix it and write simple guide", consequence: "Creates order and teammates thank you for it.", changes: { reputation: 3, energy: -3 }, item: "Survival manual" }, { label: "Ask a supervisor to handle it", consequence: "Creates a group chat that doesn't solve anything quickly.", changes: { influence: 1, motivation: -2 } }, { label: "Use a quick temporary shortcut", consequence: "Saves time today, but requires explanations later.", changes: { energy: 2, reputation: -3 }, skipTurns: 1 }],
    review: [{ label: "Show all your yearly results", consequence: "Proves your value with clear, solid facts.", changes: { reputation: 3, influence: 1 } }, { label: "Promise to deliver even more", consequence: "Sounds motivated, but commits you to higher demands.", changes: { influence: 3, motivation: -1, energy: -2 } }, { label: "Be honest about difficulties", consequence: "Gets genuine, but boss notes your complaints.", changes: { health: 2, reputation: -3 } }],
    politics: [{ label: "Support the teammate who is right", consequence: "Gains a reliable ally for the future.", changes: { influence: 4, reputation: 1 } }, { label: "Focus purely on doing the work", consequence: "Work gets done but doesn't win over either side.", changes: { reputation: 2, motivation: -2 } }, { label: "Pick a side publicly", consequence: "Goes all-in on an office stance.", changes: { influence: 2, reputation: -4 }, skipTurns: 1 }],
    boundary: [{ label: "Leave on your official clock-out time", consequence: "Recovers your evening for personal life.", changes: { health: 4, energy: 3, reputation: -2 } }, { label: "Agree to stay just one extra hour", consequence: "Helps out without giving away your entire night.", changes: { influence: 2, energy: -1 } }, { label: "Give in and stay until finished", consequence: "Shows commitment but leaves you exhausted.", changes: { reputation: 3, health: -4, energy: -4 } }],
    wellbeing: [{ label: "Take a genuine rest break", consequence: "Disconnects your mind and restores energy.", changes: { health: 6, energy: 3, reputation: -2 } }, { label: "Take a 5-minute breather and resume", consequence: "Catches your breath and gets back to work.", changes: { motivation: 2, energy: -1 } }, { label: "Admit you are feeling exhausted", consequence: "Boss listens but notes your exhaustion level.", changes: { health: 4, reputation: -2 }, skipTurns: 1 }],
    life: [{ label: "Prioritize personal life today", consequence: "Handles personal matters peacefully.", changes: { savings: -5, health: -1 } }, { label: "Ask to leave early", consequence: "Makes it visible that you have a life outside work.", changes: { health: 3, reputation: -2, influence: 1 } }, { label: "Postpone personal task for later", consequence: "Fulfills work duty while accumulating tension.", changes: { energy: 1, motivation: -2 }, delayed: { turns: 3, title: "Postponed issue returns", message: "What you delayed returned with extra urgency.", changes: { savings: -7, health: -2 } } }],
  };
  return sets[key];
}

export default function Home() {
  const [locale, setLocale] = useState<Locale | null>(null);
  const [game, setGame] = useState<Game>(createGame("en"));
  const [activeEvent, setActiveEvent] = useState<CorporateEvent | null>(null);
  const [activeTask, setActiveTask] = useState<BusyTask | null>(null);
  const [taskRows, setTaskRows] = useState<number[]>([]);
  const [dicePush, setDicePush] = useState<number | null>(null);
  const [rolling, setRolling] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);
  const [showBriefing, setShowBriefing] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [sessionClosed, setSessionClosed] = useState(false);
  const [resolution, setResolution] = useState<Resolution | null>(null);

  useEffect(() => {
    const savedLanguage = localStorage.getItem(LANGUAGE_KEY);
    const savedGame = localStorage.getItem(SAVE_KEY);
    if (savedLanguage === "en" || savedLanguage === "es-AR") setLocale(savedLanguage);
    if (savedGame) {
      try {
        const parsed = JSON.parse(savedGame);
        setGame({ ...createGame(savedLanguage === "es-AR" ? "es-AR" : "en"), ...parsed, skippedTurns: parsed.skippedTurns ?? 0, seenEventIds: parsed.seenEventIds ?? [], recentEventTitles: parsed.recentEventTitles ?? [], pending: parsed.pending ?? [], riskWarnings: parsed.riskWarnings ?? { reputation: 0, influence: 0, energy: 0, savings: 0 }, riskCooldown: parsed.riskCooldown ?? 0 });
      } catch {}
    }
    if (!localStorage.getItem(BRIEFING_KEY) && savedLanguage) setShowBriefing(true);
    setLoaded(true);
  }, []);

  useEffect(() => { if (loaded) localStorage.setItem(SAVE_KEY, JSON.stringify(game)); }, [game, loaded]);

  const data = getGameData(locale ?? "en");
  const { text, tiles, stats, events, choices } = data;
  const isSpanish = locale === "es-AR";
  const title = game.flags.includes("promoted") ? text.manager : text.junior;
  const tile = tiles[game.position];
  const team = teamFor(locale ?? "en");
  const progress = Math.min(100, Math.round((game.year / CAREER_YEARS) * 100));
  const stage = game.year <= 2 ? (isSpanish ? "Adaptación al trabajo" : "Orientation") : game.year <= 4 ? (isSpanish ? "Ganando experiencia" : "Credibility") : game.year <= 6 ? (isSpanish ? "Manejando situaciones" : "Politics") : (isSpanish ? "Camino al retiro" : "Exit strategy");
  const faceMood = game.stats.health < 35 ? "strained" : game.stats.influence > 55 || game.stats.salary > 70 ? "powerful" : game.stats.motivation < 30 ? "flat" : "steady";
  
  const boardPositions = useMemo(() => tiles.map((_, i) => {
    const cols = 18; const rows = 12;
    if (i < cols) return { left: `${(i / (cols - 1)) * 100}%`, top: "0%" };
    if (i < cols + rows - 1) return { left: "100%", top: `${((i - cols + 1) / (rows - 1)) * 100}%` };
    if (i < cols * 2 + rows - 2) return { left: `${100 - ((i - cols - rows + 2) / (cols - 1)) * 100}%`, top: "100%" };
    return { left: "0%", top: `${100 - ((i - (cols * 2 + rows - 2)) / (rows - 1)) * 100}%` };
  }), [tiles]);

  function chooseLanguage(nextLocale: Locale) {
    setLocale(nextLocale);
    localStorage.setItem(LANGUAGE_KEY, nextLocale);
    setShowLanguagePicker(false);
    if (!localStorage.getItem(BRIEFING_KEY)) setShowBriefing(true);
  }

  function closeBriefing() {
    localStorage.setItem(BRIEFING_KEY, "seen");
    setShowBriefing(false);
  }

  function apply(changes: Changes, message: string, choice?: Choice) {
    setGame(current => {
      const nextStats = { ...current.stats };
      const effectiveChanges = adjustedChanges(changes, current.items);
      for (const [key, value] of Object.entries(effectiveChanges)) nextStats[key as Stat] = clamp(nextStats[key as Stat] + value!);
      const flags = choice?.tag && !current.flags.includes(choice.tag) ? [...current.flags, choice.tag] : current.flags;
      const item = choice?.item && !current.items.includes(choice.item) ? [...current.items, choice.item] : current.items;
      const exhaustionWarning = nextStats.health === 0;
      if (exhaustionWarning) nextStats.health = 1;
      const skippedTurns = (current.skippedTurns ?? 0) + (choice?.skipTurns ?? 0) + (exhaustionWarning ? 1 : 0);
      const penalty = choice?.skipTurns ? ` ${isSpanish ? `Demora: perdés ${choice.skipTurns} turno${choice.skipTurns > 1 ? "s" : ""}.` : `Delay: lose ${choice.skipTurns} turn${choice.skipTurns > 1 ? "s" : ""}.`}` : "";
      const pending = choice?.delayed ? [...current.pending, { ...choice.delayed, origin: message }] : current.pending;
      const delayed = choice?.delayed ? ` ${isSpanish ? `Volverá en ${choice.delayed.turns} turnos: ${choice.delayed.title}.` : `Will return in ${choice.delayed.turns} turns: ${choice.delayed.title}.`}` : "";
      const warning = exhaustionWarning ? ` ${isSpanish ? "Aviso de cansancio: necesitás tomarte un turno para recuperarte." : "Rest signal: taking a turn to recover."}` : "";
      const riskWarnings = exhaustionWarning ? { ...current.riskWarnings, health: (current.riskWarnings.health ?? 0) + 1 } : current.riskWarnings;
      const ended = current.year >= CAREER_YEARS && nextStats.savings >= 50 && nextStats.health >= 35 ? "won" : undefined;
      return { ...current, stats: nextStats, flags, items: item, pending, riskWarnings, skippedTurns, ended, log: [`${message}${penalty}${delayed}${warning}`, ...current.log].slice(0, 5) };
    });
  }

  function resolveChoice(choice: Choice) {
    const effective = adjustedChanges(choice.changes, game.items);
    const state = Object.entries(effective).map(([key, value]) => `${stats[key as Stat].label} ${clamp(game.stats[key as Stat] + value!)} (${value! > 0 ? "+" : ""}${value})`).join(" · ");
    apply(choice.changes, choice.consequence, choice);
    setResolution({ title: choice.label, message: choice.consequence, changes: effective, skippedTurns: choice.skipTurns, item: choice.item, state });
    setActiveEvent(null);
    window.setTimeout(() => setResolution(null), 4200);
  }

  function completeTask() {
    if (!activeTask) return;
    const meta = taskMeta(activeTask, locale ?? "en");
    const changes: Changes = { reputation: 1, energy: -1 };
    const state = Object.entries(changes).map(([key, value]) => `${stats[key as Stat].label} ${clamp(game.stats[key as Stat] + value!)} (${value! > 0 ? "+" : ""}${value})`).join(" · ");
    const message = isSpanish ? "Completaste las tareas del día a tiempo. Quedó asentado tu compromiso." : "You finished your daily tasks on time. Your commitment was noted.";
    apply(changes, message);
    setResolution({ title: meta.done, message, changes, state });
    const event = activeTask.event;
    setActiveTask(null); setTaskRows([]);
    window.setTimeout(() => setActiveEvent(event), 250);
    window.setTimeout(() => setResolution(null), 4200);
  }

  function skipTask() {
    if (!activeTask) return;
    const changes: Changes = { reputation: -2, energy: 1 };
    const state = Object.entries(changes).map(([key, value]) => `${stats[key as Stat].label} ${clamp(game.stats[key as Stat] + value!)} (${value! > 0 ? "+" : ""}${value})`).join(" · ");
    const message = isSpanish ? "Dejaste las tareas administrativas para otra persona. A tu jefe no le gustó nada." : "You left the administrative tasks for someone else. Your boss noted it.";
    apply(changes, message);
    setResolution({ title: isSpanish ? "Tarea omitida" : "Task skipped", message, changes, state });
    const event = activeTask.event;
    setActiveTask(null); setTaskRows([]);
    window.setTimeout(() => setActiveEvent(event), 250);
    window.setTimeout(() => setResolution(null), 4200);
  }

  function optionsFor(event: CorporateEvent): Choice[] { return event.choices ?? choicesForScenario(locale ?? "en", event); }

  function roll() {
    if (rolling || activeEvent || activeTask || game.ended || !locale) return;
    const due = game.pending.find(consequence => consequence.turns <= 0);
    if (due) {
      setGame(current => ({ ...current, pending: current.pending.filter(consequence => consequence !== due) }));
      const explanation = due.origin ? (isSpanish ? `Esto vuelve por una decisión anterior: ${due.origin} ${due.message}` : `This returns from an earlier decision: ${due.origin} ${due.message}`) : due.message;
      setActiveEvent({ id: `deferred-${due.title}`, title: due.title, description: explanation, category: isSpanish ? "Consecuencia" : "Consequence", changes: {}, choices: [{ label: isSpanish ? "Afrontar las consecuencias" : "Take the consequence", consequence: isSpanish ? "El tema no se resolvió solo y ahora tiene un costo." : "The issue did not solve itself and now has a cost.", changes: due.changes }], rarity: "rare" });
      return;
    }
    const risk = riskEventFor(game, locale);
    if (risk) {
      setGame(current => ({ ...current, riskWarnings: { ...current.riskWarnings, [risk.key]: (current.riskWarnings[risk.key] ?? 0) + 1 }, riskCooldown: 4 }));
      setActiveEvent(risk.event);
      return;
    }
    if (game.skippedTurns > 0) {
      setGame(current => ({ ...current, skippedTurns: Math.max(0, current.skippedTurns - 1), riskCooldown: Math.max(0, current.riskCooldown - 1), turn: current.turn + 1, log: [isSpanish ? "Perdés el turno por estar demorado o agotado. El calendario avanza." : "You lose a turn due to delay or exhaustion. Time moves on.", ...current.log].slice(0, 5) }));
      return;
    }
    setRolling(true); const result = Math.ceil(Math.random() * 6); setDicePush(null);
    window.setTimeout(() => {
      setDicePush(result); setRolling(false); const newPosition = (game.position + result) % tiles.length; const crossedYear = newPosition < game.position; const landed = tiles[newPosition];
      const designed = choices[landed]; const relevantEvents = events.filter(event => scenarioForEvent(event) === tileScenarioGroups[newPosition]); const unseen = relevantEvents.filter(event => !game.seenEventIds.includes(event.id) && !game.recentEventTitles.includes(event.title)); const event = designed ? { ...designed, id: `choice-${locale}-${landed}`, rarity: "uncommon" as const } : pick(unseen.length ? unseen : relevantEvents.length ? relevantEvents : events);
      setGame(current => ({ ...current, position: newPosition, year: current.year + (crossedYear ? 1 : 0), turn: current.turn + 1, riskCooldown: Math.max(0, current.riskCooldown - 1), pending: current.pending.map(consequence => ({ ...consequence, turns: consequence.turns - 1 })), seenEventIds: [...current.seenEventIds, event.id].slice(-180), recentEventTitles: [...current.recentEventTitles, event.title].slice(-5), stats: { ...current.stats, savings: clamp(current.stats.savings + (crossedYear ? 5 : 0)), salary: clamp(current.stats.salary + (crossedYear ? 2 : 0)) }, log: [crossedYear ? text.passedYear : `${text.landed} ${landed}.`, ...current.log].slice(0, 5) }));
      window.setTimeout(() => setDicePush(null), 1960);
      window.setTimeout(() => {
        if (TASK_TILES.includes(newPosition)) {
          const taskKinds: BusyTask["kind"][] = ["reconcile", "tickets", "approvals"];
          setTaskRows([]);
          setActiveTask({ kind: taskKinds[(newPosition + game.turn) % taskKinds.length], event });
        } else setActiveEvent(event);
      }, 1750);
    }, 520);
  }

  function restart() { if (!locale) return; localStorage.removeItem(SAVE_KEY); setGame(createGame(locale)); setActiveEvent(null); setActiveTask(null); setTaskRows([]); setDicePush(null); }
  function closeSession(save: boolean) {
    if (!locale) return;
    if (save) localStorage.setItem(SAVE_KEY, JSON.stringify(game));
    else { localStorage.removeItem(SAVE_KEY); setGame(createGame(locale)); }
    setShowExitConfirm(false); setSessionClosed(true);
  }

  if (!loaded) return <main className="loading">Cargando Corpority…</main>;

  const turnLabel = game.skippedTurns > 0 ? (isSpanish ? `Espera obligatoria · ${game.skippedTurns}` : `Wait turn · ${game.skippedTurns}`) : rolling ? text.rolling : text.roll;

  if (sessionClosed) return <main className="shell closed-shell"><section className="closed-window"><span className="brand-mark">C</span><h1>Corpority</h1><p>{isSpanish ? "El juego se pausó. Podés volver a abrirlo cuando quieras continuar." : "Game paused. Reopen anytime to continue."}</p><button onClick={() => setSessionClosed(false)}>{isSpanish ? "Volver a abrir" : "Reopen game"}</button></section></main>;

  return <main className="shell">
    <header>
      <div className="brand">
        <span className="brand-mark">C</span>
        <div>
          <h1>Corpority</h1>
          <p>{text.subtitle}</p>
        </div>
      </div>
      <div className="top-status">
        <button className="how-to-play-button" onClick={() => setShowHowToPlay(true)}>{isSpanish ? "📖 ¿Cómo se juega?" : "📖 How to Play"}</button>
        <button className="language-button" onClick={() => setShowLanguagePicker(true)}>{locale === "es-AR" ? "ES-AR" : "EN"}</button>
        <span>{text.year} <b>{game.year}</b> / {CAREER_YEARS}</span>
        <div className="progress"><i style={{ width: `${progress}%` }} /></div>
        <span className="career-stage">{stage}</span>
        <span className="job-title">{title}</span>
        <div className="window-controls"><i /><i /><button onClick={() => setShowExitConfirm(true)} aria-label={isSpanish ? "Cerrar juego" : "Close game"}>×</button></div>
      </div>
    </header>

    <section className="game-layout">
      <aside className="profile-panel">
        <div className="employee">
          <div className={`avatar portrait ${faceMood}`}>
            <i className="hair" /><i className="eye left" /><i className="eye right" /><i className="mouth" />
            <b>{game.flags.includes("promoted") ? "★" : ""}</b>
          </div>
          <div>
            <span>{text.employee} #{String(game.turn).padStart(4, "0")}</span>
            <h2>{title}</h2>
            <small>{game.ended ? game.ended === "won" ? text.retired : text.leave : text.employed}</small>
          </div>
        </div>

        <div className="profile-read">
          <span>{isSpanish ? "TU OBJETIVO" : "YOUR GOAL"}</span>
          <b>{isSpanish ? "Llegar a la jubilación a tiempo" : "Reach retirement safely"}</b>
          <p>{isSpanish ? "Tus recursos bajan o suben según tus decisiones. Mantené tu salud mental alta para no quemarte." : "Your resources change based on your decisions. Keep mental health high to avoid burnout."}</p>
        </div>

        <div className="stats">
          {(Object.keys(stats) as Stat[]).map(key => (
            <div className="stat" key={key} title={isSpanish ? `${stats[key].label}: Afecta tus posibilidades en el juego.` : `${stats[key].label}: Affects your game outcomes.`}>
              <div>
                <span className={`stat-icon ${stats[key].tone}`}>{stats[key].icon}</span>
                {stats[key].label}
                <b>{game.stats[key]}</b>
              </div>
              <div className="meter"><i style={{ width: `${game.stats[key]}%` }} /></div>
            </div>
          ))}
        </div>

        <div className="inventory leverage">
          <span className="eyebrow">{isSpanish ? "HERRAMIENTAS Y VENTAJAS" : "TOOLS & LEVERAGE"}</span>
          {game.items.length ? (
            <div className="item-grid">
              {game.items.map(item => (
                <em key={item}>
                  ✦ <b>{item}</b>
                  <small>{resourceDescription(item, locale ?? "en")}</small>
                </em>
              ))}
            </div>
          ) : (
            <p>{isSpanish ? "A medida que avances conseguirás ventajas que reducen costos en situaciones difíciles." : "As you progress you will earn perks that reduce costs in tough situations."}</p>
          )}
        </div>
      </aside>

      <section className="board-wrap">
        <div className="board">
          <div className="board-center">
            <span className="eyebrow">{game.skippedTurns > 0 ? (isSpanish ? "TURNO PERDIDO" : "TURN LOST") : text.current}</span>
            <h2>{game.skippedTurns > 0 ? (isSpanish ? "Estás de descanso forzado" : "On mandatory break") : tile}</h2>
            <p>{game.skippedTurns > 0 ? (isSpanish ? "Una mala situación o el cansancio te obligan a frenar por un turno." : "A difficult situation or fatigue forces you to pause for one turn.") : game.ended ? (game.ended === "won" ? text.escaped : text.burnout) : text.prompt}</p>
            <div className="hint">
              <b>{isSpanish ? "CONSEJO" : "TIP"}</b>
              {isSpanish ? " Tener paciencia y cuidar tu batería física te permite durar más años sin estrés." : " Protecting physical energy helps you last longer without burnout."}
            </div>
            <button onClick={roll} disabled={rolling || !!activeEvent || !!game.ended || !locale} className={rolling ? "rolling" : ""}>
              {turnLabel}
              <span>🎲</span>
            </button>
          </div>

          {dicePush && (
            <div className="dice-push">
              <span>{isSpanish ? "RESULTADO" : "ROLL RESULT"}</span>
              <b>{dicePush}</b>
              <em>{isSpanish ? "Avanzás casillas en el calendario." : "Moving forward on calendar."}</em>
            </div>
          )}

          {tiles.map((name, index) => (
            <div className={`tile ${game.position === index ? "active" : ""} ${index === 0 ? "start" : ""}`} style={boardPositions[index]} key={`${locale}-${name}`}>
              <small>{String(index + 1).padStart(2, "0")}</small>
              <b>{name}</b>
              {game.position === index && <i className="player-token">●</i>}
            </div>
          ))}
        </div>
      </section>

      <aside className="feed-panel">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">{isSpanish ? "TUS COMPAÑEROS" : "COWORKERS"}</span>
            <h2>{isSpanish ? "El equipo de trabajo" : "The work team"}</h2>
          </div>
          <button className="reset" onClick={restart}>{text.reset}</button>
        </div>

        <div className="team-list">
          {team.map(member => (
            <article className="mate" key={member.name}>
              <div className={`mate-avatar ${member.tone}`}>{member.name.slice(0, 1)}</div>
              <div>
                <header><b>{member.name}</b><span>{member.rank}</span></header>
                <small>{member.role} · {member.tenure}</small>
                <div className="rank-line"><i style={{ width: `${member.rank}%` }} /></div>
                <p>{member.note}</p>
                <strong className={member.favor > member.reputation ? "protected" : "earned"}>{teamVerdict(member, locale ?? "en")}</strong>
              </div>
            </article>
          ))}
        </div>

        <div className="timeline">
          <span className="eyebrow">{text.pulse}</span>
          {game.log.slice(0, 2).map((entry, index) => (
            <div key={`${entry}-${index}`}><i /> <p>{entry}</p></div>
          ))}
        </div>

        <div className="survival">
          <span className="eyebrow">{text.odds}</span>
          <b>{Math.max(3, Math.round((game.stats.savings + game.stats.health + game.stats.motivation) / 3))}%</b>
          <p>{text.oddsHint}</p>
        </div>
      </aside>
    </section>

    {activeEvent && (
      <div className="modal-backdrop push-backdrop">
        <article className="event-card push-card">
          <button className="dismiss-card" onClick={() => setActiveEvent(null)} aria-label={isSpanish ? "Cerrar tarjeta" : "Close card"}>×</button>
          <div className="event-top">
            <span>{activeEvent.category} · {text.card}</span>
            <em className={activeEvent.rarity}>{text.rarities[activeEvent.rarity]}</em>
          </div>
          <h2>{activeEvent.title}</h2>
          <p>{activeEvent.description}</p>
          <div className="choices">
            {optionsFor(activeEvent).map(choice => (
              <button key={choice.label} onClick={() => resolveChoice(choice)}>
                <b>{choice.label}</b>
                <span>{choice.consequence}</span>
                <div className="impact-chips">
                  {Object.entries(adjustedChanges(choice.changes, game.items)).map(([key, value]) => (
                    <em className={value! > 0 ? "gain" : "loss"} key={key}>
                      {value! > 0 ? "+" : ""}{value} {stats[key as Stat].label}
                    </em>
                  ))}
                  {choice.skipTurns ? <em className="loss">{isSpanish ? `Espera · ${choice.skipTurns} turno` : `Wait · ${choice.skipTurns} turn`}</em> : null}
                  {choice.item ? <em className="gain">+ {choice.item}</em> : null}
                </div>
              </button>
            ))}
          </div>
        </article>
      </div>
    )}

    {resolution && (
      <aside className="resolution-push">
        <button onClick={() => setResolution(null)} aria-label={isSpanish ? "Cerrar resultado" : "Close result"}>×</button>
        <span>{isSpanish ? "DECISIÓN REGISTRADA" : "DECISION LOGGED"}</span>
        <b>{resolution.title}</b>
        <p>{resolution.message}</p>
        <div className="impact-chips">
          {Object.entries(resolution.changes).map(([key, value]) => (
            <em className={value! > 0 ? "gain" : "loss"} key={key}>
              {value! > 0 ? "+" : ""}{value} {stats[key as Stat].label}
            </em>
          ))}
          {resolution.skippedTurns ? <em className="loss">{isSpanish ? `Espera · ${resolution.skippedTurns} turno` : `Wait · ${resolution.skippedTurns} turn`}</em> : null}
          {resolution.item ? <em className="gain">+ {resolution.item}</em> : null}
        </div>
      </aside>
    )}

    {showHowToPlay && (
      <div className="modal-backdrop">
        <article className="briefing-card">
          <span className="eyebrow">{isSpanish ? "GUÍA DEL JUEGO" : "GAME GUIDE"}</span>
          <h2>{isSpanish ? "¿Cómo se juega a Corpority?" : "How to play Corpority"}</h2>
          <div className="how-to-play-steps">
            <div>
              <b>1. 🎲 Tirás el dado</b>
              <p>{isSpanish ? "Avanzás por el tablero que representa el calendario de semanas y meses laborales." : "Move across the board representing weeks and months at work."}</p>
            </div>
            <div>
              <b>2. 📋 Enfrentás situaciones reales</b>
              <p>{isSpanish ? "Cada casilla activa una situación cotidiana del trabajo (reuniones, mensajes, decisiones). Vos elegís qué camino tomar." : "Each tile triggers a realistic work situation. You decide which path to take."}</p>
            </div>
            <div>
              <b>3. ⚖️ Mantené tus recursos en equilibrio</b>
              <p>{isSpanish ? "Cuidá tu Salud Mental 🧠 y Batería Física 🔋 para no quemarte. Juntá Ahorros 🏦 para jubilarte a tiempo." : "Balance Mental Health 🧠 and Physical Energy 🔋 to avoid burnout. Accumulate Savings 🏦 to retire."}</p>
            </div>
            <div>
              <b>4. 🏆 El objetivo final</b>
              <p>{isSpanish ? "Completar los 8 Años de carrera conservando tu cordura y con ahorros suficientes." : "Complete 8 Years of work while keeping your sanity and enough savings."}</p>
            </div>
          </div>
          <button className="continue" onClick={() => setShowHowToPlay(false)}>
            {isSpanish ? "¡Entendido! Volver al juego" : "Got it! Back to game"}
            <span>→</span>
          </button>
        </article>
      </div>
    )}

    {showExitConfirm && (
      <div className="modal-backdrop">
        <article className="exit-card">
          <span className="eyebrow">{isSpanish ? "GUARDAR PROGRESO" : "SAVE PROGRESS"}</span>
          <h2>{isSpanish ? "¿Querés guardar antes de salir?" : "Save before leaving?"}</h2>
          <p>{isSpanish ? "Podés guardar tu partida actual para continuarla en cualquier otro momento." : "Save your current game to resume whenever you want."}</p>
          <div>
            <button className="continue" onClick={() => closeSession(true)}>
              {isSpanish ? "Guardar y cerrar" : "Save and close"}
              <span>→</span>
            </button>
            <button className="discard" onClick={() => closeSession(false)}>
              {isSpanish ? "Reiniciar sin guardar" : "Restart without saving"}
            </button>
            <button className="cancel-close" onClick={() => setShowExitConfirm(false)}>
              {isSpanish ? "Seguir jugando" : "Keep playing"}
            </button>
          </div>
        </article>
      </div>
    )}

    {showBriefing && (
      <div className="modal-backdrop language-backdrop">
        <article className="briefing-card">
          <span className="eyebrow">{isSpanish ? "BIENVENIDO AL TRABAJO" : "WELCOME TO WORK"}</span>
          <h2>{isSpanish ? "Arrancás tu camino en la empresa." : "Starting your workplace journey."}</h2>
          <p>{isSpanish ? "Tu objetivo es simple: aguantar los años de trabajo, cuidar tu paciencia y juntar plata para retirarte sin volverte loco." : "Your goal is simple: survive work years, guard your sanity, and save enough money to retire."}</p>
          <div className="briefing-team">
            {team.slice(0, 3).map(member => (
              <div key={member.name}>
                <b>{member.name}</b>
                <span>{member.role} · {member.tenure}</span>
                <em>{isSpanish ? "antigüedad" : "tenure"} {member.tenure}</em>
              </div>
            ))}
          </div>
          <button className="continue" onClick={closeBriefing}>
            {isSpanish ? "Entendido. ¡Empezar a jugar!" : "Got it. Let's play!"}
            <span>→</span>
          </button>
        </article>
      </div>
    )}

    {(!locale || showLanguagePicker) && (
      <div className="modal-backdrop language-backdrop">
        <article className="language-card">
          <span className="eyebrow">CORPORITY</span>
          <h2>{text.chooseTitle}</h2>
          <p>{text.chooseDescription}</p>
          <div className="language-options">
            <button onClick={() => chooseLanguage("es-AR")}>
              <b>Español (Argentina)</b>
              <span>Sin lenguaje técnico · situaciones reales de trabajo · supervivencia cotidiana</span>
              <em>{text.start} →</em>
            </button>
            <button onClick={() => chooseLanguage("en")}>
              <b>English</b>
              <span>Relatable workplace scenarios · friendly mechanics · career survival</span>
              <em>{text.start} →</em>
            </button>
          </div>
        </article>
      </div>
    )}

    {activeTask && (
      <div className="modal-backdrop task-backdrop">
        <article className="event-card task-card">
          <div className="event-top">
            <span>{isSpanish ? "TAREAS ADMINISTRATIVAS" : "ROUTINE TASKS"}</span>
            <em className="uncommon">{isSpanish ? "requerido" : "required"}</em>
          </div>
          <h2>{taskMeta(activeTask, locale ?? "en").title}</h2>
          <p>{taskMeta(activeTask, locale ?? "en").description}</p>
          <div className="task-rows">
            {taskMeta(activeTask, locale ?? "en").rows.map((row, index) => (
              <button key={row} className={taskRows.includes(index) ? "done" : ""} onClick={() => setTaskRows(current => current.includes(index) ? current : [...current, index])}>
                <span>{row}</span>
                <b>{taskRows.includes(index) ? (isSpanish ? "Listo ✅" : "Done ✅") : taskMeta(activeTask, locale ?? "en").action}</b>
              </button>
            ))}
          </div>
          <button className="continue" disabled={taskRows.length < taskMeta(activeTask, locale ?? "en").rows.length} onClick={completeTask}>
            {taskMeta(activeTask, locale ?? "en").done}
            <span>{taskRows.length}/{taskMeta(activeTask, locale ?? "en").rows.length}</span>
          </button>
          <button className="task-skip" onClick={skipTask}>
            {isSpanish ? "Omitir tarea (Guardás tu energía pero perdés puntos con el jefe: -2 Mirada del jefe)" : "Skip task (Save energy but lose boss approval: -2 Boss Approval)"}
          </button>
        </article>
      </div>
    )}
  </main>;
}
