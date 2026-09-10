import { FormEvent, useState } from "react";
import { ArrowRight, CheckCircle2, FileCheck2, Leaf, LockKeyhole, Mic, ShieldCheck } from "lucide-react";
import { registerFarmer } from "./api";
import { getCopy } from "./i18n";

const languages = ["English", "हिंदी", "অসমীয়া", "বাংলা", "बड़ो", "डोगरी", "ગુજરાતી", "ಕನ್ನಡ", "कश्मीरी", "कोंकणी", "मैथिली", "മലയാളം", "মণিপুরী", "मराठी", "नेपाली", "ଓଡ଼ିଆ", "ਪੰਜਾਬੀ", "संस्कृत", "संथाली", "सিন্ধী", "தமிழ்", "తెలుగు", "اردو"];

type Props = { language: string; onLanguageChange: (language: string) => void; onRegistered: (farmer: { id: string; name: string; role: "FARMER" | "OFFICIAL" }) => void; onVoice: () => void; onNotice: (message: string) => void };

export function FarmerLogin({ language, onLanguageChange, onRegistered, onVoice }: Props) {
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [role, setRole] = useState<"FARMER" | "OFFICIAL">("FARMER");
  const text = getCopy(language);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    const form = new FormData(event.currentTarget);
    try {
      const result = await registerFarmer({
        role,
        name: String(form.get("name") || ""),
        phone: String(form.get("phone") || ""),
        aadhaarNo: role === "FARMER" ? String(form.get("aadhaarNo") || "") : undefined,
        panNo: role === "FARMER" ? String(form.get("panNo") || "") : undefined,
        officialId: role === "OFFICIAL" ? String(form.get("officialId") || "") : undefined,
      });
      localStorage.setItem("krishigati_farmer", JSON.stringify(result.farmer));
      onRegistered(result.farmer);
      onNotice(result.sms.simulated ? "SMS demo recorded locally. Add Twilio credentials to send to the entered number." : "Welcome SMS sent successfully to your mobile number.");
    } catch (submissionError) {
      setError((submissionError as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return <div className="login-shell">
    <div className="login-visual"><div className="login-brand"><span className="brand-mark"><Leaf size={19} /></span><span><b>KrishiGati</b><small>Smart procurement network</small></span></div><div className="login-message"><p className="eyebrow">{role === "FARMER" ? text.farmer : text.procurement}</p><h1>{role === "FARMER" ? "Your harvest deserves a faster route." : "Keep every procurement yard moving."}</h1><p>{role === "FARMER" ? "Discover nearby mandis, reserve a slot, and follow every step to your DBT payout." : "Monitor queues, verify arrivals, and dispatch transparent farmer payments."}</p><div className="login-points"><span><CheckCircle2 size={17} /> Real-time mandi availability</span><span><ShieldCheck size={17} /> Identity details are protected</span><span><FileCheck2 size={17} /> Digital workflow for every visit</span></div></div></div>
    <div className="login-card"><div className="login-tools"><label><span>{text.language}</span><select value={language} onChange={(event) => onLanguageChange(event.target.value)}>{languages.map((item) => <option key={item}>{item}</option>)}</select></label><button type="button" className="voice-button" onClick={onVoice}><Mic size={15} /> {text.voice}</button></div><div className="role-switch"><button className={role === "FARMER" ? "active" : ""} onClick={() => setRole("FARMER")} type="button">{text.loginFarmer}</button><button className={role === "OFFICIAL" ? "active" : ""} onClick={() => setRole("OFFICIAL")} type="button">{text.loginProcurement}</button></div><div className="login-heading"><p className="eyebrow">{role === "FARMER" ? text.loginFarmer : text.loginProcurement}</p><h2>{text.welcome}</h2><p>{role === "FARMER" ? "Create your secure farmer profile." : "Use your authorized procurement employee ID."}</p></div><form className="login-form" onSubmit={submit}><label>{text.name}<input name="name" autoComplete="name" placeholder={text.name} required minLength={2} /></label><label>{text.phone}<input name="phone" inputMode="numeric" autoComplete="tel" placeholder="10-digit mobile number" pattern="[0-9]{10}" maxLength={10} required /></label>{role === "FARMER" ? <><label>{text.aadhaar}<input name="aadhaarNo" inputMode="numeric" placeholder="12-digit Aadhaar number" pattern="[0-9 ]{12,14}" maxLength={14} required /><small>Used only for farmer identity verification.</small></label><label>{text.pan}<input name="panNo" autoCapitalize="characters" placeholder="e.g. ABCDE1234F" pattern="[A-Za-z]{5}[0-9]{4}[A-Za-z]" maxLength={10} required /></label></> : <label>Employee ID<input name="officialId" placeholder="e.g. PROC-KA-1042" required minLength={4} /></label>}{error && <div className="login-error">{error}</div>}<button className="button button-primary login-submit" disabled={isSubmitting} type="submit">{isSubmitting ? "Connecting..." : role === "FARMER" ? text.continueFarmer : text.continueProcurement} <ArrowRight size={16} /></button></form><p className="privacy-note"><LockKeyhole size={14} /> {text.identityNote}</p></div>
  </div>;
}
