import { useEffect, useState } from "react";
import { Banknote, CheckCircle2, RefreshCw, Scale, ShieldCheck } from "lucide-react";
import { getProcurementDetails, type ProcurementDetails } from "./api";
import type { Token } from "./types";

type Props = { token: Token };

export function ProcurementReceipt({ token }: Props) {
  const [details, setDetails] = useState<ProcurementDetails>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = () => getProcurementDetails(token.id).then((result) => { if (active) setDetails(result); }).finally(() => { if (active) setLoading(false); });
    load();
    const interval = window.setInterval(load, 5000);
    return () => { active = false; window.clearInterval(interval); };
  }, [token.id]);

  const measuredWeight = details?.token.netWeightKg;
  const payout = details?.token.payout;
  const rate = details?.pricing?.mspPerKg;
  const estimated = details?.estimatedPayout;

  return <section className="panel receipt-panel"><div className="section-heading"><div><p className="eyebrow">Transparent procurement receipt</p><h2>Weight and payment ledger</h2></div><span className="receipt-live"><span /> Auto-refreshing</span></div><div className="receipt-token"><span>Token {token.tokenNumber}</span><b>{token.cropType}</b><small>Booked quantity {token.quantityKg.toLocaleString()} kg</small></div><div className="receipt-grid"><div className="receipt-metric"><Scale size={17} /><span>Shop measured weight</span><strong>{measuredWeight != null ? `${measuredWeight.toLocaleString()} kg` : "Awaiting weighbridge"}</strong><small>{measuredWeight != null ? "Accepted net weight" : "Updates automatically after weighing"}</small></div><div className="receipt-metric"><Banknote size={17} /><span>MSP rate</span><strong>{rate != null ? `₹${rate.toFixed(2)} / kg` : "Loading rate"}</strong><small>{details?.pricing?.season || "Procurement rate board"}</small></div><div className="receipt-metric"><ShieldCheck size={17} /><span>Payment due</span><strong>₹{(payout?.amount ?? estimated ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</strong><small>{measuredWeight != null ? "Based on accepted weight" : "Estimate from booked quantity"}</small></div></div><div className={`payment-status ${payout?.status === "DISPATCHED" ? "paid" : "pending"}`}><span>{payout?.status === "DISPATCHED" ? <CheckCircle2 size={16} /> : <RefreshCw size={16} />}</span><div><b>{payout?.status === "DISPATCHED" ? "DBT payment credited" : "Payment awaiting weighbridge"}</b><small>{payout?.transactionReference ? `Transaction reference: ${payout.transactionReference}` : "The farmer receives an SMS as soon as payment is dispatched."}</small></div></div>{loading && <p className="receipt-loading">Syncing procurement shop data...</p>}</section>;
}
