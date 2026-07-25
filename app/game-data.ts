export type Stat = "salary" | "health" | "reputation" | "energy" | "motivation" | "influence" | "savings";
export type Changes = Partial<Record<Stat, number>>;

export type Choice = { label: string; consequence: string; changes: Changes; tag?: string };
export type CorporateEvent = {
  id: string;
  title: string;
  description: string;
  category: string;
  changes: Changes;
  choices?: Choice[];
  rarity: "common" | "uncommon" | "rare" | "legendary";
};

const situations = [
  ["Calendar Ambush", "A meeting appeared in your calendar with no agenda and seventeen attendees."],
  ["Reply All Incident", "Someone has replied all to a thread that should have died in 2019."],
  ["Strategic Realignment", "Leadership has found a new name for doing the same work with fewer people."],
  ["Executive Walkthrough", "An executive is visiting. Suddenly, every desk has plants."],
  ["The New Framework", "A consultant has introduced a framework with a memorable acronym and no owner."],
  ["Coffee Machine Diplomacy", "The coffee machine is broken. Informal power structures are forming nearby."],
  ["Mandatory Fun", "You have been invited to a voluntary event whose attendance is being tracked."],
  ["Inbox Archaeology", "A request from six months ago has resurfaced, marked urgent by someone new."],
  ["Scope Creep", "A small request has grown legs, a budget, and expectations."],
  ["Synergy Workshop", "You spend three hours putting sticky notes into quadrants."],
  ["Quiet Resignation", "Your most capable teammate resigned and left a folder called 'final_final_v7'."],
  ["Budget Weather", "Finance has forecast a 4% chance of spending any money."],
  ["Password Expired", "Your password expired during a presentation. Security is delighted."],
  ["All Hands", "The company announces excellent results and asks everyone to be prudent."],
  ["Offsite Logistics", "The team building venue is two hours away and somehow mandatory."],
  ["Priority Reversal", "Yesterday's top priority is now 'nice to have'."],
  ["The Recognition Post", "A public thank-you names everyone except the people who did the work."],
  ["Procurement Odyssey", "You need approval from five departments to buy a cable."],
  ["Performance Calibration", "Managers are comparing employees to a bell curve they do not understand."],
  ["Vendor Lunch", "A vendor promises to transform your workflow after a steak lunch."],
  ["Open Office Acoustics", "A sales call, a birthday, and a crisis meeting are happening within four meters."],
  ["Reorg Rumor", "The org chart is being edited at midnight. Nobody will say why."],
  ["Innovation Sprint", "You must innovate by Friday using a template from last year."],
  ["Manager's Favorite", "A colleague has an idea identical to yours, now with executive sponsorship."],
  ["Compliance Reminder", "A compliance module is due today and takes exactly as long as your patience."],
  ["Town Hall Question", "The CEO asks for questions, then selects one about the office snacks."],
  ["Remote Work Exception", "The policy has an exception process designed to discourage exceptions."],
  ["Spreadsheet Ownership", "A critical spreadsheet has no owner, no documentation, and 14 hidden tabs."],
  ["Quarter-End Heroics", "Everything is urgent because the calendar is about to change."],
  ["New Manager Energy", "Your new manager wants to meet everyone weekly to 'build trust'."],
  ["Visibility Project", "You are offered a visible project that has already failed twice."],
  ["Office Politics", "Two leaders want mutually exclusive things by the same deadline."],
  ["Holiday Blackout", "A vacation request meets a business-critical release window."],
  ["Career Conversation", "Your manager asks where you see yourself, then checks their phone."],
  ["Corporate Wellness", "A mindfulness webinar arrives between two crisis calls."],
  ["The Escalation", "A minor issue has been escalated to people whose titles are longer than the issue."],
] as const;

const twists = [
  ["You solve it before anyone notices.", { reputation: 4, energy: -2 }],
  ["It becomes tomorrow's problem, as tradition demands.", { energy: 2, motivation: -1 }],
  ["Your manager remembers your name in a good way.", { reputation: 3, influence: 2 }],
  ["Finance notices the cost of your solution.", { savings: -2, reputation: -1 }],
  ["An executive mistakes your work for leadership.", { influence: 4, health: -2 }],
  ["The process wins. Nobody does.", { energy: -4, motivation: -3 }],
  ["A coworker quietly saves the day with you.", { motivation: 3, reputation: 2 }],
  ["A new stakeholder asks for a deck about it.", { energy: -3, influence: 1 }],
  ["It reveals an unexpectedly useful contact.", { influence: 3, savings: 2 }],
  ["You are praised in a meeting you were not invited to.", { reputation: 4, motivation: 2 }],
] as const;

export const EVENTS: CorporateEvent[] = situations.flatMap(([title, description], situationIndex) =>
  twists.map(([twist, changes], twistIndex) => ({
    id: `event-${situationIndex}-${twistIndex}`,
    title,
    description: `${description} ${twist}`,
    category: ["Reality", "Gossip", "Leadership", "Operations"][situationIndex % 4],
    changes,
    rarity: twistIndex === 9 ? "legendary" : twistIndex > 6 ? "rare" : twistIndex > 3 ? "uncommon" : "common",
  }))
);

export const TILE_NAMES = [
  "Payday", "Meeting", "Coffee Machine", "Performance Review", "Office Politics", "Training", "HR", "Budget Freeze",
  "Innovation", "Vacation", "Compliance", "Corporate Event", "Remote Work", "IT Incident", "Recognition", "Town Hall",
  "Restructuring", "Team Building", "LinkedIn Recruiter", "Micromanagement", "Payroll", "Executive Visit", "Merger", "Mandatory Fun",
  "New Manager", "Annual Review", "Random Opportunity", "Office Gossip", "Layoff Rumor", "Promotion Track", "Burnout Risk",
  "Finance", "Project Launch", "Work Anniversary", "Strategy Day", "Customer Escalation", "Recruiting", "Return to Office",
  "Benefits Portal", "Quarter Close", "Mentor Moment", "Desk Move", "Leadership Offsite", "Security Training", "Career Ladder",
  "Office Snacks", "Vendor Demo", "Shadow IT", "Budget Committee", "All Hands", "Performance Plan", "Side Project",
  "Holiday Party", "Company Values", "Emergency Release", "Union Chat", "Exit Interview", "Retirement"
];

export const STAT_META: Record<Stat, { label: string; icon: string; tone: string }> = {
  salary: { label: "Salary", icon: "$", tone: "blue" },
  savings: { label: "Savings", icon: "◈", tone: "green" },
  health: { label: "Mental health", icon: "♥", tone: "pink" },
  energy: { label: "Energy", icon: "ϟ", tone: "orange" },
  motivation: { label: "Motivation", icon: "✦", tone: "yellow" },
  reputation: { label: "Reputation", icon: "◎", tone: "violet" },
  influence: { label: "Influence", icon: "♜", tone: "cyan" },
};
