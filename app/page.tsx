"use client";

import { useEffect, useMemo, useState } from "react";
import { Changes, Choice, CorporateEvent, getGameData, Locale, Stat } from "./game-data";

type RiskKey = "reputation" | "influence" | "energy" | "savings";
type PendingConsequence = { turns: number; title: string; message: string; changes: Changes; origin?: string };
type Game = { position: number; year: number; turn: number; stats: Record<Stat, number>; items: string[]; flags: string[]; log: string[]; skippedTurns: number; seenEventIds: string[]; recentEventTitles: string[]; pending: PendingConsequence[]; riskWarnings: Record<RiskKey, number>; riskCooldown: number; ended?: "won" | "burnout" };
type Resolution = { title: string; message: string; changes: Changes; skippedTurns?: number; item?: string; state: string };
type TeamMate = { name: string; role: string; tenure: string; rank: number; reputation: number; favor: number; note: string; tone: string };
type ScenarioKey = "meeting" | "incident" | "reorg" | "leadership" | "social" | "fun" | "workload" | "credit" | "systems" | "review" | "politics" | "boundary" | "wellbeing" | "life";
const SAVE_KEY = "corpority-save-v1";
const LANGUAGE_KEY = "corpority-language-v1";
const BRIEFING_KEY = "corpority-briefing-v2";
const CAREER_YEARS = 8;
const clamp = (value: number) => Math.max(0, Math.min(100, value));
const pick = <T,>(items: readonly T[]) => items[Math.floor(Math.random() * items.length)];

function createGame(locale: Locale): Game {
  return { position: 0, year: 1, turn: 1, stats: { salary: 38, savings: 14, health: 76, energy: 72, motivation: 68, reputation: 18, influence: 4 }, items: [], flags: [], skippedTurns: 0, seenEventIds: [], recentEventTitles: [], pending: [], riskWarnings: { reputation: 0, influence: 0, energy: 0, savings: 0 }, riskCooldown: 0, log: [getGameData(locale).text.startLog] };
}
function teamFor(locale: Locale): TeamMate[] {
  return locale === "es-AR" ? [
    { name: "Clara M.", role: "Head of Strategy", tenure: "9 años", rank: 91, reputation: 34, favor: 96, tone: "gold", note: "El director fue su padrino laboral. Nadie sabe qué hace, pero firma todo." },
    { name: "Tomás R.", role: "Senior Manager", tenure: "6 años", rank: 76, reputation: 72, favor: 63, tone: "blue", note: "Hace el trabajo. También sabe cuándo estar cerca de quien decide." },
    { name: "Mica V.", role: "Analista SSR", tenure: "2 años", rank: 48, reputation: 83, favor: 22, tone: "green", note: "La más competente del equipo. Por eso tiene el doble de trabajo." },
    { name: "Bruno P.", role: "Project Lead", tenure: "4 años", rank: 67, reputation: 19, favor: 79, tone: "pink", note: "Su reputación es pésima; su relación con Finanzas, excelente." },
  ] : [
    { name: "Clara M.", role: "Head of Strategy", tenure: "9 years", rank: 91, reputation: 34, favor: 96, tone: "gold", note: "The director was her career sponsor. Nobody knows her deliverables, but she signs off on everything." },
    { name: "Tom R.", role: "Senior Manager", tenure: "6 years", rank: 76, reputation: 72, favor: 63, tone: "blue", note: "He does the work. He also knows when to stand near the decision maker." },
    { name: "Mika V.", role: "Associate Analyst", tenure: "2 years", rank: 48, reputation: 83, favor: 22, tone: "green", note: "The most capable person in the team. That is why she has twice the workload." },
    { name: "Bruno P.", role: "Project Lead", tenure: "4 years", rank: 67, reputation: 19, favor: 79, tone: "pink", note: "His reputation is terrible; his relationship with Finance is excellent." },
  ];
}
function resourceDescription(item: string, locale: Locale) {
  const descriptions: Record<string, [string, string]> = {
    "Contacto interno": ["+1 Influencia cuando una decisión ya te da Influencia.", "+1 Influence whenever a decision already gives Influence."],
    "Internal contact": ["+1 Influencia cuando una decisión ya te da Influencia.", "+1 Influence whenever a decision already gives Influence."],
    "Manual de supervivencia": ["Reduce en 1 los costos de Energía de cada decisión.", "Reduces every Energy cost from a decision by 1."],
    "Survival manual": ["Reduce en 1 los costos de Energía de cada decisión.", "Reduces every Energy cost from a decision by 1."],
  };
  return descriptions[item]?.[locale === "es-AR" ? 0 : 1] ?? (locale === "es-AR" ? "Una palanca adquirida en una decisión anterior." : "Leverage earned through an earlier decision.");
}
function adjustedChanges(changes: Changes, items: string[]): Changes {
  const result = { ...changes };
  const hasContact = items.includes("Contacto interno") || items.includes("Internal contact");
  const hasManual = items.includes("Manual de supervivencia") || items.includes("Survival manual");
  if (hasContact && (result.influence ?? 0) > 0) result.influence = (result.influence ?? 0) + 1;
  if (hasManual && (result.energy ?? 0) < 0) result.energy = Math.min(0, (result.energy ?? 0) + 1);
  return result;
}
function teamVerdict(member: TeamMate, locale: Locale) {
  if (member.favor - member.reputation > 25) return locale === "es-AR" ? "Protegido: el favor pesa más que sus resultados." : "Protected: favor outweighs results.";
  if (member.reputation - member.favor > 25) return locale === "es-AR" ? "Confiable, pero subvalorado por el círculo." : "Trusted, but undervalued by the circle.";
  return locale === "es-AR" ? "Sabe jugar al sistema y al trabajo." : "Knows how to play both work and the system.";
}
function riskEventFor(game: Game, locale: Locale): { key: RiskKey; event: CorporateEvent } | null {
  if (game.year < 2 || game.riskCooldown > 0) return null;
  const es = locale === "es-AR";
  if (game.stats.reputation <= 10) {
    const severe = game.riskWarnings.reputation >= 2;
    return { key: "reputation", event: { id: "risk-reputation", title: severe ? (es ? "Proyecto reasignado" : "Project reassigned") : (es ? "Señal de performance" : "Performance signal"), category: es ? "Desempeño" : "Performance", rarity: severe ? "rare" : "uncommon", description: severe ? (es ? "Durante varios meses tu reputación quedó demasiado baja para que alguien te asigne un proyecto visible. No es un despido: es una advertencia de que la empresa ya decidió mirar para otro lado." : "For several months your reputation has been too low for anyone to give you a visible project. It is not a firing: it is a warning that the company has decided to look away.") : (es ? "Tus últimas entregas llegaron con dudas y nadie salió a defenderlas. Tu reputación baja no crea un castigo mágico: hace que las reuniones sean más incómodas y que tus errores se interpreten peor." : "Your recent deliveries arrived with doubts and nobody defended them. Low reputation does not create a magical punishment: it makes meetings more uncomfortable and your mistakes look worse."), changes: {}, choices: severe ? [{ label: es ? "Aceptar un plan de mejora claro" : "Accept a clear improvement plan", consequence: es ? "Pedís objetivos concretos y recuperás una chance de demostrar consistencia." : "You ask for concrete goals and regain a chance to show consistency.", changes: { reputation: 2, energy: -2 } }, { label: es ? "Dejar que otro tome el proyecto" : "Let someone else take the project", consequence: es ? "Perdés visibilidad ahora, pero evitás prometer lo que no podés sostener." : "You lose visibility now, but avoid promising what you cannot sustain.", changes: { influence: -2, health: 1 } }] : [{ label: es ? "Pedir feedback específico" : "Ask for specific feedback", consequence: es ? "Transformás rumores en expectativas concretas. Cuesta energía, pero te da margen." : "You turn rumors into concrete expectations. It costs energy, but gives you room.", changes: { reputation: 2, energy: -2 } }, { label: es ? "Seguir como si nada" : "Carry on as if nothing happened", consequence: es ? "No cambia nada hoy. La siguiente evaluación va a llegar con menos paciencia." : "Nothing changes today. The next review will arrive with less patience.", changes: { motivation: -1 }, delayed: { turns: 3, title: es ? "Evaluación incómoda" : "Uncomfortable review", message: es ? "No corregiste las señales de performance cuando todavía había tiempo. Ahora la conversación es formal." : "You did not address the performance signals while there was time. Now the conversation is formal.", changes: { reputation: -3, energy: -2 } } }] } };
  }
  if (game.stats.influence <= 8) return { key: "influence", event: { id: "risk-influence", title: es ? "Nadie te nombra" : "Nobody names you", category: es ? "Política" : "Politics", rarity: "uncommon", description: es ? "Se abre una oportunidad y tu nombre no aparece en la conversación. Con poca influencia, no hay sponsor que recuerde tu trabajo cuando no estás en la sala." : "An opportunity opens and your name never enters the conversation. With little influence, no sponsor remembers your work when you are not in the room.", changes: {}, choices: [{ label: es ? "Pedir una presentación al sponsor" : "Ask a sponsor for an introduction", consequence: es ? "Te exponés un poco, pero alguien con llegada te ubica en el mapa." : "You expose yourself a little, but someone with reach puts you on the map.", changes: { influence: 3, energy: -1 } }, { label: es ? "Confiar en que el mérito hable" : "Trust merit to speak for itself", consequence: es ? "El trabajo sigue siendo bueno. La promoción se la dan a alguien que sí estaba en la conversación." : "The work remains good. The promotion goes to someone who was in the conversation.", changes: { motivation: -3, reputation: 1 } }] } };
  if (game.stats.energy <= 18) {
    const severe = game.riskWarnings.energy >= 2;
    return { key: "energy", event: { id: "risk-energy", title: severe ? (es ? "Error por cansancio" : "Fatigue error") : (es ? "Cansancio acumulado" : "Accumulated fatigue"), category: es ? "Salud" : "Health", rarity: severe ? "rare" : "uncommon", description: severe ? (es ? "Venís trabajando con la energía al límite y un detalle se escapó. No ocurrió porque seas irresponsable: ocurrió porque descansar dejó de ser una opción real hace varios turnos." : "You have been working at the limit and a detail slipped through. It did not happen because you are irresponsible: it happened because rest stopped being a real option several turns ago.") : (es ? "Tu energía baja empieza a tener efectos concretos: olvidos chicos, respuestas más lentas y menos margen para una reunión difícil." : "Low energy is starting to have concrete effects: small omissions, slower responses, and less room for a difficult meeting."), changes: {}, choices: severe ? [{ label: es ? "Pedir licencia corta" : "Take a short leave", consequence: es ? "Faltás para recuperarte. El equipo absorbe el trabajo y tu agenda pierde un turno." : "You step away to recover. The team absorbs the work and your calendar loses a turn.", changes: { health: 6, reputation: -1 }, skipTurns: 1 }, { label: es ? "Corregirlo y seguir" : "Fix it and keep going", consequence: es ? "Salvás la entrega, pero el costo llega a tu cuerpo antes que al proyecto." : "You save the delivery, but the cost reaches your body before the project.", changes: { reputation: 2, energy: -4, health: -3 } }] : [{ label: es ? "Reorganizar y cortar" : "Reprioritize and stop", consequence: es ? "Dejás algo para mañana antes de que el cansancio lo rompa todo." : "You leave something for tomorrow before fatigue breaks everything.", changes: { energy: 4, reputation: -1 } }, { label: es ? "Empujar una noche más" : "Push through one more night", consequence: es ? "Ganás horas hoy. Si el cansancio sigue, el error no va a ser opcional." : "You gain hours today. If fatigue continues, the error will not be optional.", changes: { reputation: 1, energy: -3 }, delayed: { turns: 2, title: es ? "Detalle olvidado" : "Forgotten detail", message: es ? "Seguiste trabajando con cansancio y una omisión llegó al cliente antes que la corrección." : "You kept working while exhausted and an omission reached the client before the correction.", changes: { reputation: -3, health: -2 } } }] } };
  }
  if (game.stats.savings <= 10) return { key: "savings", event: { id: "risk-savings", title: es ? "Margen financiero mínimo" : "No financial margin", category: es ? "Vida personal" : "Personal life", rarity: "uncommon", description: es ? "Tus ahorros están tan bajos que un gasto chico ya condiciona cómo trabajás. No es mala administración: es no tener margen para que algo salga mal." : "Your savings are so low that a small expense now affects how you work. It is not bad management: it is having no room for anything to go wrong.", changes: {}, choices: [{ label: es ? "Tomar trabajo extra" : "Take extra work", consequence: es ? "Entrás plata rápido. También perdés el descanso que te sostenía." : "Money arrives quickly. So does the loss of rest that was holding you together.", changes: { savings: 5, energy: -3, health: -1 } }, { label: es ? "Recortar un plan personal" : "Cut a personal plan", consequence: es ? "Evitás la urgencia financiera, pero cedés algo que esperabas hace tiempo." : "You avoid the financial emergency, but give up something you had been looking forward to.", changes: { savings: 3, motivation: -3 } }, { label: es ? "Postergar el pago" : "Delay the payment", consequence: es ? "Ganás unos días. El costo vuelve cuando ya no podés elegir tanto." : "You gain a few days. The cost returns when you have less choice.", changes: { motivation: -1 }, delayed: { turns: 2, title: es ? "Pago vencido" : "Overdue payment", message: es ? "Postergaste el gasto para sobrevivir el momento. Ahora vence con un recargo y te obliga a reorganizar todo." : "You delayed the expense to survive the moment. Now it returns with a late fee and forces you to reorganize everything.", changes: { savings: -6, energy: -1 } } }] } };
  return null;
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
      { label: "Pedir una decisión concreta", consequence: "Reducís el ruido y dejás a alguien con una acción escrita.", changes: { reputation: 2, energy: -1 } },
      { label: "Hacer una pregunta incómoda", consequence: "La sala se queda quieta. Tu nombre queda asociado al problema y a la honestidad.", changes: { influence: 3, reputation: -2 } },
      { label: "No discutir y documentar todo", consequence: "Sobrevivís a la reunión. Después te piden el acta y una presentación.", changes: { energy: -3, reputation: 1 } },
    ],
    incident: [
      { label: "Resolverlo sin pedir permiso", consequence: "Evitás el desastre. Seguridad abre un ticket sobre tu método.", changes: { reputation: 3, energy: -3 } },
      { label: "Escalar con evidencia", consequence: "La responsabilidad queda repartida. También el crédito.", changes: { influence: 2, reputation: 1 } },
      { label: "Esperar el proceso oficial", consequence: "El proceso llega tarde. Quedás fuera mientras hacen la revisión.", changes: { health: 1, reputation: -3 }, skipTurns: 1 },
    ],
    reorg: [
      { label: "Pedir claridad por escrito", consequence: "No te la dan, pero tu pregunta circula por chats privados.", changes: { reputation: 2, influence: 1 } },
      { label: "Hacerte indispensable", consequence: "Te quedás con un proceso crítico y con la ansiedad que trae.", changes: { reputation: 4, energy: -4, health: -2 } },
      { label: "Guardar distancia y observar", consequence: "No elegís bando. Por ahora, nadie te elige para nada.", changes: { health: 2, influence: -2 } },
    ],
    leadership: [
      { label: "Convertirlo en algo ejecutable", consequence: "Le das forma al humo. Otra persona lo presenta como visión.", changes: { reputation: 3, energy: -3 } },
      { label: "Sumarte al relato", consequence: "Ganás visibilidad y aprendés a decir mucho sin prometer nada.", changes: { influence: 4, motivation: -2 } },
      { label: "Señalar el riesgo", consequence: "Tenías razón. Te invitan menos a las reuniones de celebración.", changes: { reputation: -2, health: 1 }, skipTurns: 1 },
    ],
    social: [
      { label: "Invertir tiempo en el vínculo", consequence: "La conversación parece casual. La información no lo es.", changes: { influence: 3, energy: -2 }, item: "Contacto interno" },
      { label: "Mantenerlo profesional", consequence: "Conservás energía y perdés una oportunidad de enterarte antes.", changes: { health: 2, influence: -1 } },
      { label: "Decir exactamente lo que pensás", consequence: "La anécdota llega a otra área antes que vos.", changes: { motivation: 2, reputation: -4 } },
    ],
    fun: [
      { label: "Aparecer el tiempo justo", consequence: "Te ven. No te quedás para la foto vergonzosa.", changes: { reputation: 2, energy: -1 } },
      { label: "Entregar entusiasmo premium", consequence: "La gente indicada te recuerda. Tu batería, no.", changes: { influence: 3, energy: -4, motivation: -2 } },
      { label: "Inventar un compromiso impostergable", consequence: "Funciona. Una persona archiva la ausencia para más adelante.", changes: { health: 2, reputation: -2 } },
    ],
    workload: [
      { label: "Negociar alcance y fecha", consequence: "Recortás algo real. El pedido vuelve con otro nombre mañana.", changes: { reputation: 2, energy: -2 } },
      { label: "Hacerlo de noche y cobrar después", consequence: "Entregás. El agradecimiento llega en una reacción de Slack.", changes: { reputation: 4, energy: -5, health: -3 } },
      { label: "Dejar que falle de forma visible", consequence: "Se entiende el problema cuando ya hay impacto. Te apartan del próximo turno.", changes: { influence: 1, reputation: -4, health: 1 }, skipTurns: 1 },
    ],
    credit: [
      { label: "Registrar tu aporte con calma", consequence: "La evidencia queda. El ambiente se vuelve un poco más frío.", changes: { reputation: 2, influence: 1 } },
      { label: "Dejar que otro se lleve el crédito", consequence: "Te ahorrás una pelea. La factura emocional queda abierta.", changes: { health: -2, motivation: -3 } },
      { label: "Reclamarlo delante de todos", consequence: "Recuperás tu voz. La próxima oportunidad se reasigna sin explicación.", changes: { influence: 3, reputation: -3 }, skipTurns: 1 },
    ],
    systems: [
      { label: "Arreglarlo y documentarlo", consequence: "Creás orden. A partir de hoy, sos el dueño no oficial.", changes: { reputation: 3, energy: -3 }, item: "Manual de supervivencia" },
      { label: "Pedir un dueño formal", consequence: "Se abre una mesa de trabajo para decidir quién abre otra mesa de trabajo.", changes: { influence: 1, motivation: -2 } },
      { label: "Usar el atajo que todos usan", consequence: "Funciona hasta que Auditoría pregunta. Después, perdés el turno explicando.", changes: { energy: 2, reputation: -3 }, skipTurns: 1 },
    ],
    review: [
      { label: "Llevar hechos y métricas", consequence: "Tu trabajo por fin tiene subtítulos. No garantiza que los lean.", changes: { reputation: 3, influence: 1 } },
      { label: "Vender tu potencial", consequence: "Sonás listo para más. También para más reuniones.", changes: { influence: 3, motivation: -1, energy: -2 } },
      { label: "Ser brutalmente honesto", consequence: "La conversación se vuelve humana. El sistema toma nota de que sos difícil.", changes: { health: 2, reputation: -3 } },
    ],
    politics: [
      { label: "Construir una alianza temporal", consequence: "Ganás respaldo para hoy. Mañana alguien va a cobrarlo.", changes: { influence: 4, reputation: 1 } },
      { label: "Resolver el problema, no la pelea", consequence: "El proyecto avanza. Los dos bandos coinciden en ignorarte.", changes: { reputation: 2, motivation: -2 } },
      { label: "Elegir un bando en público", consequence: "La claridad es valorada hasta que cambia la jerarquía.", changes: { influence: 2, reputation: -4 }, skipTurns: 1 },
    ],
    boundary: [
      { label: "Proteger tu tiempo", consequence: "Recuperás una noche. El relato de compromiso se resiente.", changes: { health: 4, energy: 3, reputation: -2 } },
      { label: "Negociar una excepción", consequence: "Conseguís algo razonable. También una deuda invisible.", changes: { influence: 2, energy: -1 } },
      { label: "Ceder una vez más", consequence: "La excepción confirma que siempre estabas disponible.", changes: { reputation: 3, health: -4, energy: -4 } },
    ],
    wellbeing: [
      { label: "Tomarte el bienestar en serio", consequence: "Cortás antes. El problema sigue, pero vos también.", changes: { health: 6, energy: 3, reputation: -2 } },
      { label: "Convertirlo en productividad", consequence: "Meditás diez minutos y volvés a la misma urgencia con mejor postura.", changes: { motivation: 2, energy: -1 } },
      { label: "Decir que no estás bien", consequence: "Una persona te escucha. Otra marca tu ausencia en la planificación.", changes: { health: 4, reputation: -2 }, skipTurns: 1 },
    ],
    life: [
      { label: "Resolver lo urgente y pagar el costo", consequence: "Ganás aire hoy. La decisión deja una cuenta pendiente para más adelante.", changes: { savings: -5, health: -1 } },
      { label: "Pedir flexibilidad de verdad", consequence: "Hacés visible que tu vida existe fuera del organigrama.", changes: { health: 3, reputation: -2, influence: 1 } },
      { label: "Patearlo un poco más", consequence: "El problema espera. No se va.", changes: { energy: 1, motivation: -2 }, delayed: { turns: 3, title: "La cuenta llega", message: "Lo que postergaste ya no puede esperar. La urgencia personal vuelve con recargo.", changes: { savings: -7, health: -2 } } },
    ],
  } : {
    meeting: [{ label: "Ask for one concrete decision", consequence: "You cut the noise and leave someone with a written action.", changes: { reputation: 2, energy: -1 } }, { label: "Ask the uncomfortable question", consequence: "The room goes quiet. Your name becomes tied to both the problem and the honesty.", changes: { influence: 3, reputation: -2 } }, { label: "Do not argue; document everything", consequence: "You survive the meeting. Then they ask for minutes and a deck.", changes: { energy: -3, reputation: 1 } }],
    incident: [{ label: "Fix it without permission", consequence: "You avoid disaster. Security opens a ticket about your method.", changes: { reputation: 3, energy: -3 } }, { label: "Escalate with evidence", consequence: "Responsibility is shared. So is the credit.", changes: { influence: 2, reputation: 1 } }, { label: "Wait for the official process", consequence: "The process arrives late. You are sidelined during the review.", changes: { health: 1, reputation: -3 }, skipTurns: 1 }],
    reorg: [{ label: "Ask for clarity in writing", consequence: "You do not get it, but your question circulates in private chats.", changes: { reputation: 2, influence: 1 } }, { label: "Make yourself indispensable", consequence: "You own a critical process and the anxiety that comes with it.", changes: { reputation: 4, energy: -4, health: -2 } }, { label: "Keep distance and observe", consequence: "You pick no side. For now, no one picks you for anything.", changes: { health: 2, influence: -2 } }],
    leadership: [{ label: "Turn it into something executable", consequence: "You shape the smoke. Someone else presents it as vision.", changes: { reputation: 3, energy: -3 } }, { label: "Join the narrative", consequence: "You gain visibility and learn to say plenty without promising much.", changes: { influence: 4, motivation: -2 } }, { label: "Name the risk", consequence: "You are right. You are invited to fewer celebration meetings.", changes: { reputation: -2, health: 1 }, skipTurns: 1 }],
    social: [{ label: "Invest in the relationship", consequence: "The conversation feels casual. The information is not.", changes: { influence: 3, energy: -2 }, item: "Internal contact" }, { label: "Keep it professional", consequence: "You keep energy and lose the chance to hear things early.", changes: { health: 2, influence: -1 } }, { label: "Say exactly what you think", consequence: "The story reaches another department before you do.", changes: { motivation: 2, reputation: -4 } }],
    fun: [{ label: "Show up for exactly long enough", consequence: "They see you. You leave before the embarrassing photo.", changes: { reputation: 2, energy: -1 } }, { label: "Perform premium enthusiasm", consequence: "The right people remember you. Your battery does not.", changes: { influence: 3, energy: -4, motivation: -2 } }, { label: "Invent an urgent commitment", consequence: "It works. Someone files your absence away for later.", changes: { health: 2, reputation: -2 } }],
    workload: [{ label: "Negotiate scope and date", consequence: "You cut something real. The request returns tomorrow under another name.", changes: { reputation: 2, energy: -2 } }, { label: "Do it overnight; invoice later", consequence: "You deliver. The thanks arrive as a Slack reaction.", changes: { reputation: 4, energy: -5, health: -3 } }, { label: "Let it fail visibly", consequence: "The problem is understood after impact. You are removed from the next round.", changes: { influence: 1, reputation: -4, health: 1 }, skipTurns: 1 }],
    credit: [{ label: "Record your contribution calmly", consequence: "The evidence remains. The room gets a little colder.", changes: { reputation: 2, influence: 1 } }, { label: "Let someone else take the credit", consequence: "You avoid a fight. The emotional invoice remains open.", changes: { health: -2, motivation: -3 } }, { label: "Claim it in front of everyone", consequence: "You recover your voice. The next opportunity is reassigned without explanation.", changes: { influence: 3, reputation: -3 }, skipTurns: 1 }],
    systems: [{ label: "Fix it and document it", consequence: "You create order. From today, you are the unofficial owner.", changes: { reputation: 3, energy: -3 }, item: "Survival manual" }, { label: "Ask for a formal owner", consequence: "A working group opens to decide who opens another working group.", changes: { influence: 1, motivation: -2 } }, { label: "Use the shortcut everyone uses", consequence: "It works until Audit asks. Then you lose a turn explaining.", changes: { energy: 2, reputation: -3 }, skipTurns: 1 }],
    review: [{ label: "Bring facts and metrics", consequence: "Your work finally has subtitles. That does not mean they read them.", changes: { reputation: 3, influence: 1 } }, { label: "Sell your potential", consequence: "You sound ready for more. Also for more meetings.", changes: { influence: 3, motivation: -1, energy: -2 } }, { label: "Be brutally honest", consequence: "The conversation gets human. The system notes that you are difficult.", changes: { health: 2, reputation: -3 } }],
    politics: [{ label: "Build a temporary alliance", consequence: "You gain support for today. Tomorrow someone will collect on it.", changes: { influence: 4, reputation: 1 } }, { label: "Solve the problem, not the fight", consequence: "The project moves. Both sides agree to ignore you.", changes: { reputation: 2, motivation: -2 } }, { label: "Pick a side in public", consequence: "Clarity is valued until the hierarchy changes.", changes: { influence: 2, reputation: -4 }, skipTurns: 1 }],
    boundary: [{ label: "Protect your time", consequence: "You recover an evening. The commitment narrative takes a hit.", changes: { health: 4, energy: 3, reputation: -2 } }, { label: "Negotiate one exception", consequence: "You get something reasonable. You also acquire an invisible debt.", changes: { influence: 2, energy: -1 } }, { label: "Give in one more time", consequence: "The exception confirms you were always available.", changes: { reputation: 3, health: -4, energy: -4 } }],
    wellbeing: [{ label: "Take wellbeing seriously", consequence: "You stop early. The problem remains, but so do you.", changes: { health: 6, energy: 3, reputation: -2 } }, { label: "Turn it into productivity", consequence: "You meditate for ten minutes and return to the same urgency with better posture.", changes: { motivation: 2, energy: -1 } }, { label: "Say you are not okay", consequence: "One person listens. Another marks your absence in planning.", changes: { health: 4, reputation: -2 }, skipTurns: 1 }],
    life: [{ label: "Solve the urgent thing and pay the cost", consequence: "You gain air today. The decision leaves a bill for later.", changes: { savings: -5, health: -1 } }, { label: "Ask for real flexibility", consequence: "You make it visible that your life exists outside the org chart.", changes: { health: 3, reputation: -2, influence: 1 } }, { label: "Put it off a little longer", consequence: "The problem waits. It does not leave.", changes: { energy: 1, motivation: -2 }, delayed: { turns: 3, title: "The bill arrives", message: "What you postponed cannot wait anymore. Personal urgency returns with interest.", changes: { savings: -7, health: -2 } } }],
  };
  return sets[key];
}

export default function Home() {
  const [locale, setLocale] = useState<Locale | null>(null);
  const [game, setGame] = useState<Game>(createGame("en"));
  const [activeEvent, setActiveEvent] = useState<CorporateEvent | null>(null);
  const [dicePush, setDicePush] = useState<number | null>(null);
  const [rolling, setRolling] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);
  const [showBriefing, setShowBriefing] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [sessionClosed, setSessionClosed] = useState(false);
  const [resolution, setResolution] = useState<Resolution | null>(null);

  useEffect(() => {
    const savedLanguage = localStorage.getItem(LANGUAGE_KEY);
    const savedGame = localStorage.getItem(SAVE_KEY);
    if (savedLanguage === "en" || savedLanguage === "es-AR") setLocale(savedLanguage);
    if (savedGame) { try { const parsed = JSON.parse(savedGame); setGame({ ...createGame(savedLanguage === "es-AR" ? "es-AR" : "en"), ...parsed, skippedTurns: parsed.skippedTurns ?? 0, seenEventIds: parsed.seenEventIds ?? [], recentEventTitles: parsed.recentEventTitles ?? [], pending: parsed.pending ?? [], riskWarnings: parsed.riskWarnings ?? { reputation: 0, influence: 0, energy: 0, savings: 0 }, riskCooldown: parsed.riskCooldown ?? 0 }); } catch {} }
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
  const stage = game.year <= 2 ? (isSpanish ? "Adaptación" : "Orientation") : game.year <= 4 ? (isSpanish ? "Credibilidad" : "Credibility") : game.year <= 6 ? (isSpanish ? "Política" : "Politics") : (isSpanish ? "Salida" : "Exit strategy");
  const faceMood = game.stats.health < 35 ? "strained" : game.stats.influence > 55 || game.stats.salary > 70 ? "powerful" : game.stats.motivation < 30 ? "flat" : "steady";
  const boardPositions = useMemo(() => tiles.map((_, i) => { const cols = 18; const rows = 12; if (i < cols) return { left: `${(i / (cols - 1)) * 100}%`, top: "0%" }; if (i < cols + rows - 1) return { left: "100%", top: `${((i - cols + 1) / (rows - 1)) * 100}%` }; if (i < cols * 2 + rows - 2) return { left: `${100 - ((i - cols - rows + 2) / (cols - 1)) * 100}%`, top: "100%" }; return { left: "0%", top: `${100 - ((i - (cols * 2 + rows - 2)) / (rows - 1)) * 100}%` }; }), [tiles]);

  function chooseLanguage(nextLocale: Locale) { setLocale(nextLocale); localStorage.setItem(LANGUAGE_KEY, nextLocale); setShowLanguagePicker(false); if (!localStorage.getItem(BRIEFING_KEY)) setShowBriefing(true); }
  function closeBriefing() { localStorage.setItem(BRIEFING_KEY, "seen"); setShowBriefing(false); }
  function changesText(changes: Changes, items = game.items) { return Object.entries(adjustedChanges(changes, items)).map(([key, value]) => `${value! > 0 ? "+" : ""}${value} ${stats[key as Stat].label}`).join(" · "); }
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
      const penalty = choice?.skipTurns ? ` ${isSpanish ? `Prenda: perdés ${choice.skipTurns} turno${choice.skipTurns > 1 ? "s" : ""}.` : `Forfeit: lose ${choice.skipTurns} turn${choice.skipTurns > 1 ? "s" : ""}.`}` : "";
      const pending = choice?.delayed ? [...current.pending, { ...choice.delayed, origin: message }] : current.pending;
      const delayed = choice?.delayed ? ` ${isSpanish ? `Consecuencia en ${choice.delayed.turns} turnos: ${choice.delayed.title}.` : `Consequence in ${choice.delayed.turns} turns: ${choice.delayed.title}.`}` : "";
      const warning = exhaustionWarning ? ` ${isSpanish ? "Señal de burnout: te tomás un turno para recuperarte antes de que sea peor." : "Burnout signal: you take a turn to recover before it gets worse."}` : "";
      const riskWarnings = exhaustionWarning ? { ...current.riskWarnings, energy: current.riskWarnings.energy + 1 } : current.riskWarnings;
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
  function optionsFor(event: CorporateEvent): Choice[] { return event.choices ?? choicesForScenario(locale ?? "en", event); }
  function roll() {
    if (rolling || activeEvent || game.ended || !locale) return;
    const due = game.pending.find(consequence => consequence.turns <= 0);
    if (due) {
      setGame(current => ({ ...current, pending: current.pending.filter(consequence => consequence !== due) }));
      const explanation = due.origin ? (isSpanish ? `Esto vuelve por una decisión anterior: ${due.origin} ${due.message}` : `This returns because of an earlier decision: ${due.origin} ${due.message}`) : due.message;
      setActiveEvent({ id: `deferred-${due.title}`, title: due.title, description: explanation, category: isSpanish ? "Consecuencia" : "Consequence", changes: {}, choices: [{ label: isSpanish ? "Asumir la consecuencia" : "Take the consequence", consequence: isSpanish ? "El problema no se resolvió solo; ahora tiene un costo concreto." : "The problem did not solve itself; it now has a concrete cost.", changes: due.changes }], rarity: "rare" });
      return;
    }
    const risk = riskEventFor(game, locale);
    if (risk) {
      setGame(current => ({ ...current, riskWarnings: { ...current.riskWarnings, [risk.key]: current.riskWarnings[risk.key] + 1 }, riskCooldown: 4 }));
      setActiveEvent(risk.event);
      return;
    }
    if (game.skippedTurns > 0) {
      setGame(current => ({ ...current, skippedTurns: Math.max(0, current.skippedTurns - 1), riskCooldown: Math.max(0, current.riskCooldown - 1), turn: current.turn + 1, log: [isSpanish ? "Cumplís una prenda y perdés el turno. La agenda sigue sin vos." : "You serve a forfeit and lose the turn. The calendar moves on without you.", ...current.log].slice(0, 5) }));
      return;
    }
    setRolling(true); const result = Math.ceil(Math.random() * 6); setDicePush(null);
    window.setTimeout(() => {
      setDicePush(result); setRolling(false); const newPosition = (game.position + result) % tiles.length; const crossedYear = newPosition < game.position; const landed = tiles[newPosition];
      const designed = choices[landed]; const relevantEvents = events.filter(event => scenarioForEvent(event) === tileScenarioGroups[newPosition]); const unseen = relevantEvents.filter(event => !game.seenEventIds.includes(event.id) && !game.recentEventTitles.includes(event.title)); const event = designed ? { ...designed, id: `choice-${locale}-${landed}`, rarity: "uncommon" as const } : pick(unseen.length ? unseen : relevantEvents.length ? relevantEvents : events);
      setGame(current => ({ ...current, position: newPosition, year: current.year + (crossedYear ? 1 : 0), turn: current.turn + 1, riskCooldown: Math.max(0, current.riskCooldown - 1), pending: current.pending.map(consequence => ({ ...consequence, turns: consequence.turns - 1 })), seenEventIds: [...current.seenEventIds, event.id].slice(-180), recentEventTitles: [...current.recentEventTitles, event.title].slice(-5), stats: { ...current.stats, savings: clamp(current.stats.savings + (crossedYear ? 5 : 0)), salary: clamp(current.stats.salary + (crossedYear ? 2 : 0)) }, log: [crossedYear ? text.passedYear : `${text.landed} ${landed}.`, ...current.log].slice(0, 5) }));
      window.setTimeout(() => setDicePush(null), 1960);
      window.setTimeout(() => setActiveEvent(event), 1750);
    }, 520);
  }
  function restart() { if (!locale) return; localStorage.removeItem(SAVE_KEY); setGame(createGame(locale)); setActiveEvent(null); setDicePush(null); }
  function closeSession(save: boolean) {
    if (!locale) return;
    if (save) localStorage.setItem(SAVE_KEY, JSON.stringify(game));
    else { localStorage.removeItem(SAVE_KEY); setGame(createGame(locale)); }
    setShowExitConfirm(false); setSessionClosed(true);
  }
  if (!loaded) return <main className="loading">Loading Corpority…</main>;

  const turnLabel = game.skippedTurns > 0 ? (isSpanish ? `Cumplir prenda · ${game.skippedTurns}` : `Serve forfeit · ${game.skippedTurns}`) : rolling ? text.rolling : text.roll;
  if (sessionClosed) return <main className="shell closed-shell"><section className="closed-window"><span className="brand-mark">C</span><h1>Corpority</h1><p>{isSpanish ? "La ventana se cerró. Tu carrera puede esperar." : "The window is closed. Your career can wait."}</p><button onClick={() => setSessionClosed(false)}>{isSpanish ? "Volver a abrir" : "Reopen game"}</button></section></main>;
  return <main className="shell">
    <header><div className="brand"><span className="brand-mark">C</span><div><h1>Corpority</h1><p>{text.subtitle}</p></div></div><div className="top-status"><button className="language-button" onClick={() => setShowLanguagePicker(true)}>{locale === "es-AR" ? "ES-AR" : "EN"}</button><span>{text.year} <b>{game.year}</b> / {CAREER_YEARS}</span><div className="progress"><i style={{ width: `${progress}%` }} /></div><span className="career-stage">{stage}</span><span className="job-title">{title}</span><div className="window-controls"><i /><i /><button onClick={() => setShowExitConfirm(true)} aria-label={isSpanish ? "Cerrar juego" : "Close game"}>×</button></div></div></header>
    <section className="game-layout">
      <aside className="profile-panel"><div className="employee"><div className={`avatar portrait ${faceMood}`}><i className="hair" /><i className="eye left" /><i className="eye right" /><i className="mouth" /><b>{game.flags.includes("promoted") ? "★" : ""}</b></div><div><span>{text.employee} #{String(game.turn).padStart(4, "0")}</span><h2>{title}</h2><small>{game.ended ? game.ended === "won" ? text.retired : text.leave : text.employed}</small></div></div><div className="profile-read"><span>{isSpanish ? "TU LUGAR" : "YOUR PLACE"}</span><b>{isSpanish ? "Todavía no sos parte del círculo" : "You are not in the circle yet"}</b><p>{isSpanish ? "Las barras son tus recursos. Cada carta muestra el cambio exacto antes de decidir." : "The bars are your resources. Every card shows the exact change before you decide."}</p></div><div className="stats">{(Object.keys(stats) as Stat[]).map(key => <div className="stat" key={key} title={isSpanish ? `${stats[key].label}: influye en las decisiones y sus consecuencias.` : `${stats[key].label}: affects decisions and their consequences.`}><div><span className={`stat-icon ${stats[key].tone}`}>{stats[key].icon}</span>{stats[key].label}<b>{game.stats[key]}</b></div><div className="meter"><i style={{ width: `${game.stats[key]}%` }} /></div></div>)}</div><div className="inventory leverage"><span className="eyebrow">{isSpanish ? "RECURSOS Y PALANCAS" : "RESOURCES & LEVERAGE"}</span>{game.items.length ? <div className="item-grid">{game.items.map(item => <em key={item}>✦ <b>{item}</b><small>{resourceDescription(item, locale ?? "en")}</small></em>)}</div> : <p>{isSpanish ? "Todavía no tenés cobertura. Las palancas cambian números concretos en futuras decisiones." : "No cover yet. Leverage changes concrete numbers in future decisions."}</p>}</div></aside>
      <section className="board-wrap"><div className="board"><div className="board-center"><span className="eyebrow">{game.skippedTurns > 0 ? (isSpanish ? "PRENDA PENDIENTE" : "FORFEIT PENDING") : text.current}</span><h2>{game.skippedTurns > 0 ? (isSpanish ? "Te dejaron afuera" : "You have been sidelined") : tile}</h2><p>{game.skippedTurns > 0 ? (isSpanish ? "Una mala decisión tiene costo: perdés un turno y otros ocupan el espacio." : "A bad decision has a cost: you lose a turn while others take the space.") : game.ended ? game.ended === "won" ? text.escaped : text.burnout : text.prompt}</p><div className="hint"><b>{isSpanish ? "PISTA" : "HINT"}</b>{isSpanish ? " La influencia tuerce resultados; la reputación decide quién se queda con el crédito." : " Influence bends outcomes; reputation decides who keeps the credit."}</div><button onClick={roll} disabled={rolling || !!activeEvent || !!game.ended || !locale} className={rolling ? "rolling" : ""}>{turnLabel}<span>⌘</span></button></div>{dicePush && <div className="dice-push"><span>{isSpanish ? "TU DADO" : "YOUR ROLL"}</span><b>{dicePush}</b><em>{isSpanish ? "La oficina ya decidió si era demasiado." : "The office has decided whether that was too much."}</em></div>}{tiles.map((name, index) => <div className={`tile ${game.position === index ? "active" : ""} ${index === 0 ? "start" : ""}`} style={boardPositions[index]} key={`${locale}-${name}`}><small>{String(index + 1).padStart(2, "0")}</small><b>{name}</b>{game.position === index && <i className="player-token">●</i>}</div>)}</div></section>
      <aside className="feed-panel"><div className="panel-heading"><div><span className="eyebrow">{isSpanish ? "EL EQUIPO" : "THE TEAM"}</span><h2>{isSpanish ? "La escalera no es igual para todos" : "The ladder is not equal for everyone"}</h2></div><button className="reset" onClick={restart}>{text.reset}</button></div><div className="team-list">{team.map(member => <article className="mate" key={member.name}><div className={`mate-avatar ${member.tone}`}>{member.name.slice(0, 1)}</div><div><header><b>{member.name}</b><span>{member.rank}</span></header><small>{member.role} · {member.tenure}</small><div className="rank-line"><i style={{ width: `${member.rank}%` }} /></div><p>{member.note}</p><div className="team-metrics"><em>{isSpanish ? "Rep." : "Rep."} {member.reputation}</em><em>{isSpanish ? "Favor" : "Favor"} {member.favor}</em></div><strong className={member.favor > member.reputation ? "protected" : "earned"}>{teamVerdict(member, locale ?? "en")}</strong></div></article>)}</div><div className="timeline"><span className="eyebrow">{text.pulse}</span>{game.log.slice(0, 2).map((entry, index) => <div key={`${entry}-${index}`}><i /> <p>{entry}</p></div>)}</div><div className="survival"><span className="eyebrow">{text.odds}</span><b>{Math.max(3, Math.round((game.stats.savings + game.stats.health + game.stats.motivation) / 3))}%</b><p>{text.oddsHint}</p></div></aside>
    </section>
    {activeEvent && <div className="modal-backdrop push-backdrop"><article className="event-card push-card"><button className="dismiss-card" onClick={() => setActiveEvent(null)} aria-label={isSpanish ? "Cerrar tarjeta" : "Close card"}>×</button><div className="event-top"><span>{activeEvent.category} {text.card}</span><em className={activeEvent.rarity}>{text.rarities[activeEvent.rarity]}</em></div><h2>{activeEvent.title}</h2><p>{activeEvent.description}</p><div className="choices">{optionsFor(activeEvent).map(choice => <button key={choice.label} onClick={() => resolveChoice(choice)}><b>{choice.label}</b><span>{choice.consequence}</span><div className="impact-chips">{Object.entries(adjustedChanges(choice.changes, game.items)).map(([key, value]) => <em className={value! > 0 ? "gain" : "loss"} key={key}>{value! > 0 ? "+" : ""}{value} {stats[key as Stat].label}</em>)}{choice.skipTurns ? <em className="loss">{isSpanish ? `Prenda · ${choice.skipTurns} turno` : `Forfeit · ${choice.skipTurns} turn`}</em> : null}{choice.item ? <em className="gain">+ {choice.item}</em> : null}</div></button>)}</div></article></div>}
    {resolution && <aside className="resolution-push"><button onClick={() => setResolution(null)} aria-label={isSpanish ? "Cerrar resultado" : "Close result"}>×</button><span>{isSpanish ? "DECISIÓN REGISTRADA" : "DECISION LOGGED"}</span><b>{resolution.title}</b><p>{resolution.message}</p><div className="impact-chips">{Object.entries(resolution.changes).map(([key, value]) => <em className={value! > 0 ? "gain" : "loss"} key={key}>{value! > 0 ? "+" : ""}{value} {stats[key as Stat].label}</em>)}{resolution.skippedTurns ? <em className="loss">{isSpanish ? `Prenda · ${resolution.skippedTurns} turno` : `Forfeit · ${resolution.skippedTurns} turn`}</em> : null}{resolution.item ? <em className="gain">+ {resolution.item}</em> : null}</div>{resolution.state && <p>{isSpanish ? "Estado actual: " : "Current state: "}{resolution.state}</p>}</aside>}
    {showExitConfirm && <div className="modal-backdrop"><article className="exit-card"><span className="eyebrow">{isSpanish ? "VENTANA DE JUEGO" : "GAME WINDOW"}</span><h2>{isSpanish ? "¿Querés guardar antes de salir?" : "Save before you leave?"}</h2><p>{isSpanish ? "Si cerrás sin guardar, ese ascenso injusto, ese burnout evitado y esa charla incómoda se pierden. Como si nunca hubieran pasado." : "If you close without saving, that unfair promotion, avoided burnout, and difficult conversation disappear. As if they never happened."}</p><div><button className="continue" onClick={() => closeSession(true)}>{isSpanish ? "Guardar y cerrar" : "Save and close"}<span>→</span></button><button className="discard" onClick={() => closeSession(false)}>{isSpanish ? "Cerrar sin guardar" : "Close without saving"}</button><button className="cancel-close" onClick={() => setShowExitConfirm(false)}>{isSpanish ? "Cancelar" : "Cancel"}</button></div></article></div>}
    {showBriefing && <div className="modal-backdrop language-backdrop"><article className="briefing-card"><span className="eyebrow">{isSpanish ? "TU PRIMER DÍA" : "YOUR FIRST DAY"}</span><h2>{isSpanish ? "No arrancás de cero. Arrancás último." : "You are not starting from zero. You are starting last."}</h2><p>{isSpanish ? "Sos junior en un equipo que ya tiene alianzas, historia y gente protegida. No todo ascenso es mérito; no toda mala reputación castiga." : "You are a junior in a team with alliances, history, and protected people. Not every promotion is merit; not every bad reputation is punished."}</p><div className="briefing-team">{team.slice(0, 3).map(member => <div key={member.name}><b>{member.name}</b><span>{member.role} · {member.tenure}</span><em>{isSpanish ? "rango" : "rank"} {member.rank} · {isSpanish ? "favor" : "favor"} {member.favor}</em></div>)}</div><button className="continue" onClick={closeBriefing}>{isSpanish ? "Entiendo. Empecemos." : "I understand. Let's begin."}<span>→</span></button></article></div>}
    {(!locale || showLanguagePicker) && <div className="modal-backdrop language-backdrop"><article className="language-card"><span className="eyebrow">CORPORITY</span><h2>{text.chooseTitle}</h2><p>{text.chooseDescription}</p><div className="language-options"><button onClick={() => chooseLanguage("es-AR")}><b>Español (Argentina)</b><span>ARS · home office · mates · aguante corporativo</span><em>{text.start} →</em></button><button onClick={() => chooseLanguage("en")}><b>English</b><span>Global office politics · meetings · career survival</span><em>{text.start} →</em></button></div></article></div>}
  </main>;
}
