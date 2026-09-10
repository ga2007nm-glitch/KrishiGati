import { ArrowUpRight, Clock3, MapPin, Navigation, ShieldAlert } from "lucide-react";
import { useState } from "react";
import type { Mandi } from "./types";

type Props = { mandis: Mandi[]; states: string[]; cities: string[]; onFilter: (state: string, city: string) => void; onBook: (mandi: Mandi) => void };

export function NearestMandiList({ mandis, states, cities, onFilter, onBook }: Props) {
  const [country, setCountry] = useState("India");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const updateCountry = (value: string) => { setCountry(value); setState(""); setCity(""); onFilter("", ""); };
  const updateState = (value: string) => { setState(value); setCity(""); onFilter(value, ""); };
  const updateCity = (value: string) => { setCity(value); onFilter(state, value); };
  return (
    <section className="panel mandi-panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Smart routing</p>
          <h2>Procurement centers near you</h2>
        </div>
        <div className="mandi-filters"><label><small>Country</small><select value={country} onChange={(event) => updateCountry(event.target.value)}><option>India</option></select></label><label><small>State</small><select value={state} disabled={!country} onChange={(event) => updateState(event.target.value)}><option value="">Select state</option>{states.map((item) => <option key={item}>{item}</option>)}</select></label><label><small>City</small><select value={city} disabled={!state} onChange={(event) => updateCity(event.target.value)}><option value="">Select city</option>{cities.map((item) => <option key={item}>{item}</option>)}</select></label><span className="live-dot"><span /> Live</span></div>
      </div>
      <div className="mandi-list">
        {mandis.map((mandi) => (
          <article className="mandi-row" key={mandi.id}>
            <div className="mandi-icon"><MapPin size={18} /></div>
            <div className="mandi-main">
              <div className="mandi-title"><h3>{mandi.name}</h3><StatusBadge status={mandi.congestionStatus} /></div>
              <p>{mandi.district} <span>•</span> {mandi.distanceKm} km by road estimate</p>
              <div className="capacity-line"><span style={{ width: `${mandi.utilizationPercentage}%` }} /><b>{mandi.freeCapacityPercentage}% free</b></div>
            </div>
            <div className="mandi-meta"><span><Clock3 size={14} /> {mandi.estimatedWaitMinutes} min</span><button className="button button-small" onClick={() => onBook(mandi)}>Book slot <ArrowUpRight size={15} /></button></div>
            {mandi.smartRedirect && <div className="redirect-note"><ShieldAlert size={14} /> High demand. Try an alternative center nearby.</div>}
          </article>
        ))}
      </div>
    </section>
  );
}

function StatusBadge({ status }: { status: string }) {
  const tone = status === "HIGH WAIT" ? "danger" : status === "MED WAIT" ? "warning" : "success";
  return <span className={`status-badge ${tone}`}>{status}</span>;
}
