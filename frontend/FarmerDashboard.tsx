import { Check } from "lucide-react";
import type { Token } from "./types";

type Props = { token?: Token; activeStep: number; steps: string[] };

export function FarmerDashboard({ token, activeStep, steps }: Props) {
  return <section className="panel token-panel">
    <div className="section-heading"><div><p className="eyebrow">Farmer dashboard</p><h2>{token ? "Your active procurement" : "Your next procurement"}</h2></div><span className="token-state">{token ? token.status.replaceAll("_", " ") : "READY"}</span></div>
    {token ? <div className="token-number"><small>Digital token</small><strong>{token.tokenNumber}</strong><span>{token.cropType} · {token.quantityKg} kg</span></div> : <div className="empty-token"><div className="empty-icon"><Check size={20} /></div><p>Choose a mandi below to receive a digital queue token.</p></div>}
    <div className="progress-track">{steps.map((step, index) => <div className={`progress-step ${index <= activeStep ? "done" : ""}`} key={step}><span>{index < activeStep ? <Check size={12} /> : index + 1}</span><small>{step}</small></div>)}</div>
  </section>;
}
