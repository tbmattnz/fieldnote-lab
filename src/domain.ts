export type Site = { name: string; completed: number; plan: number };
export type Period = {
  id: string;
  label: string;
  short: string;
  sourceDate: string;
  contacts: number;
  offers: number;
  accepted: number;
  appointments: number;
  completed: number;
  plan: number;
  cost: number;
  sites: Site[];
};
export type Fixture = {
  name: string;
  currency: string;
  baselineIndex: number;
  periods: Period[];
  rules: { completionGapPercent: number; costPerCompletion: number };
  scenario: {
    eligible: number;
    months: string[];
    offerRate: number;
    acceptRate: number;
    appointmentRate: number;
    completionRate: number;
    setupCost: number;
    defaultAdoption: number;
    defaultDelay: number;
    defaultUnitCost: number;
    comparisonUnitCost: number;
  };
};
export type Assumptions = { adoption: number; delay: number; unitCost: number };
export type Status = "Accepted" | "Deferred" | "Dismissed";
export type Suggestion = {
  id: string;
  period: string;
  title: string;
  rationale: string;
  rule: string;
  owner: string;
  source: string;
};
export type Decision = Suggestion & {
  status: Status;
  events: { status: Status; sequence: number }[];
};
export type MonitorState = {
  mode: "ongoing" | "historical";
  index: number;
  available: number;
  decisions: Decision[];
  sequence: number;
  site: string | null;
};
export type MonitorAction =
  | { type: "reset" }
  | { type: "arrive" }
  | { type: "mode"; mode: MonitorState["mode"] }
  | { type: "period"; index: number }
  | { type: "site"; site: string | null }
  | { type: "decide"; suggestion: Suggestion; status: Status };
export function initialMonitor(f: Fixture): MonitorState {
  return {
    mode: "ongoing",
    index: f.baselineIndex,
    available: f.baselineIndex,
    decisions: [],
    sequence: 0,
    site: null,
  };
}
export function transition(
  state: MonitorState,
  action: MonitorAction,
  f: Fixture,
): MonitorState {
  switch (action.type) {
    case "reset":
      return initialMonitor(f);
    case "arrive": {
      const available = Math.min(f.periods.length - 1, state.available + 1);
      return {
        ...state,
        available,
        index: state.mode === "ongoing" ? available : state.index,
        site: null,
      };
    }
    case "mode":
      return {
        ...state,
        mode: action.mode,
        index: action.mode === "ongoing" ? state.available : state.index,
        site: null,
      };
    case "period":
      return {
        ...state,
        mode: "historical",
        index: Math.max(0, Math.min(state.available, action.index)),
        site: null,
      };
    case "site":
      return { ...state, site: action.site };
    case "decide": {
      const old = state.decisions.find((d) => d.id === action.suggestion.id);
      if (old?.status === action.status) return state;
      const sequence = state.sequence + 1;
      const decision = {
        ...action.suggestion,
        status: action.status,
        events: [...(old?.events || []), { status: action.status, sequence }],
      };
      return {
        ...state,
        sequence,
        decisions: old
          ? state.decisions.map((d) => (d.id === decision.id ? decision : d))
          : [...state.decisions, decision],
      };
    }
  }
}
export function suggestions(p: Period, f: Fixture): Suggestion[] {
  const list: Suggestion[] = [];
  const source = `fixtures.json · ${p.id} · issued ${p.sourceDate}`;
  const gap = ((p.plan - p.completed) / p.plan) * 100;
  if (gap > f.rules.completionGapPercent)
    list.push({
      id: p.id + "-gap",
      period: p.label,
      title: "Review the completion gap",
      rationale: `${p.completed} completions against ${p.plan} planned (${gap.toFixed(1)}% below plan). Inspect the location breakdown before assigning a follow-up.`,
      rule: `Completions more than ${f.rules.completionGapPercent}% below plan`,
      owner: "Programme coordinator",
      source,
    });
  const unit = p.cost / p.completed;
  if (unit > f.rules.costPerCompletion)
    list.push({
      id: p.id + "-cost",
      period: p.label,
      title: "Check delivery cost",
      rationale: `Illustrative spend of $${p.cost.toLocaleString("en-US")} / ${p.completed} completions = $${unit.toFixed(2)} each. Review capacity and cost assumptions.`,
      rule: `Cost per completion above $${f.rules.costPerCompletion}`,
      owner: "Operations lead",
      source,
    });
  return list;
}
export function defaults(f: Fixture): Assumptions {
  return {
    adoption: f.scenario.defaultAdoption,
    delay: f.scenario.defaultDelay,
    unitCost: f.scenario.defaultUnitCost,
  };
}
function bounded(
  value: number,
  min: number,
  max: number,
  fallback: number,
): number {
  return Number.isFinite(value)
    ? Math.min(max, Math.max(min, value))
    : fallback;
}
export function project(input: Assumptions, f: Fixture) {
  const s = f.scenario;
  const adoption = bounded(input.adoption, 0, 100, s.defaultAdoption);
  const delay = Math.round(
    bounded(input.delay, 0, s.months.length - 1, s.defaultDelay),
  );
  const unitCost = bounded(input.unitCost, 25, 200, s.defaultUnitCost);
  const active = s.months.length - delay;
  const contacts = Math.floor(
    (((s.eligible * adoption) / 100) * active) / s.months.length,
  );
  const offers = Math.floor(contacts * s.offerRate);
  const accepted = Math.floor(offers * s.acceptRate);
  const appointments = Math.floor(accepted * s.appointmentRate);
  const completions = Math.floor(appointments * s.completionRate);
  const cost = s.setupCost + appointments * unitCost;
  const monthly = s.months.map((month, index) => ({
    month,
    count:
      index < delay
        ? 0
        : Math.floor(completions / active) +
          (index - delay < completions % active ? 1 : 0),
  }));
  return {
    adoption,
    delay,
    unitCost,
    contacts,
    offers,
    accepted,
    appointments,
    completions,
    cost,
    costPerCompletion: completions ? cost / completions : null,
    monthly,
  };
}
export type Projection = ReturnType<typeof project>;
