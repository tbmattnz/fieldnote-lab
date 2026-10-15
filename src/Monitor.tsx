import type { Dispatch } from "react";
import type {
  Fixture,
  MonitorAction,
  MonitorState,
  Status,
  Suggestion,
  Period,
} from "./domain";
import { suggestions } from "./domain";
import { Icon, money, number, Panel, PageHeading, Stat, Trend } from "./ui";
export function Monitor({
  fixture,
  state,
  dispatch,
}: {
  fixture: Fixture;
  state: MonitorState;
  dispatch: Dispatch<MonitorAction>;
}) {
  const p = fixture.periods[state.index];
  const prior = fixture.periods[state.index - 1];
  const gap = p.completed - p.plan;
  const reviews = suggestions(p, fixture);
  const latest = state.available === fixture.periods.length - 1;
  return (
    <>
      <PageHeading
        eyebrow="01 / SERVICE OPERATIONS MONITOR"
        intro="A clear view of delivery, exceptions and the decisions that follow."
        issue={{
          label: "SAMPLE WORKSPACE",
          title: `${p.label} 2026`,
          note: "Community skills programme",
        }}
      >
        <>
          See the signal.
          <br />
          <em>Make the next move.</em>
        </>
      </PageHeading>
      <div className="monitor-toolbar">
        <div className="segmented" aria-label="Monitoring mode">
          <button
            aria-pressed={state.mode === "ongoing"}
            onClick={() => dispatch({ type: "mode", mode: "ongoing" })}
          >
            Ongoing monitoring
          </button>
          <button
            aria-pressed={state.mode === "historical"}
            onClick={() => dispatch({ type: "mode", mode: "historical" })}
          >
            Historical analysis
          </button>
        </div>
        <label className="period-select">
          Reporting period
          <select
            value={state.index}
            onChange={(e) =>
              dispatch({ type: "period", index: Number(e.target.value) })
            }
          >
            {fixture.periods.slice(0, state.available + 1).map((period, i) => (
              <option key={period.id} value={i}>
                {period.label} 2026
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className={"arrival " + (latest ? "arrived" : "")}>
        <div className="arrival-icon">
          <Icon name={latest ? "check" : "file"} />
        </div>
        <div>
          <strong>
            {latest
              ? "September sample file is loaded"
              : "The next reporting file is ready"}
          </strong>
          <p>
            {latest
              ? "Ongoing monitoring follows the latest file. Historical analysis keeps your selected period."
              : "Simulate a new file arriving and see the trend, exceptions and source dates update."}
          </p>
        </div>
        <button
          className="button small"
          disabled={latest}
          onClick={() => dispatch({ type: "arrive" })}
        >
          {latest ? "All sample files loaded" : "Load September file"}
          {!latest && <Icon name="arrow" />}
        </button>
      </div>
      <div className="stats">
        <Stat
          label="Completed sessions"
          value={number(p.completed)}
          note={
            prior
              ? `${p.completed - prior.completed >= 0 ? "+" : ""}${p.completed - prior.completed} vs ${prior.label}`
              : "First sample reporting period"
          }
        />
        <Stat
          label="Delivery against plan"
          value={`${((p.completed / p.plan) * 100).toFixed(1)}%`}
          note={`${Math.abs(gap)} ${gap < 0 ? "below" : "above"} the ${p.plan} session plan`}
          tone={gap < -p.plan * 0.05 ? "amber" : "green"}
        />
        <Stat
          label="Cost per completion"
          value={money(p.cost / p.completed)}
          note={`${money(p.cost)} illustrative delivery spend`}
        />
        <Stat
          label="Open review signals"
          value={String(
            reviews.filter(
              (s) =>
                !state.decisions.some(
                  (d) => d.id === s.id && d.status !== "Deferred",
                ),
            ).length,
          ).padStart(2, "0")}
          note={`${reviews.length} rules triggered for ${p.label}`}
          tone="blue"
        />
      </div>
      <div className="monitor-grid">
        <Panel
          title="Delivery, over time"
          eyebrow="TREND / APR–SEP 2026"
          action={<span className="badge">ACTUAL VS PLAN</span>}
        >
          <Trend
            periods={fixture.periods.slice(0, state.available + 1)}
            selected={p.id}
            onSelect={(index) => dispatch({ type: "period", index })}
          />
          <p className="panel-foot">
            Choose a month to inspect its observations. Future sample files are
            hidden until loaded.
          </p>
        </Panel>
        <LocationBreakdown p={p} state={state} dispatch={dispatch} />
      </div>
      <SignalReviews reviews={reviews} state={state} dispatch={dispatch} />
      <DecisionLog state={state} />
    </>
  );
}

function SignalReviews({
  reviews,
  state,
  dispatch,
}: {
  reviews: Suggestion[];
  state: MonitorState;
  dispatch: Dispatch<MonitorAction>;
}) {
  return (
    <Panel
      title="Signals worth a closer look"
      eyebrow="RULE-BASED / HUMAN REVIEW"
      action={
        <span className="muted small-text">
          Preconfigured actions · no AI model
        </span>
      }
    >
      <div className="review-grid">
        {reviews.length ? (
          reviews.map((s, i) => {
            const decision = state.decisions.find((d) => d.id === s.id);
            return (
              <article className="review" key={s.id}>
                <div className="review-title">
                  <span className="review-index">0{i + 1}</span>
                  <h3>{s.title}</h3>
                  <span
                    className={
                      "badge " +
                      (decision
                        ? "status-" + decision.status.toLowerCase()
                        : "warning")
                    }
                  >
                    {decision?.status || "Needs review"}
                  </span>
                </div>
                <p>{s.rationale}</p>
                <div className="rule">
                  <span>RULE</span>
                  {s.rule}
                </div>
                <div className="review-actions">
                  {(["Accepted", "Deferred", "Dismissed"] as Status[]).map(
                    (status, n) => (
                      <button
                        key={status}
                        className={
                          n === 0
                            ? "button small primary"
                            : "button small quiet"
                        }
                        aria-pressed={decision?.status === status}
                        disabled={decision?.status === status}
                        onClick={() =>
                          dispatch({ type: "decide", suggestion: s, status })
                        }
                      >
                        {["Accept", "Defer", "Dismiss"][n]}
                      </button>
                    ),
                  )}
                </div>
              </article>
            );
          })
        ) : (
          <div className="empty">
            <Icon name="check" />
            <h3>No review threshold crossed</h3>
            <p>
              This period is within the two configured rule thresholds. Inspect
              later periods to compare.
            </p>
          </div>
        )}
      </div>
    </Panel>
  );
}

function DecisionLog({ state }: { state: MonitorState }) {
  return (
    <Panel
      title="A decision has a history."
      eyebrow="SESSION DECISION LOG"
      action={
        <span className="badge">
          {state.decisions.length} RECORD
          {state.decisions.length === 1 ? "" : "S"}
        </span>
      }
    >
      {!state.decisions.length ? (
        <div className="empty horizontal">
          <span className="empty-mark" aria-hidden="true">
            ↳
          </span>
          <div>
            <h3>Your next decision starts here.</h3>
            <p>
              Accept, defer or dismiss a signal. Its source, rule, rationale,
              owner and event history will appear here.
            </p>
          </div>
        </div>
      ) : (
        <div className="decision-list">
          {state.decisions.map((d) => (
            <details key={d.id} className="decision">
              <summary>
                <span className="decision-name">
                  {d.title}
                  <small>
                    {d.period} · {d.owner}
                  </small>
                </span>
                <span className={"badge status-" + d.status.toLowerCase()}>
                  {d.status}
                </span>
                <span className="muted">
                  {d.events.length} event{d.events.length === 1 ? "" : "s"}{" "}
                  <span aria-hidden="true">⌄</span>
                </span>
              </summary>
              <div className="decision-body">
                <dl>
                  <div>
                    <dt>Source</dt>
                    <dd>{d.source}</dd>
                  </div>
                  <div>
                    <dt>Rule</dt>
                    <dd>{d.rule}</dd>
                  </div>
                  <div>
                    <dt>Rationale</dt>
                    <dd>{d.rationale}</dd>
                  </div>
                  <div>
                    <dt>Owner</dt>
                    <dd>{d.owner} (sample role)</dd>
                  </div>
                </dl>
                <ol className="event-list">
                  {d.events.map((e) => (
                    <li key={e.sequence}>
                      <span>Event {String(e.sequence).padStart(2, "0")}</span>
                      <strong>{e.status}</strong>
                      <span>Demo visitor</span>
                    </li>
                  ))}
                </ol>
              </div>
            </details>
          ))}
        </div>
      )}
      <p className="panel-foot">
        Actions update this browser session only. Accepting a signal records a
        review decision; it does not execute a real intervention.
      </p>
    </Panel>
  );
}

function LocationBreakdown({
  p,
  state,
  dispatch,
}: {
  p: Period;
  state: MonitorState;
  dispatch: Dispatch<MonitorAction>;
}) {
  const site = p.sites.find((s) => s.name === state.site);
  return (
    <Panel
      title="Where the gap sits"
      eyebrow={p.label.toUpperCase() + " / LOCATION BREAKDOWN"}
    >
      <table className="site-table">
        <thead>
          <tr>
            <th scope="col">Location</th>
            <th scope="col">Actual / plan</th>
            <th scope="col">Gap</th>
          </tr>
        </thead>
        <tbody>
          {p.sites.map((s) => (
            <tr key={s.name}>
              <th scope="row">
                <button
                  className="text-button"
                  aria-expanded={state.site === s.name}
                  onClick={() =>
                    dispatch({
                      type: "site",
                      site: state.site === s.name ? null : s.name,
                    })
                  }
                >
                  {s.name}
                  <span aria-hidden="true">↗</span>
                </button>
              </th>
              <td>
                {s.completed} <span className="muted">/ {s.plan}</span>
              </td>
              <td>
                <span
                  className={s.completed < s.plan ? "negative" : "positive"}
                >
                  {s.completed - s.plan > 0 ? "+" : ""}
                  {s.completed - s.plan}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {site ? (
        <div className="source-detail">
          <p className="eyebrow">{site.name.toUpperCase()} / SOURCE DETAIL</p>
          <strong>
            {((site.completed / site.plan) * 100).toFixed(1)}% of plan delivered
          </strong>
          <p>
            {site.completed} completed sessions; {site.plan} planned. Source
            period: {p.label} 2026. This is an observation, not evidence of a
            cause.
          </p>
          <code>
            fixtures.json → {p.id} → {site.name}
          </code>
        </div>
      ) : (
        <div className="location-note">
          <span aria-hidden="true">↗</span>
          <p>
            Select a location to inspect its source and delivery against plan.
          </p>
        </div>
      )}
      <p className="panel-foot">
        Source issued {p.sourceDate} · synthetic monthly file
      </p>
    </Panel>
  );
}
