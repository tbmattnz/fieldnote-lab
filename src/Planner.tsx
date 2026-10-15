import type { Dispatch, SetStateAction } from "react";
import type { Assumptions, Fixture, Projection } from "./domain";
import { defaults, project } from "./domain";
import { Funnel, money, number, Panel, PageHeading, Stat } from "./ui";
export type SavedScenario = {
  id: number;
  name: string;
  projection: Projection;
};
export function Planner({
  fixture,
  assumptions,
  setAssumptions,
  saved,
  setSaved,
  stage,
  setStage,
}: {
  fixture: Fixture;
  assumptions: Assumptions;
  setAssumptions: Dispatch<SetStateAction<Assumptions>>;
  saved: SavedScenario[];
  setSaved: Dispatch<SetStateAction<SavedScenario[]>>;
  stage: number;
  setStage: Dispatch<SetStateAction<number>>;
}) {
  const p = project(assumptions, fixture);
  const baseline = project(
    { ...defaults(fixture), unitCost: fixture.scenario.comparisonUnitCost },
    fixture,
  );
  const change = p.cost - baseline.cost;
  return (
    <>
      <PageHeading
        eyebrow="02 / PROGRAMME SCENARIO PLANNER"
        intro="Move the assumptions. Follow the numbers. Compare the trade-offs."
        issue={{
          label: "ILLUSTRATIVE ONLY",
          title: "6-month horizon",
          note: "Nov 2026 — Apr 2027",
          amber: true,
        }}
      >
        <>
          What changes
          <br />
          <em>when you change the plan?</em>
        </>
      </PageHeading>
      <div className="planner-grid">
        <AssumptionControls
          fixture={fixture}
          assumptions={assumptions}
          setAssumptions={setAssumptions}
          saved={saved}
          setSaved={setSaved}
          p={p}
        />
        <div className="scenario-results">
          <div className="stats planner-stats">
            <Stat
              label="Illustrative completions"
              value={number(p.completions)}
              note={`${p.completions - baseline.completions >= 0 ? "+" : ""}${p.completions - baseline.completions} vs comparison case`}
              tone="blue"
            />
            <Stat
              label="Total delivery cost"
              value={money(p.cost)}
              note={`${money(Math.abs(change))} ${change <= 0 ? "lower" : "higher"} than comparison`}
            />
            <Stat
              label="Cost per completion"
              value={
                p.costPerCompletion === null ? "—" : money(p.costPerCompletion)
              }
              note={
                p.costPerCompletion === null
                  ? "No completions in this scenario"
                  : "(Setup + booked × unit cost) / completed"
              }
            />
          </div>
          <Panel
            title="From first contact to completion"
            eyebrow="SIMULATED ENGAGEMENT FUNNEL"
            action={<span className="badge">LIVE CALCULATION</span>}
          >
            <Funnel projection={p} />
            <div className="scenario-caveat">
              Illustrative counts, not guaranteed results. Rates are fixed;
              changing reach does not imply a proven change in service outcomes.
            </div>
          </Panel>
          <Panel
            title="Timing changes the opportunity"
            eyebrow="ILLUSTRATIVE COMPLETION SCHEDULE"
          >
            <div
              className="monthly-chart"
              role="img"
              aria-label={p.monthly
                .map((m) => `${m.month}: ${m.count} completions`)
                .join(", ")}
            >
              {p.monthly.map((m) => (
                <div className="month-column" key={m.month}>
                  <strong>{m.count}</strong>
                  <div className="month-track">
                    <span
                      style={{
                        height: `${(m.count / Math.max(1, ...p.monthly.map((x) => x.count))) * 100}%`,
                      }}
                    />
                  </div>
                  <span>{m.month}</span>
                </div>
              ))}
            </div>
            <p className="panel-foot">
              Completions split evenly across active months. Delay months
              contribute zero. This is a simplified allocation, not a forecast.
            </p>
          </Panel>
        </div>
      </div>
      <Panel
        title="Keep the trade-offs in view."
        eyebrow="SAVED SCENARIO COMPARISON"
        action={<span className="badge">{saved.length} / 4 SAVED</span>}
      >
        <p className="comparison-note">
          Comparison case: 65% reach, no delay, $100 per appointment.{" "}
          {baseline.completions} completions · {money(baseline.cost)} total. It
          is an illustrative reference, not a measured control group.
        </p>
        {saved.length ? (
          <div className="table-scroll">
            <table className="comparison-table">
              <caption className="sr-only">
                Saved scenario assumptions and calculated outcomes
              </caption>
              <thead>
                <tr>
                  <th scope="col">Scenario</th>
                  <th scope="col">Reach</th>
                  <th scope="col">Delay</th>
                  <th scope="col">Unit cost</th>
                  <th scope="col">Completed</th>
                  <th scope="col">Total cost</th>
                  <th scope="col">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {saved.map((s) => (
                  <tr key={s.id}>
                    <th scope="row">{s.name}</th>
                    <td>{s.projection.adoption}%</td>
                    <td>{s.projection.delay} mo</td>
                    <td>{money(s.projection.unitCost)}</td>
                    <td>{s.projection.completions}</td>
                    <td>{money(s.projection.cost)}</td>
                    <td>
                      <button
                        className="text-button"
                        aria-label={`Remove ${s.name}`}
                        onClick={() =>
                          setSaved((items) =>
                            items.filter((x) => x.id !== s.id),
                          )
                        }
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty horizontal">
            <span className="empty-mark" aria-hidden="true">
              ↳
            </span>
            <div>
              <h3>A useful comparison starts with two possibilities.</h3>
              <p>
                Save this scenario, change an assumption and save another. Each
                saved row keeps its original values.
              </p>
            </div>
          </div>
        )}
      </Panel>
      <PlanningJourney
        fixture={fixture}
        p={p}
        saved={saved}
        stage={stage}
        setStage={setStage}
      />
    </>
  );
}

function AssumptionControls({
  fixture,
  assumptions,
  setAssumptions,
  saved,
  setSaved,
  p,
}: {
  fixture: Fixture;
  assumptions: Assumptions;
  setAssumptions: Dispatch<SetStateAction<Assumptions>>;
  saved: SavedScenario[];
  setSaved: Dispatch<SetStateAction<SavedScenario[]>>;
  p: Projection;
}) {
  const settings = [
    {
      key: "adoption" as const,
      label: "Programme reach",
      suffix: "%",
      min: 0,
      max: 100,
      step: 5,
      help: "Share of the eligible cohort contacted at full duration.",
    },
    {
      key: "delay" as const,
      label: "Start delay",
      suffix: assumptions.delay === 1 ? " month" : " months",
      min: 0,
      max: 5,
      step: 1,
      help: "A later start reduces reach inside this six-month window.",
    },
    {
      key: "unitCost" as const,
      label: "Cost per appointment",
      suffix: " USD",
      min: 25,
      max: 200,
      step: 5,
      help: "Applied to booked appointments, plus a $2,400 setup cost.",
    },
  ];
  return (
    <Panel
      title="Set the conditions"
      eyebrow="YOUR ASSUMPTIONS"
      className="controls-panel"
    >
      <div className="presets" aria-label="Scenario presets">
        <button
          onClick={() =>
            setAssumptions({ adoption: 45, delay: 1, unitCost: 85 })
          }
        >
          Measured rollout
        </button>
        <button
          onClick={() =>
            setAssumptions({ adoption: 85, delay: 0, unitCost: 85 })
          }
        >
          Wider reach
        </button>
      </div>
      {settings.map((s) => (
        <div className="control" key={s.key}>
          <label htmlFor={s.key}>
            {s.label}
            <output htmlFor={s.key}>
              {assumptions[s.key]}
              <small>{s.suffix}</small>
            </output>
          </label>
          <input
            id={s.key}
            type="range"
            min={s.min}
            max={s.max}
            step={s.step}
            value={assumptions[s.key]}
            aria-describedby={s.key + "-help"}
            onChange={(e) =>
              setAssumptions((a) => ({
                ...a,
                [s.key]: Number(e.target.value),
              }))
            }
          />
          <p id={s.key + "-help"}>{s.help}</p>
        </div>
      ))}
      <div className="cohort">
        <span>Eligible cohort</span>
        <strong>{number(fixture.scenario.eligible)}</strong>
        <small>Synthetic participants · fixed input</small>
      </div>
      <button
        className="button primary full"
        disabled={saved.length >= 4}
        onClick={() =>
          setSaved((items) => [
            ...items,
            {
              id: (items.at(-1)?.id || 0) + 1,
              name: `Scenario ${(items.at(-1)?.id || 0) + 1}`,
              projection: p,
            },
          ])
        }
      >
        {saved.length >= 4
          ? "Four comparison slots saved"
          : "Save scenario for comparison"}{" "}
        <span aria-hidden="true">↓</span>
      </button>
      <p className="small-text muted">
        Save up to four scenarios. Remove one to make space.
      </p>
    </Panel>
  );
}

function PlanningJourney({
  fixture,
  p,
  saved,
  stage,
  setStage,
}: {
  fixture: Fixture;
  p: Projection;
  saved: SavedScenario[];
  stage: number;
  setStage: Dispatch<SetStateAction<number>>;
}) {
  const journeys = [
    {
      title: "Intake",
      label: "Start with a defined cohort.",
      body: `The synthetic planning file contains ${number(fixture.scenario.eligible)} eligible participants. It includes fixed conversion rates and a six-month horizon. No personal records are used.`,
      metric: `${number(fixture.scenario.eligible)} eligible`,
    },
    {
      title: "Monitoring",
      label: "Make assumptions visible.",
      body: `Reach is ${p.adoption}%, with a ${p.delay}-month delay. Contact volume is scaled by the active months remaining. These assumptions describe a scenario, not a forecast.`,
      metric: `${6 - p.delay} active months`,
    },
    {
      title: "Decision",
      label: "Compare before committing.",
      body: `This scenario produces ${number(p.completions)} illustrative completions at ${money(p.cost)} total cost. Save it to compare alternatives. Saving does not approve a real programme.`,
      metric: `${money(p.cost)} total`,
    },
    {
      title: "Routing",
      label: "Follow the simulated funnel.",
      body: `${number(p.accepted)} acceptances lead to ${number(p.appointments)} appointments using the fixed booking rate. All stages are rounded down so each count stays within the preceding stage.`,
      metric: `${number(p.appointments)} booked`,
    },
    {
      title: "Evidence",
      label: "Keep the calculation traceable.",
      body: "Contacts × 80% offers × 68% acceptance × 85% booking × 78% completion, rounding down at each stage. Cost = $2,400 setup + booked appointments × unit cost.",
      metric: "One synthetic fixture",
    },
    {
      title: "Reporting",
      label: "Share a clear comparison.",
      body: "The scenario table records the exact assumptions and calculated outcomes when you save. The schedule distributes completions evenly over active months; it is not a time-to-completion model.",
      metric: `${saved.length} saved scenarios`,
    },
  ];
  return (
    <Panel
      title="Every number has a next step."
      eyebrow="EXPLORE THE END-TO-END JOURNEY"
    >
      <div className="journey" aria-label="Explore workflow stages">
        {journeys.map((j, i) => (
          <button
            key={j.title}
            aria-pressed={stage === i}
            onClick={() => setStage(i)}
          >
            <small>0{i + 1}</small>
            <span>{j.title}</span>
            <span aria-hidden="true">↗</span>
          </button>
        ))}
      </div>
      <div className="journey-detail">
        <div>
          <p className="eyebrow">
            0{stage + 1} / {journeys[stage].title.toUpperCase()}
          </p>
          <h3>{journeys[stage].label}</h3>
          <p>{journeys[stage].body}</p>
        </div>
        <strong>{journeys[stage].metric}</strong>
      </div>
    </Panel>
  );
}
