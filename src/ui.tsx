import type { ReactNode } from "react";
import type { Period, Projection } from "./domain";
export const number = (n: number) => n.toLocaleString("en-US");
const currencyFormat = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});
export const money = (n: number) => currencyFormat.format(n);
export function Icon({
  name,
}: {
  name: "arrow" | "reset" | "chart" | "sliders" | "file" | "check";
}) {
  const paths = {
    arrow: "M4 12h16m-6-6 6 6-6 6",
    reset: "M4 10a8 8 0 1 1 1 8M4 4v6h6",
    chart: "M4 19V5m0 14h16M8 15l4-5 4 2 4-7",
    sliders: "M4 7h6m4 0h6M4 17h10m4 0h2M10 4v6m4 4v6",
    file: "M14 3H5v18h14V8l-5-5v5h5M8 12h8M8 16h6",
    check: "m5 12 4 4L19 6",
  };
  return (
    <svg
      className="icon"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name]} />
    </svg>
  );
}
export function Panel({
  title,
  eyebrow,
  action,
  children,
  className = "",
}: {
  title: string;
  eyebrow?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={"panel " + className}>
      <header className="panel-head">
        <div>
          {eyebrow && <p className="eyebrow">{eyebrow}</p>}
          <h2>{title}</h2>
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}
export function Stat({
  label,
  value,
  note,
  tone,
}: {
  label: string;
  value: string;
  note: string;
  tone?: string;
}) {
  return (
    <article className={"stat " + (tone || "")}>
      <p>{label}</p>
      <strong>{value}</strong>
      <span>{note}</span>
    </article>
  );
}
export function Trend({
  periods,
  selected,
  onSelect,
}: {
  periods: Period[];
  selected: string;
  onSelect: (n: number) => void;
}) {
  const max = Math.ceil(Math.max(...periods.map((p) => p.plan)) / 100) * 100;
  const point = (i: number, val: number) =>
    `${65 + i * 92},${190 - (val / max) * 145}`;
  return (
    <>
      <div className="chart-key">
        <span>
          <i className="key actual" />
          Actual completions
        </span>
        <span>
          <i className="key planned" />
          Plan
        </span>
        <span className="unit">Synthetic observations</span>
      </div>
      <svg
        className="trend"
        viewBox="0 0 580 220"
        role="img"
        aria-labelledby="trend-title trend-desc"
      >
        <title id="trend-title">Completions versus plan</title>
        <desc id="trend-desc">
          {periods
            .map((p) => `${p.label}: ${p.completed} actual, ${p.plan} planned`)
            .join(". ")}
        </desc>
        {[0, 0.5, 1].map((t) => (
          <g key={t}>
            <line
              x1="50"
              x2="550"
              y1={190 - t * 145}
              y2={190 - t * 145}
              stroke="var(--line)"
              strokeDasharray="3 5"
            />
            <text x="35" y={195 - t * 145} textAnchor="end">
              {max * t}
            </text>
          </g>
        ))}
        <polyline
          points={periods.map((p, i) => point(i, p.plan)).join(" ")}
          fill="none"
          stroke="var(--muted)"
          strokeWidth="2"
          strokeDasharray="5 5"
        />
        <polyline
          points={periods.map((p, i) => point(i, p.completed)).join(" ")}
          fill="none"
          stroke="var(--blue)"
          strokeWidth="3"
        />
        {periods.map((p, i) => (
          <g key={p.id}>
            <circle
              cx={65 + i * 92}
              cy={190 - (p.completed / max) * 145}
              r={p.id === selected ? 6 : 4}
              fill="var(--blue)"
              stroke="var(--paper)"
              strokeWidth="2"
            />
            <text x={65 + i * 92} y="216" textAnchor="middle">
              {p.short}
            </text>
          </g>
        ))}
      </svg>
      <div className="period-buttons" aria-label="Inspect a reporting period">
        {periods.map((p, i) => (
          <button
            key={p.id}
            aria-pressed={p.id === selected}
            onClick={() => onSelect(i)}
          >
            {p.short}
            <span>{p.completed}</span>
          </button>
        ))}
      </div>
    </>
  );
}
export function Funnel({ projection }: { projection: Projection }) {
  const items = [
    ["Contacted", projection.contacts],
    ["Offered", projection.offers],
    ["Accepted", projection.accepted],
    ["Booked", projection.appointments],
    ["Completed", projection.completions],
  ] as const;
  return (
    <ol className="funnel">
      {items.map(([label, value], i) => (
        <li key={label}>
          <div>
            <span>
              <small>0{i + 1}</small>
              {label}
            </span>
            <strong>{number(value)}</strong>
          </div>
          <div className="funnel-track">
            <span
              style={{
                width: `${projection.contacts ? (value / projection.contacts) * 100 : 0}%`,
              }}
            />
          </div>
        </li>
      ))}
    </ol>
  );
}

export function PageHeading({
  eyebrow,
  children,
  intro,
  issue,
}: {
  eyebrow: string;
  children: ReactNode;
  intro: string;
  issue: { label: string; title: string; note: string; amber?: boolean };
}) {
  return (
    <div className="page-heading">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{children}</h1>
        <p className="intro">{intro}</p>
      </div>
      <div className="issue">
        <span className={"live-dot" + (issue.amber ? " amber-dot" : "")} />
        {issue.label}
        <strong>{issue.title}</strong>
        <span>{issue.note}</span>
      </div>
    </div>
  );
}
