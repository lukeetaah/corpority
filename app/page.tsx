"use client";

import { useEffect, useMemo, useState } from "react";
import { Changes, CorporateEvent, EVENTS, STAT_META, TILE_NAMES, Stat } from "./game-data";

type Game = { position: number; year: number; turn: number; title: string; stats: Record<Stat, number>; items: string[]; flags: string[]; log: string[]; ended?: "won" | "burnout" };
const START: Game = { position: 0, year: 1, turn: 1, title: "Junior Employee", stats: { salary: 38, savings: 14, health: 76, energy: 72, motivation: 68, reputation: 18, influence: 4 }, items: [], flags: [], log: ["Day one. Your laptop is already installing updates."] };
const SAVE_KEY = "corpority-save-v1";
const clamp = (value: number) => Math.max(0, Math.min(100, value));
const pick = <T,>(items: readonly T[]) => items[Math.floor(Math.random() * items.length)];
const choiceEvents: Record<string, Omit<CorporateEvent, "id" | "rarity">> = {
  "Mandatory Fun": { title: "Mandatory fun, allegedly", category: "Culture", description: "Your manager asks whether you can stay until 10 PM for a culture-building event.", changes: {}, choices: [
    { label: "Accept with a smile", consequence: "You learned three colleagues' karaoke choices.", changes: { reputation: 3, health: -5, energy: -7 } },
    { label: "Decline politely", consequence: "Your boundary has been observed and archived.", changes: { health: 3, motivation: 2, reputation: -2 } },
    { label: "Invent a compelling excuse", consequence: "The excuse holds. Your conscience does not.", changes: { energy: 3, reputation: -1, influence: 1 } },
  ] },
  "Promotion Track": { title: "A chair with more meetings", category: "Career", description: "Your manager offers you a promotion. The title is longer; the calendar is fuller.", changes: {}, choices: [
    { label: "Take the promotion", consequence: "Congratulations. The expectations are now abstract and infinite.", changes: { salary: 12, influence: 8, health: -9, energy: -6 }, tag: "promoted" },
    { label: "Stay hands-on", consequence: "You retain your evenings and gain a mysterious reputation for balance.", changes: { health: 4, motivation: 3, reputation: 1 } },
  ] },
  "Vacation": { title: "Vacation request", category: "Balance", description: "A holiday is possible, but the team is in a very important phase. Again.", changes: {}, choices: [
    { label: "Book it", consequence: "The out-of-office message feels almost revolutionary.", changes: { health: 12, energy: 14, motivation: 7, reputation: -2 } },
    { label: "Postpone it", consequence: "The business appreciates your sacrifice for roughly four seconds.", changes: { reputation: 4, health: -7, energy: -5 } },
  ] },
};

function changesText(changes: Changes) { return Object.entries(changes).map(([key, value]) => `${value! > 0 ? "+" : ""}${value} ${STAT_META[key as Stat].label}`).join(" · "); }

export default function Home() {
  const [game, setGame] = useState<Game>(START);
  const [activeEvent, setActiveEvent] = useState<CorporateEvent | null>(null);
  const [dice, setDice] = useState<number | null>(null);
  const [rolling, setRolling] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => { const saved = localStorage.getItem(SAVE_KEY); if (saved) { try { setGame(JSON.parse(saved)); } catch {} } setLoaded(true); }, []);
  useEffect(() => { if (loaded) localStorage.setItem(SAVE_KEY, JSON.stringify(game)); }, [game, loaded]);
  const tile = TILE_NAMES[game.position];
  const progress = Math.min(100, Math.round((game.year / 30) * 100));
  const boardPositions = useMemo(() => TILE_NAMES.map((_, i) => { const cols = 18, rows = 12, edge = 2; if (i < cols) return { left: `${(i / (cols - 1)) * 100}%`, top: "0%" }; if (i < cols + rows - 1) return { left: "100%", top: `${((i - cols + 1) / (rows - 1)) * 100}%` }; if (i < cols * 2 + rows - 2) return { left: `${100 - ((i - cols - rows + 2) / (cols - 1)) * 100}%`, top: "100%" }; return { left: "0%", top: `${100 - ((i - (cols * 2 + rows - 2)) / (rows - 1)) * 100}%` }; }), []);

  function apply(changes: Changes, message: string, tag?: string) {
    setGame(current => {
      const stats = { ...current.stats };
      for (const [key, value] of Object.entries(changes)) stats[key as Stat] = clamp(stats[key as Stat] + value!);
      const flags = tag && !current.flags.includes(tag) ? [...current.flags, tag] : current.flags;
      const title = flags.includes("promoted") ? "Middle Manager" : current.title;
      const ended = stats.health === 0 ? "burnout" : current.year >= 30 && stats.savings >= 55 && stats.health >= 35 ? "won" : undefined;
      return { ...current, stats, flags, title, ended, log: [message, ...current.log].slice(0, 5) };
    });
  }
  function resolveEvent(event: CorporateEvent) { apply(event.changes, `${event.title}: ${changesText(event.changes) || "a suspiciously neutral outcome"}`); setActiveEvent(null); }
  function roll() {
    if (rolling || activeEvent || game.ended) return;
    setRolling(true); const result = Math.ceil(Math.random() * 6); setDice(null);
    window.setTimeout(() => { setDice(result); setRolling(false); const newPosition = (game.position + result) % TILE_NAMES.length; const crossedYear = newPosition < game.position; const landed = TILE_NAMES[newPosition];
      setGame(current => ({ ...current, position: newPosition, year: current.year + (crossedYear ? 1 : 0), turn: current.turn + 1, stats: { ...current.stats, savings: clamp(current.stats.savings + (crossedYear ? 5 : 0)), salary: clamp(current.stats.salary + (crossedYear ? 2 : 0)) }, log: [crossedYear ? "A year passed. Payroll continues to recognize your existence." : `You landed on ${landed}.`, ...current.log].slice(0, 5) }));
      const designed = choiceEvents[landed]; const event = designed ? { ...designed, id: `choice-${landed}`, rarity: "uncommon" as const } : pick(EVENTS);
      window.setTimeout(() => setActiveEvent(event), 450);
    }, 520);
  }
  function restart() { localStorage.removeItem(SAVE_KEY); setGame(START); setActiveEvent(null); setDice(null); }
  if (!loaded) return <main className="loading">Loading your corporate identity…</main>;
  return <main className="shell">
    <header><div className="brand"><span className="brand-mark">C</span><div><h1>Corpority</h1><p>Career survival simulator</p></div></div><div className="top-status"><span>YEAR <b>{game.year}</b> / 30</span><div className="progress"><i style={{ width: `${progress}%` }} /></div><span className="job-title">{game.title}</span></div></header>
    <section className="game-layout">
      <aside className="profile-panel"><div className="employee"><div className="avatar">{game.title === "Junior Employee" ? "JE" : "MM"}</div><div><span>EMPLOYEE #{String(game.turn).padStart(4, "0")}</span><h2>{game.title}</h2><small>{game.ended ? game.ended === "won" ? "Retirement unlocked" : "On medical leave" : "Still employed, technically"}</small></div></div><div className="stats">{(Object.keys(STAT_META) as Stat[]).map(key => <div className="stat" key={key}><div><span className={`stat-icon ${STAT_META[key].tone}`}>{STAT_META[key].icon}</span>{STAT_META[key].label}<b>{game.stats[key]}</b></div><div className="meter"><i style={{ width: `${game.stats[key]}%` }} /></div></div>)}</div><div className="inventory"><span className="eyebrow">OFFICE SURVIVAL KIT</span>{game.items.length ? game.items.map(item => <em key={item}>{item}</em>) : <p>No ergonomic chair. No mentor. Just vibes.</p>}</div></aside>
      <section className="board-wrap"><div className="board"><div className="board-center"><span className="eyebrow">CURRENT SITUATION</span><h2>{tile}</h2><p>{game.ended ? game.ended === "won" ? "You escaped with enough savings and sanity. The farewell cake is dry but sincere." : "Your wellness webinar has been scheduled for after you recover." : "Roll deliberately. The spreadsheet has a memory."}</p><button onClick={roll} disabled={rolling || !!activeEvent || !!game.ended} className={rolling ? "rolling" : ""}>{dice ? <><strong>{dice}</strong> Next turn</> : rolling ? "Rolling…" : "Roll the die"}<span>⌘</span></button></div>{TILE_NAMES.map((name, index) => <div className={`tile ${game.position === index ? "active" : ""} ${index === 0 ? "start" : ""}`} style={boardPositions[index]} key={name}><small>{String(index + 1).padStart(2, "0")}</small><b>{name}</b>{game.position === index && <i className="player-token">●</i>}</div>)}</div></section>
      <aside className="feed-panel"><div className="panel-heading"><div><span className="eyebrow">CORPORATE PULSE</span><h2>Live consequences</h2></div><button className="reset" onClick={restart}>Reset</button></div><div className="timeline">{game.log.map((entry, index) => <div key={`${entry}-${index}`}><i /> <p>{entry}</p></div>)}</div><div className="survival"><span className="eyebrow">RETIREMENT ODDS</span><b>{Math.max(3, Math.round((game.stats.savings + game.stats.health + game.stats.motivation) / 3))}%</b><p>Maintain health and save enough to leave on your terms.</p></div></aside>
    </section>
    {activeEvent && <div className="modal-backdrop"><article className="event-card"><div className="event-top"><span>{activeEvent.category} CARD</span><em className={activeEvent.rarity}>{activeEvent.rarity}</em></div><h2>{activeEvent.title}</h2><p>{activeEvent.description}</p>{activeEvent.choices ? <div className="choices">{activeEvent.choices.map(choice => <button key={choice.label} onClick={() => { apply(choice.changes, choice.consequence, choice.tag); setActiveEvent(null); }}><b>{choice.label}</b><span>{choice.consequence}</span><em>{changesText(choice.changes)}</em></button>)}</div> : <><div className="impact">{changesText(activeEvent.changes)}</div><button className="continue" onClick={() => resolveEvent(activeEvent)}>Accept your fate <span>→</span></button></>}</article></div>}
  </main>;
}
