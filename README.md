# Fieldnote — two interactive portfolio demonstrations

Original work by Matt Abraham. **Synthetic data, illustrative outcomes and USD amounts only.** No real participants, private product source, live integrations or model calls.

- `/#monitor` — Service Operations Monitor: period selection, controlled sample-file arrival, plan/actual trend, location drilldown, threshold explanations and a decision history.
- `/#planner` — Programme Scenario Planner: reach, delay and appointment cost; recalculated funnel and timing; saved comparisons; a guided journey.

Both views share `src/fixtures.json`, which is also copied to `public/fixtures.json` for inspection. State lives in the current tab's React state. Switching views preserves it; **Reset both demos** clears imports, decisions, assumptions, saved scenarios and journey selection. Reloading also restores the baseline.

## Run and build

Node 22.18 or later. Dependencies are pinned in `package.json`. This preview reused existing installed packages; no dependency installation was performed.

```sh
npm run build
npm start
```

Open `http://127.0.0.1:4321/#monitor` or `http://127.0.0.1:4321/#planner`. Set `PORT` to change the loopback server port. After a build, `public/` is a self-contained static site and does not need a backend. The hash routes work under a GitHub Pages project path or another static host. Keep the four built files, fixture and React licence notices together.

```sh
npm test
```

## Calculation model

The six-month scenario starts with 1,200 eligible synthetic participants. Contacted = floor(eligible × reach × active months / 6). Each successive funnel stage is rounded down: 80% offered, 68% accepted, 85% booked, 78% completed. Total cost = $2,400 setup + booked appointments × unit cost. Cost per completion is absent when completions are zero. Completions are spread evenly over active months, with the remainder allocated one at a time to early active months.

The comparison case is 65% reach, no delay and $100 per appointment. It is an illustrative reference, not a measured control group. Fixed conversion rates and even timing are deliberately simple assumptions, not validated effectiveness, cost savings or a forecast.

Monitor location totals reconcile to each month's aggregate totals. Signals are triggered by completions more than 5% below plan and cost per completion above $110. Those are demonstration thresholds, not clinical or operational recommendations. Accepting records a visitor decision with a sample owner role; it does not execute an intervention. September is the one controlled new file arrival.

## Structure

- `src/domain.ts`: typed, pure calculations and monitor transitions.
- `src/Monitor.tsx`: historical/ongoing review workspace.
- `src/Planner.tsx`: assumptions, outputs, saved comparisons and journey.
- `src/ui.tsx`: small shared chart and presentation components.
- `src/app.tsx`: navigation and session state/reset.
- `test/domain.test.mjs`: independently checked outputs and invariants.

For a real deployment: add agreed business rules, authenticated access, durable audit events, actual source ingestion and evaluated outcome assumptions as required. This sample intentionally does not implement them.

## Live demonstrations

- [Service Operations Monitor](https://tbmattnz.github.io/fieldnote-lab/#monitor)
- [Programme Scenario Planner](https://tbmattnz.github.io/fieldnote-lab/#planner)
- [Inspect the source](https://github.com/tbmattnz/fieldnote-lab)

These are two complementary views in one original portfolio project, not two prior client engagements. The site is built from this repository's `public/` directory and published to GitHub Pages from the `gh-pages` branch. There is no paid service or API dependency.
