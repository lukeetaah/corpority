"use client";

import { useEffect, useMemo, useState } from "react";
import { Changes, CorporateEvent, getGameData, Locale, Stat } from "./game-data";

type Game = { position: number; year: number; turn: number; stats: Record<Stat, number>; items: string[]; flags: string[]; log: string[]; ended?: "won" | "burnout" };
const SAVE_KEY = "corpority-save-v1";
const LANGUAGE_KEY = "corpority-language-v1";
const clamp = (value: number) => Math.max(0, Math.min(100, value));
const pick = <T,>(items: readonly T[]) => items[Math.floor(Math.random() * items.length)];

function createGame(locale: Locale): Game {
  return { position: 0, year: 1, turn: 1, stats: { salary: 38, savings: 14, health: 76, energy: 72, motivation: 68, reputation: 18, influence: 4 }, items: [], flags: [], log: [getGameData(locale).text.startLog] };
}

export default function Home() {
  const [locale, setLocale] = useState<Locale | null>(null);
  const [game, setGame] = useState<Game>(createGame("en"));
  const [activeEvent, setActiveEvent] = useState<CorporateEvent | null>(null);
  const [dice, setDice] = useState<number | null>(null);
  const [rolling, setRolling] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);

  useEffect(() => {
    const savedLanguage = localStorage.getItem(LANGUAGE_KEY);
    const savedGame = localStorage.getItem(SAVE_KEY);
    if (savedLanguage === "en" || savedLanguage === "es-AR") setLocale(savedLanguage);
    if (savedGame) { try { setGame(JSON.parse(savedGame)); } catch {} }
    setLoaded(true);
  }, []);
  useEffect(() => { if (loaded) localStorage.setItem(SAVE_KEY, JSON.stringify(game)); }, [game, loaded]);

  const data = getGameData(locale ?? "en");
  const { text, tiles, stats, events, choices } = data;
  const title = game.flags.includes("promoted") ? text.manager : text.junior;
  const tile = tiles[game.position];
  const progress = Math.min(100, Math.round((game.year / 30) * 100));
  const boardPositions = useMemo(() => tiles.map((_, i) => { const cols = 18; const rows = 12; if (i < cols) return { left: `${(i / (cols - 1)) * 100}%`, top: "0%" }; if (i < cols + rows - 1) return { left: "100%", top: `${((i - cols + 1) / (rows - 1)) * 100}%` }; if (i < cols * 2 + rows - 2) return { left: `${100 - ((i - cols - rows + 2) / (cols - 1)) * 100}%`, top: "100%" }; return { left: "0%", top: `${100 - ((i - (cols * 2 + rows - 2)) / (rows - 1)) * 100}%` }; }), [tiles]);

  function chooseLanguage(nextLocale: Locale) {
    setLocale(nextLocale);
    localStorage.setItem(LANGUAGE_KEY, nextLocale);
    setShowLanguagePicker(false);
  }
  function changesText(changes: Changes) { return Object.entries(changes).map(([key, value]) => `${value! > 0 ? "+" : ""}${value} ${stats[key as Stat].label}`).join(" · "); }
  function apply(changes: Changes, message: string, tag?: string) {
    setGame(current => {
      const nextStats = { ...current.stats };
      for (const [key, value] of Object.entries(changes)) nextStats[key as Stat] = clamp(nextStats[key as Stat] + value!);
      const flags = tag && !current.flags.includes(tag) ? [...current.flags, tag] : current.flags;
      const ended = nextStats.health === 0 ? "burnout" : current.year >= 30 && nextStats.savings >= 55 && nextStats.health >= 35 ? "won" : undefined;
      return { ...current, stats: nextStats, flags, ended, log: [message, ...current.log].slice(0, 5) };
    });
  }
  function resolveEvent(event: CorporateEvent) { apply(event.changes, `${event.title}: ${changesText(event.changes) || text.neutral}`); setActiveEvent(null); }
  function roll() {
    if (rolling || activeEvent || game.ended || !locale) return;
    setRolling(true); const result = Math.ceil(Math.random() * 6); setDice(null);
    window.setTimeout(() => {
      setDice(result); setRolling(false);
      const newPosition = (game.position + result) % tiles.length;
      const crossedYear = newPosition < game.position;
      const landed = tiles[newPosition];
      setGame(current => ({ ...current, position: newPosition, year: current.year + (crossedYear ? 1 : 0), turn: current.turn + 1, stats: { ...current.stats, savings: clamp(current.stats.savings + (crossedYear ? 5 : 0)), salary: clamp(current.stats.salary + (crossedYear ? 2 : 0)) }, log: [crossedYear ? text.passedYear : `${text.landed} ${landed}.`, ...current.log].slice(0, 5) }));
      const designed = choices[landed];
      const event = designed ? { ...designed, id: `choice-${locale}-${landed}`, rarity: "uncommon" as const } : pick(events);
      window.setTimeout(() => setActiveEvent(event), 450);
    }, 520);
  }
  function restart() { if (!locale) return; localStorage.removeItem(SAVE_KEY); setGame(createGame(locale)); setActiveEvent(null); setDice(null); }
  if (!loaded) return <main className="loading">Loading Corpority…</main>;

  return <main className="shell">
    <header><div className="brand"><span className="brand-mark">C</span><div><h1>Corpority</h1><p>{text.subtitle}</p></div></div><div className="top-status"><button className="language-button" onClick={() => setShowLanguagePicker(true)}>{locale === "es-AR" ? "ES-AR" : "EN"}</button><span>{text.year} <b>{game.year}</b> / 30</span><div className="progress"><i style={{ width: `${progress}%` }} /></div><span className="job-title">{title}</span></div></header>
    <section className="game-layout">
      <aside className="profile-panel"><div className="employee"><div className="avatar">{game.flags.includes("promoted") ? "MM" : "JE"}</div><div><span>{text.employee} #{String(game.turn).padStart(4, "0")}</span><h2>{title}</h2><small>{game.ended ? game.ended === "won" ? text.retired : text.leave : text.employed}</small></div></div><div className="stats">{(Object.keys(stats) as Stat[]).map(key => <div className="stat" key={key}><div><span className={`stat-icon ${stats[key].tone}`}>{stats[key].icon}</span>{stats[key].label}<b>{game.stats[key]}</b></div><div className="meter"><i style={{ width: `${game.stats[key]}%` }} /></div></div>)}</div><div className="inventory"><span className="eyebrow">{text.kit}</span>{game.items.length ? game.items.map(item => <em key={item}>{item}</em>) : <p>{text.emptyKit}</p>}</div></aside>
      <section className="board-wrap"><div className="board"><div className="board-center"><span className="eyebrow">{text.current}</span><h2>{tile}</h2><p>{game.ended ? game.ended === "won" ? text.escaped : text.burnout : text.prompt}</p><button onClick={roll} disabled={rolling || !!activeEvent || !!game.ended || !locale} className={rolling ? "rolling" : ""}>{dice ? <><strong>{dice}</strong> {text.nextTurn}</> : rolling ? text.rolling : text.roll}<span>⌘</span></button></div>{tiles.map((name, index) => <div className={`tile ${game.position === index ? "active" : ""} ${index === 0 ? "start" : ""}`} style={boardPositions[index]} key={`${locale}-${name}`}><small>{String(index + 1).padStart(2, "0")}</small><b>{name}</b>{game.position === index && <i className="player-token">●</i>}</div>)}</div></section>
      <aside className="feed-panel"><div className="panel-heading"><div><span className="eyebrow">{text.pulse}</span><h2>{text.consequences}</h2></div><button className="reset" onClick={restart}>{text.reset}</button></div><div className="timeline">{game.log.map((entry, index) => <div key={`${entry}-${index}`}><i /> <p>{entry}</p></div>)}</div><div className="survival"><span className="eyebrow">{text.odds}</span><b>{Math.max(3, Math.round((game.stats.savings + game.stats.health + game.stats.motivation) / 3))}%</b><p>{text.oddsHint}</p></div></aside>
    </section>
    {activeEvent && <div className="modal-backdrop"><article className="event-card"><div className="event-top"><span>{activeEvent.category} {text.card}</span><em className={activeEvent.rarity}>{text.rarities[activeEvent.rarity]}</em></div><h2>{activeEvent.title}</h2><p>{activeEvent.description}</p>{activeEvent.choices ? <div className="choices">{activeEvent.choices.map(choice => <button key={choice.label} onClick={() => { apply(choice.changes, choice.consequence, choice.tag); setActiveEvent(null); }}><b>{choice.label}</b><span>{choice.consequence}</span><em>{changesText(choice.changes)}</em></button>)}</div> : <><div className="impact">{changesText(activeEvent.changes)}</div><button className="continue" onClick={() => resolveEvent(activeEvent)}>{text.accept} <span>→</span></button></>}</article></div>}
    {(!locale || showLanguagePicker) && <div className="modal-backdrop language-backdrop"><article className="language-card"><span className="eyebrow">CORPORITY</span><h2>{text.chooseTitle}</h2><p>{text.chooseDescription}</p><div className="language-options"><button onClick={() => chooseLanguage("es-AR")}><b>Español (Argentina)</b><span>ARS · home office · mates · aguante corporativo</span><em>{text.start} →</em></button><button onClick={() => chooseLanguage("en")}><b>English</b><span>Global office politics · meetings · career survival</span><em>{text.start} →</em></button></div></article></div>}
  </main>;
}
