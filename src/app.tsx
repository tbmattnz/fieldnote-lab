import { useReducer, useRef, useState, useSyncExternalStore } from "react";
import { createRoot } from "react-dom/client";
import fixtureData from "./fixtures.json";
import { defaults, initialMonitor, transition } from "./domain";
import type { Fixture, MonitorAction, MonitorState } from "./domain";
import { Monitor } from "./Monitor";
import { Planner } from "./Planner";
import type { SavedScenario } from "./Planner";
import { Icon } from "./ui";
const fixture: Fixture = fixtureData;
const subscribe = (callback: () => void) => {
  window.addEventListener("hashchange", callback);
  return () => window.removeEventListener("hashchange", callback);
};
const currentView = () =>
  window.location.hash === "#planner" ? "planner" : "monitor";
function App() {
  const view = useSyncExternalStore(subscribe, currentView);
  const mainRef = useRef<HTMLElement>(null);
  const [monitor, dispatch] = useReducer(
    (s: MonitorState, a: MonitorAction) => transition(s, a, fixture),
    fixture,
    initialMonitor,
  );
  const [assumptions, setAssumptions] = useState(() => defaults(fixture));
  const [saved, setSaved] = useState<SavedScenario[]>([]);
  const [stage, setStage] = useState(0);
  const [notice, setNotice] = useState("");
  function reset() {
    dispatch({ type: "reset" });
    setAssumptions(defaults(fixture));
    setSaved([]);
    setStage(0);
    setNotice(
      "Both demos reset. Sample files, decisions, assumptions and saved comparisons restored.",
    );
  }
  return (
    <div className="app">
      <a
        className="skip"
        href="#main-content"
        onClick={(e) => {
          e.preventDefault();
          mainRef.current?.focus();
        }}
      >
        Skip to content
      </a>
      <aside className="sidebar">
        <a className="brand" href="#monitor">
          <span className="brand-symbol" aria-hidden="true">
            f.
          </span>
          fieldnote<span className="brand-period">/</span>
        </a>
        <div className="sidebar-caption">A SERVICE DELIVERY LAB</div>
        <nav aria-label="Demonstrations">
          <p className="eyebrow">EXPLORE THE EXAMPLES</p>
          <a
            id="monitor"
            href="#monitor"
            aria-current={view === "monitor" ? "page" : undefined}
          >
            <Icon name="chart" />
            <span>
              Operations monitor<small>Observe & decide</small>
            </span>
            <span aria-hidden="true">01</span>
          </a>
          <a
            id="planner"
            href="#planner"
            aria-current={view === "planner" ? "page" : undefined}
          >
            <Icon name="sliders" />
            <span>
              Scenario planner<small>Adjust & compare</small>
            </span>
            <span aria-hidden="true">02</span>
          </a>
        </nav>
        <div className="sidebar-bottom">
          <div className="sample-label">
            <span className="live-dot" />
            SYNTHETIC DATA ONLY
          </div>
          <p>
            A portfolio project by
            <br />
            <a href="https://github.com/tbmattnz">Matt Abraham ↗</a>
          </p>
          <span className="sidebar-fine">
            Original demonstrations.
            <br />
            No real participants or live actions.
          </span>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <div>
            <span className="breadcrumb">FIELDNOTE LAB</span>
            <span className="slash">/</span>
            <span>
              {view === "monitor" ? "Operations monitor" : "Scenario planner"}
            </span>
          </div>
          <button className="reset" onClick={reset}>
            <Icon name="reset" />
            Reset both demos
          </button>
        </header>
        <main ref={mainRef} id="main-content" tabIndex={-1} className="main">
          <div className="portfolio-notice">
            <span className="badge">INTERACTIVE PORTFOLIO</span>
            <p>
              Fictional community programme · illustrative USD amounts ·
              everything stays in this tab
            </p>
            <a
              href="https://github.com/tbmattnz/fieldnote-lab"
              target="_blank"
              rel="noreferrer"
            >
              View source ↗
            </a>
            <a href="./fixtures.json" target="_blank" rel="noreferrer">
              Inspect the dataset ↗
            </a>
          </div>
          <p className="sr-only" role="status">
            {notice}
          </p>
          {view === "monitor" ? (
            <Monitor
              fixture={fixture}
              state={monitor}
              dispatch={(a) => {
                setNotice("");
                dispatch(a);
              }}
            />
          ) : (
            <Planner
              fixture={fixture}
              assumptions={assumptions}
              setAssumptions={setAssumptions}
              saved={saved}
              setSaved={setSaved}
              stage={stage}
              setStage={setStage}
            />
          )}
          <footer className="footer">
            <span>FIELDNOTE / TWO WORKING EXAMPLES</span>
            <span>Designed & built by Matt Abraham</span>
            <span>Browser-only · no external writes</span>
          </footer>
        </main>
      </div>
    </div>
  );
}
createRoot(document.getElementById("root")!).render(<App />);
