import { useState } from "react";
import { ArrowRight, Clock3, Route, Sparkles } from "lucide-react";
import { getRecommendation, type Recommendation } from "./api";
import type { Mandi } from "./types";

type Props = { position: [number, number]; onSelect: (mandi: Mandi) => void };

export function SmartRecommendation({ position, onSelect }: Props) {
  const [quantity, setQuantity] = useState(500);
  const [recommendation, setRecommendation] = useState<Recommendation>();
  const [alternatives, setAlternatives] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function calculate() {
    setLoading(true); setError("");
    try {
      const result = await getRecommendation(position[0], position[1], quantity);
      setRecommendation(result.recommendation); setAlternatives(result.alternatives);
    } catch (requestError) { setError((requestError as Error).message); }
    finally { setLoading(false); }
  }

  const selectMandi = (item: Recommendation) => onSelect({ ...item, congestionStatus: item.utilizationPercentage >= 90 ? "HIGH WAIT" : item.utilizationPercentage >= 50 ? "MED WAIT" : "LOW WAIT", smartRedirect: item.utilizationPercentage >= 90, estimatedWaitMinutes: item.predictedWaitMinutes, latitude: position[0], longitude: position[1] });

  return <section className="panel recommendation-panel"><div className="section-heading"><div><p className="eyebrow"><Sparkles size={12} /> Predictive flow engine</p><h2>Choose the fastest route</h2></div><span className="recommend-score">Data-backed</span></div><div className="recommend-input"><label>What are you bringing today?<input type="number" min="1" value={quantity} onChange={(event) => setQuantity(Number(event.target.value))} /> <small>kg</small></label><button className="button button-primary" onClick={calculate} disabled={loading}>{loading ? "Calculating..." : "Predict my route"} <ArrowRight size={16} /></button></div>{error && <p className="inline-error">{error}</p>}{recommendation && <><div className="recommend-winner"><div className="winner-icon"><Route size={18} /></div><div><small>Recommended for {quantity} kg</small><h3>{recommendation.name}</h3><p>{recommendation.reason}</p></div><div className="winner-time"><strong>{recommendation.predictedWaitMinutes} min</strong><span>predicted total wait</span></div><button className="button button-small" onClick={() => selectMandi(recommendation)}>Book this <ArrowRight size={14} /></button></div><div className="recommend-details"><span><Clock3 size={14} /> Arrival around {new Date(recommendation.recommendedArrival).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span><span>{recommendation.freeCapacityPercentage}% capacity free</span><span>{recommendation.queueLength} vehicles ahead</span></div>{alternatives.length > 0 && <p className="alternative-copy">Alternatives are ranked by distance, capacity, and queue pressure below.</p>}</>}</section>;
}
