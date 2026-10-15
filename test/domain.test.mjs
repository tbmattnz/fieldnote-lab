import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  defaults,
  initialMonitor,
  project,
  suggestions,
  transition,
} from "../src/domain.ts";
const f = JSON.parse(
  await readFile(new URL("../src/fixtures.json", import.meta.url), "utf8"),
);

test("every period reconciles location totals, plan totals and funnel counts", () => {
  for (const p of f.periods) {
    assert.equal(
      p.sites.reduce((n, s) => n + s.completed, 0),
      p.completed,
    );
    assert.equal(
      p.sites.reduce((n, s) => n + s.plan, 0),
      p.plan,
    );
    const counts = [
      p.contacts,
      p.offers,
      p.accepted,
      p.appointments,
      p.completed,
    ];
    assert.ok(counts.every((n, i) => i === 0 || n <= counts[i - 1]));
  }
});
test("known scenario gives independently checked counts and cost", () => {
  const p = project(defaults(f), f);
  assert.deepEqual(
    [p.contacts, p.offers, p.accepted, p.appointments, p.completions],
    [780, 624, 424, 360, 280],
  );
  assert.equal(p.cost, 33000);
  assert.equal(p.costPerCompletion, 33000 / 280);
});
test("a delayed rollout reduces reach and has no completions before start", () => {
  const p = project({ adoption: 45, delay: 1, unitCost: 85 }, f);
  assert.equal(p.contacts, 450);
  assert.equal(p.completions, 161);
  assert.equal(p.cost, 19995);
  assert.equal(p.monthly[0].count, 0);
  assert.equal(
    p.monthly.reduce((n, m) => n + m.count, 0),
    161,
  );
});
test("all permitted assumptions preserve funnel and schedule invariants", () => {
  for (let adoption = 0; adoption <= 100; adoption += 5)
    for (let delay = 0; delay < 6; delay++) {
      const p = project({ adoption, delay, unitCost: 125 }, f);
      const counts = [
        p.contacts,
        p.offers,
        p.accepted,
        p.appointments,
        p.completions,
      ];
      assert.ok(
        counts.every(
          (n, i) =>
            Number.isInteger(n) && n >= 0 && (i === 0 || n <= counts[i - 1]),
        ),
      );
      assert.equal(
        p.monthly.reduce((n, m) => n + m.count, 0),
        p.completions,
      );
      assert.ok(p.monthly.slice(0, delay).every((m) => m.count === 0));
    }
});
test("zero participation has setup cost and no invented unit outcome", () => {
  const p = project({ adoption: 0, delay: 5, unitCost: 200 }, f);
  assert.equal(p.cost, 2400);
  assert.equal(p.completions, 0);
  assert.equal(p.costPerCompletion, null);
});
test("invalid or extreme inputs stay within documented limits", () => {
  const p = project({ adoption: Infinity, delay: -8, unitCost: 0 }, f);
  assert.equal(p.adoption, 65);
  assert.equal(p.delay, 0);
  assert.equal(p.unitCost, 25);
  const q = project({ adoption: 300, delay: 300, unitCost: NaN }, f);
  assert.equal(q.adoption, 100);
  assert.equal(q.delay, 5);
  assert.equal(q.unitCost, 85);
});
test("review thresholds use the selected period and retain its source", () => {
  assert.equal(suggestions(f.periods[0], f).length, 0);
  const reviews = suggestions(f.periods[4], f);
  assert.equal(reviews.length, 2);
  assert.ok(
    reviews.every(
      (r) => r.source.includes("2026-08") && r.source.includes("2026-09-02"),
    ),
  );
});
test("arrival advances ongoing monitoring once and cannot invent another file", () => {
  let s = transition(initialMonitor(f), { type: "arrive" }, f);
  assert.equal(s.available, 5);
  assert.equal(s.index, 5);
  s = transition(s, { type: "arrive" }, f);
  assert.equal(s.available, 5);
  assert.equal(s.index, 5);
});
test("arrival preserves a historical selection; ongoing mode selects latest", () => {
  let s = transition(initialMonitor(f), { type: "period", index: 1 }, f);
  s = transition(s, { type: "arrive" }, f);
  assert.equal(s.index, 1);
  assert.equal(s.mode, "historical");
  s = transition(s, { type: "mode", mode: "ongoing" }, f);
  assert.equal(s.index, 5);
});
test("decision status changes retain history without duplicate identical events", () => {
  const suggestion = suggestions(f.periods[4], f)[0];
  let s = transition(
    initialMonitor(f),
    { type: "decide", suggestion, status: "Deferred" },
    f,
  );
  s = transition(s, { type: "decide", suggestion, status: "Accepted" }, f);
  const unchanged = transition(
    s,
    { type: "decide", suggestion, status: "Accepted" },
    f,
  );
  assert.equal(unchanged, s);
  assert.equal(s.decisions.length, 1);
  assert.deepEqual(s.decisions[0].events, [
    { status: "Deferred", sequence: 1 },
    { status: "Accepted", sequence: 2 },
  ]);
  assert.equal(s.decisions[0].owner, suggestion.owner);
  assert.equal(s.decisions[0].source, suggestion.source);
});
test("monitor reset clears imports, history, drilldown and historical selection", () => {
  let s = transition(initialMonitor(f), { type: "arrive" }, f);
  s = transition(s, { type: "site", site: "Harbour" }, f);
  s = transition(
    s,
    {
      type: "decide",
      suggestion: suggestions(f.periods[5], f)[0],
      status: "Dismissed",
    },
    f,
  );
  assert.deepEqual(transition(s, { type: "reset" }, f), initialMonitor(f));
});
