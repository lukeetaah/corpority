"use client";

import { useEffect, useMemo, useState } from "react";
import { Changes, Choice, CorporateEvent, getGameData, Locale, Stat } from "./game-data";

type Game = { position: number; year: number; turn: number; stats: Record<Stat, number>; items: string[]; flags: string[]; log: string[]; skippedTurns: number; ended?: "won" | "burnout" };
type TeamMate = { name: string; role: string; tenure: string; rank: number; reputation: number; favor: number; note: string; tone: string };
const SAVE_KEY = "corpority-save-v1";
const LANGUAGE_KEY = "corpority-language-v1";
const BRIEFING_KEY = "corpority-briefing-v2";
const clamp = (value: number) => Math.max(0, Math.min(100, value));
const pick = <T,>(items: readonly T[]) => items[Math.floor(Math.random() * items.length)];

function createGame(locale: Locale): Game {
  return { position: 0, year: 1, turn: 1, stats: { salary: 38, savings: 14, health: 76, energy: 72, motivation: 68, reputation: 18, influence: 4 }, items: [], flags: [], skippedTurns: 0, log: [getGameData(locale).text.startLog] };
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

export default function Home() {
  const [locale, setLocale] = useState<Locale | null>(null);
  const [game, setGame] = useState<Game>(createGame("en"));
  const [activeEvent, setActiveEvent] = useState<CorporateEvent | null>(null);
  const [dice, setDice] = useState<number | null>(null);
  const [rolling, setRolling] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);
  const [showBriefing, setShowBriefing] = useState(false);

  useEffect(() => {
    const savedLanguage = localStorage.getItem(LANGUAGE_KEY);
    const savedGame = localStorage.getItem(SAVE_KEY);
    if (savedLanguage === "en" || savedLanguage === "es-AR") setLocale(savedLanguage);
    if (savedGame) { try { setGame({ ...createGame(savedLanguage === "es-AR" ? "es-AR" : "en"), ...JSON.parse(savedGame), skippedTurns: JSON.parse(savedGame).skippedTurns ?? 0 }); } catch {} }
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
  const progress = Math.min(100, Math.round((game.year / 30) * 100));
  const faceMood = game.stats.health < 35 ? "strained" : game.stats.influence > 55 || game.stats.salary > 70 ? "powerful" : game.stats.motivation < 30 ? "flat" : "steady";
  const boardPositions = useMemo(() => tiles.map((_, i) => { const cols = 18; const rows = 12; if (i < cols) return { left: `${(i / (cols - 1)) * 100}%`, top: "0%" }; if (i < cols + rows - 1) return { left: "100%", top: `${((i - cols + 1) / (rows - 1)) * 100}%` }; if (i < cols * 2 + rows - 2) return { left: `${100 - ((i - cols - rows + 2) / (cols - 1)) * 100}%`, top: "100%" }; return { left: "0%", top: `${100 - ((i - (cols * 2 + rows - 2)) / (rows - 1)) * 100}%` }; }), [tiles]);

  function chooseLanguage(nextLocale: Locale) { setLocale(nextLocale); localStorage.setItem(LANGUAGE_KEY, nextLocale); setShowLanguagePicker(false); if (!localStorage.getItem(BRIEFING_KEY)) setShowBriefing(true); }
  function closeBriefing() { localStorage.setItem(BRIEFING_KEY, "seen"); setShowBriefing(false); }
  function changesText(changes: Changes) { return Object.entries(changes).map(([key, value]) => `${value! > 0 ? "+" : ""}${value} ${stats[key as Stat].label}`).join(" · "); }
  function apply(changes: Changes, message: string, choice?: Choice) {
    setGame(current => {
      const nextStats = { ...current.stats };
      for (const [key, value] of Object.entries(changes)) nextStats[key as Stat] = clamp(nextStats[key as Stat] + value!);
      const flags = choice?.tag && !current.flags.includes(choice.tag) ? [...current.flags, choice.tag] : current.flags;
      const item = choice?.item && !current.items.includes(choice.item) ? [...current.items, choice.item] : current.items;
      const skippedTurns = (current.skippedTurns ?? 0) + (choice?.skipTurns ?? 0);
      const penalty = choice?.skipTurns ? ` ${isSpanish ? `Prenda: perdés ${choice.skipTurns} turno${choice.skipTurns > 1 ? "s" : ""}.` : `Forfeit: lose ${choice.skipTurns} turn${choice.skipTurns > 1 ? "s" : ""}.`}` : "";
      const ended = nextStats.health === 0 ? "burnout" : current.year >= 30 && nextStats.savings >= 55 && nextStats.health >= 35 ? "won" : undefined;
      return { ...current, stats: nextStats, flags, items: item, skippedTurns, ended, log: [`${message}${penalty}`, ...current.log].slice(0, 5) };
    });
  }
  function optionsFor(event: CorporateEvent): Choice[] {
    if (event.choices) return event.choices;
    const harsh = Object.values(event.changes).some(value => value !== undefined && value <= -3);
    const item = isSpanish ? ["Mate corporativo", "Auriculares", "Mentor informal", "Certificación"][(event.title.length + event.id.length) % 4] : ["Corporate mug", "Headphones", "Informal mentor", "Certification"][(event.title.length + event.id.length) % 4];
    return isSpanish ? [
      { label: "Resolverlo y que no se note", consequence: "Lo absorbés. El sistema registra el resultado, no el esfuerzo.", changes: event.changes },
      { label: "Mover las piezas", consequence: "Redirigís el problema. Alguien más probablemente lo recuerde.", changes: { influence: 3, reputation: -2, energy: -1 }, item },
      { label: harsh ? "Patearlo hasta que escale" : "Marcar un límite", consequence: harsh ? "El problema se enfría, pero te dejan afuera de la próxima ronda." : "Cuidás tu tiempo. El relato corporativo no lo hace.", changes: harsh ? { health: 2, motivation: -2, reputation: -4 } : { health: 4, motivation: 2, reputation: -3 }, skipTurns: harsh ? 1 : undefined },
    ] : [
      { label: "Make it disappear", consequence: "You absorb it. The system records the outcome, not the effort.", changes: event.changes },
      { label: "Move the pieces", consequence: "You redirect the problem. Someone will probably remember.", changes: { influence: 3, reputation: -2, energy: -1 }, item },
      { label: harsh ? "Delay it until it escalates" : "Set a boundary", consequence: harsh ? "The problem cools down, but you are left out of the next round." : "You protect your time. The corporate story does not.", changes: harsh ? { health: 2, motivation: -2, reputation: -4 } : { health: 4, motivation: 2, reputation: -3 }, skipTurns: harsh ? 1 : undefined },
    ];
  }
  function roll() {
    if (rolling || activeEvent || game.ended || !locale) return;
    if (game.skippedTurns > 0) {
      setGame(current => ({ ...current, skippedTurns: Math.max(0, current.skippedTurns - 1), turn: current.turn + 1, log: [isSpanish ? "Cumplís una prenda y perdés el turno. La agenda sigue sin vos." : "You serve a forfeit and lose the turn. The calendar moves on without you.", ...current.log].slice(0, 5) }));
      return;
    }
    setRolling(true); const result = Math.ceil(Math.random() * 6); setDice(null);
    window.setTimeout(() => {
      setDice(result); setRolling(false); const newPosition = (game.position + result) % tiles.length; const crossedYear = newPosition < game.position; const landed = tiles[newPosition];
      setGame(current => ({ ...current, position: newPosition, year: current.year + (crossedYear ? 1 : 0), turn: current.turn + 1, stats: { ...current.stats, savings: clamp(current.stats.savings + (crossedYear ? 5 : 0)), salary: clamp(current.stats.salary + (crossedYear ? 2 : 0)) }, log: [crossedYear ? text.passedYear : `${text.landed} ${landed}.`, ...current.log].slice(0, 5) }));
      const designed = choices[landed]; const event = designed ? { ...designed, id: `choice-${locale}-${landed}`, rarity: "uncommon" as const } : pick(events);
      window.setTimeout(() => setActiveEvent(event), 450);
    }, 520);
  }
  function restart() { if (!locale) return; localStorage.removeItem(SAVE_KEY); setGame(createGame(locale)); setActiveEvent(null); setDice(null); }
  if (!loaded) return <main className="loading">Loading Corpority…</main>;

  const turnLabel = game.skippedTurns > 0 ? (isSpanish ? `Cumplir prenda · ${game.skippedTurns}` : `Serve forfeit · ${game.skippedTurns}`) : dice ? text.nextTurn : rolling ? text.rolling : text.roll;
  return <main className="shell">
    <header><div className="brand"><span className="brand-mark">C</span><div><h1>Corpority</h1><p>{text.subtitle}</p></div></div><div className="top-status"><button className="language-button" onClick={() => setShowLanguagePicker(true)}>{locale === "es-AR" ? "ES-AR" : "EN"}</button><span>{text.year} <b>{game.year}</b> / 30</span><div className="progress"><i style={{ width: `${progress}%` }} /></div><span className="job-title">{title}</span></div></header>
    <section className="game-layout">
      <aside className="profile-panel"><div className="employee"><div className={`avatar portrait ${faceMood}`}><i className="hair" /><i className="eye left" /><i className="eye right" /><i className="mouth" /><b>{game.flags.includes("promoted") ? "★" : ""}</b></div><div><span>{text.employee} #{String(game.turn).padStart(4, "0")}</span><h2>{title}</h2><small>{game.ended ? game.ended === "won" ? text.retired : text.leave : text.employed}</small></div></div><div className="profile-read"><span>{isSpanish ? "TU LUGAR" : "YOUR PLACE"}</span><b>{isSpanish ? "Todavía no sos parte del círculo" : "You are not in the circle yet"}</b><p>{isSpanish ? "Tu trabajo se ve. Tu contexto, bastante menos." : "Your work is visible. Your context, much less so."}</p></div><div className="stats">{(Object.keys(stats) as Stat[]).map(key => <div className="stat" key={key}><div><span className={`stat-icon ${stats[key].tone}`}>{stats[key].icon}</span>{stats[key].label}<b>{game.stats[key]}</b></div><div className="meter"><i style={{ width: `${game.stats[key]}%` }} /></div></div>)}</div><div className="inventory leverage"><span className="eyebrow">{isSpanish ? "RECURSOS Y PALANCAS" : "RESOURCES & LEVERAGE"}</span>{game.items.length ? <div className="item-grid">{game.items.map(item => <em key={item}>✦ {item}</em>)}</div> : <p>{isSpanish ? "Todavía no tenés cobertura. Cada decisión puede darte una." : "No cover yet. Every decision may give you some."}</p>}</div></aside>
      <section className="board-wrap"><div className="board"><div className="board-center"><span className="eyebrow">{game.skippedTurns > 0 ? (isSpanish ? "PRENDA PENDIENTE" : "FORFEIT PENDING") : text.current}</span><h2>{game.skippedTurns > 0 ? (isSpanish ? "Te dejaron afuera" : "You have been sidelined") : tile}</h2><p>{game.skippedTurns > 0 ? (isSpanish ? "Una mala decisión tiene costo: perdés un turno y otros ocupan el espacio." : "A bad decision has a cost: you lose a turn while others take the space.") : game.ended ? game.ended === "won" ? text.escaped : text.burnout : text.prompt}</p><div className="hint"><b>{isSpanish ? "PISTA" : "HINT"}</b>{isSpanish ? " La influencia tuerce resultados; la reputación decide quién se queda con el crédito." : " Influence bends outcomes; reputation decides who keeps the credit."}</div><button onClick={roll} disabled={rolling || !!activeEvent || !!game.ended || !locale} className={rolling ? "rolling" : ""}>{dice && !game.skippedTurns ? <strong>{dice}</strong> : null} {turnLabel}<span>⌘</span></button></div>{tiles.map((name, index) => <div className={`tile ${game.position === index ? "active" : ""} ${index === 0 ? "start" : ""}`} style={boardPositions[index]} key={`${locale}-${name}`}><small>{String(index + 1).padStart(2, "0")}</small><b>{name}</b>{game.position === index && <i className="player-token">●</i>}</div>)}</div></section>
      <aside className="feed-panel"><div className="panel-heading"><div><span className="eyebrow">{isSpanish ? "EL EQUIPO" : "THE TEAM"}</span><h2>{isSpanish ? "La escalera no es igual para todos" : "The ladder is not equal for everyone"}</h2></div><button className="reset" onClick={restart}>{text.reset}</button></div><div className="team-list">{team.map(member => <article className="mate" key={member.name}><div className={`mate-avatar ${member.tone}`}>{member.name.slice(0, 1)}</div><div><header><b>{member.name}</b><span>{member.rank}</span></header><small>{member.role} · {member.tenure}</small><div className="rank-line"><i style={{ width: `${member.rank}%` }} /></div><p>{member.note}</p><em>{isSpanish ? "Reputación" : "Reputation"} {member.reputation} · {isSpanish ? "favor" : "favor"} {member.favor}</em></div></article>)}</div><div className="timeline"><span className="eyebrow">{text.pulse}</span>{game.log.slice(0, 2).map((entry, index) => <div key={`${entry}-${index}`}><i /> <p>{entry}</p></div>)}</div><div className="survival"><span className="eyebrow">{text.odds}</span><b>{Math.max(3, Math.round((game.stats.savings + game.stats.health + game.stats.motivation) / 3))}%</b><p>{text.oddsHint}</p></div></aside>
    </section>
    {activeEvent && <div className="modal-backdrop"><article className="event-card"><div className="event-top"><span>{activeEvent.category} {text.card}</span><em className={activeEvent.rarity}>{text.rarities[activeEvent.rarity]}</em></div><h2>{activeEvent.title}</h2><p>{activeEvent.description}</p><div className="choices">{optionsFor(activeEvent).map(choice => <button key={choice.label} onClick={() => { apply(choice.changes, choice.consequence, choice); setActiveEvent(null); }}><b>{choice.label}</b><span>{choice.consequence}</span><em>{changesText(choice.changes)}{choice.skipTurns ? ` · ${isSpanish ? `Prenda: -${choice.skipTurns} turno` : `Forfeit: -${choice.skipTurns} turn`}` : ""}{choice.item ? ` · +${choice.item}` : ""}</em></button>)}</div></article></div>}
    {showBriefing && <div className="modal-backdrop language-backdrop"><article className="briefing-card"><span className="eyebrow">{isSpanish ? "TU PRIMER DÍA" : "YOUR FIRST DAY"}</span><h2>{isSpanish ? "No arrancás de cero. Arrancás último." : "You are not starting from zero. You are starting last."}</h2><p>{isSpanish ? "Sos junior en un equipo que ya tiene alianzas, historia y gente protegida. No todo ascenso es mérito; no toda mala reputación castiga." : "You are a junior in a team with alliances, history, and protected people. Not every promotion is merit; not every bad reputation is punished."}</p><div className="briefing-team">{team.slice(0, 3).map(member => <div key={member.name}><b>{member.name}</b><span>{member.role} · {member.tenure}</span><em>{isSpanish ? "rango" : "rank"} {member.rank} · {isSpanish ? "favor" : "favor"} {member.favor}</em></div>)}</div><button className="continue" onClick={closeBriefing}>{isSpanish ? "Entiendo. Empecemos." : "I understand. Let's begin."}<span>→</span></button></article></div>}
    {(!locale || showLanguagePicker) && <div className="modal-backdrop language-backdrop"><article className="language-card"><span className="eyebrow">CORPORITY</span><h2>{text.chooseTitle}</h2><p>{text.chooseDescription}</p><div className="language-options"><button onClick={() => chooseLanguage("es-AR")}><b>Español (Argentina)</b><span>ARS · home office · mates · aguante corporativo</span><em>{text.start} →</em></button><button onClick={() => chooseLanguage("en")}><b>English</b><span>Global office politics · meetings · career survival</span><em>{text.start} →</em></button></div></article></div>}
  </main>;
}
