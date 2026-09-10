import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, ChevronDown, Globe2, Leaf, LogOut, Menu, Mic, ShieldCheck, Sparkles, Truck, X } from "lucide-react";
import { bookToken, dispatchPayout, getAllMandis, getCropPrices, getNearestMandis, getStats, queueOfflineBooking, type CropPrice } from "./api";
import { FarmerLogin } from "./FarmerLogin";
import { SmartRecommendation } from "./SmartRecommendation";
import { LowTechAccess } from "./LowTechAccess";
import { OfflineStatus } from "./OfflineStatus";
import { LiveQueueBoard } from "./LiveQueueBoard";
import { MandiMap } from "./MandiMap";
import { NearestMandiList } from "./NearestMandiList";
import { FarmerDashboard } from "./FarmerDashboard";
import { CropRateBoard } from "./CropRateBoard";
import { ProcurementReceipt } from "./ProcurementReceipt";
import { getCopy } from "./i18n";
import type { Mandi, Stats, Token } from "./types";

const fallbackPosition: [number, number] = [13.1007, 77.5963];
const steps = ["Slot booked", "Gate entry", "Quality grade", "IoT weighing", "Payment dispatched"];

const languageLocales: Record<string, string> = {
  English: "en-IN", "हिंदी": "hi-IN", "অসমীয়া": "as-IN", "বাংলা": "bn-IN", "बड़ो": "brx-IN", "डोगरी": "doi-IN",
  "ગુજરાતી": "gu-IN", "ಕನ್ನಡ": "kn-IN", "कश्मीरी": "ks-IN", "कोंकણી": "kok-IN", "मैथिली": "mai-IN", "മലയാളം": "ml-IN",
  "মণিপুরী": "mni-IN", "मराठी": "mr-IN", "नेपाली": "ne-IN", "ଓଡ଼ିଆ": "or-IN", "ਪੰਜਾਬੀ": "pa-IN", "संस्कृत": "sa-IN",
  "संथाली": "sat-IN", "سिनڌي": "sd-IN", "தமிழ்": "ta-IN", "తెలుగు": "te-IN", "اردو": "ur-IN",
};
const languages = ["English", "हिंदी", "অসমীয়া", "বাংলা", "बड़ो", "डोगरी", "ગુજરાતી", "ಕನ್ನಡ", "कश्मीरी", "कोंकણી", "मैथिली", "മലയാളം", "মণিপুরী", "मराठी", "नेपाली", "ଓଡ଼ିଆ", "ਪੰਜਾਬੀ", "संस्कृत", "संथाली", "سिन्धी", "தமிழ்", "తెలుగు", "اردو"];

type FarmerProfile = { id: string; name: string; role: "FARMER" | "OFFICIAL" };
type SpeechResultEvent = { results: { 0: { 0: { transcript: string } } } };
type SpeechRecognitionInstance = { lang: string; interimResults: boolean; continuous: boolean; start: () => void; onstart: (() => void) | null; onend: (() => void) | null; onresult: ((event: SpeechResultEvent) => void) | null; onerror: ((event: { error: string }) => void) | null };
type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;
type SpeechWindow = Window & { SpeechRecognition?: SpeechRecognitionConstructor; webkitSpeechRecognition?: SpeechRecognitionConstructor };

export default function App() {
  const [view, setView] = useState<"farmer" | "admin">("farmer");
  const [language, setLanguage] = useState("English");
  const [farmer, setFarmer] = useState<FarmerProfile>();
  const [mandis, setMandis] = useState<Mandi[]>([]);
  const [allMandis, setAllMandis] = useState<Mandi[]>([]);
  const [states, setStates] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [stats, setStats] = useState<Stats>({ grainsProcuredKg: 0, averageWaitMinutes: 25, activeMandis: 0 });
  const [position, setPosition] = useState<[number, number]>(fallbackPosition);
  const [selectedMandi, setSelectedMandi] = useState<Mandi>();
  const [farmerId, setFarmerId] = useState("");
  const [token, setToken] = useState<Token>();
  const [notice, setNotice] = useState("");
  const [cropPrices, setCropPrices] = useState<Record<string, CropPrice>>({});
  const [bookingCrop, setBookingCrop] = useState("Wheat");
  const [bookingQuantity, setBookingQuantity] = useState(500);
  const [isListening, setIsListening] = useState(false);
  const text = getCopy(language);
  const cropGroups = ["Grains", "Pulses", "Oilseeds", "Vegetables", "Fruits"];
  const groupedCrops = cropGroups.map((category) => ({ category, crops: Object.entries(cropPrices).filter(([, rate]) => rate.category === category) }));

  useEffect(() => {
    const savedFarmer = localStorage.getItem("krishigati_farmer");
    if (savedFarmer) { const profile = JSON.parse(savedFarmer) as FarmerProfile; setFarmer(profile); setView(profile.role === "OFFICIAL" ? "admin" : "farmer"); }
  }, []);

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(({ coords }) => setPosition([coords.latitude, coords.longitude]));
  }, []);

  useEffect(() => {
    if (!farmer) return;
    Promise.all([getNearestMandis(position[0], position[1]), getAllMandis(position[0], position[1]), getStats(), getCropPrices()])
      .then(([mandiData, allMandiData, statsData, priceData]) => { setMandis(mandiData.mandis); setAllMandis(allMandiData.mandis); setStates(allMandiData.states); setCities(allMandiData.cities); setStats(statsData.stats); setCropPrices(priceData.crops); setFarmerId(farmer.id); })
      .catch((error: Error) => setNotice(error.message));
  }, [position, farmer]);

  const primaryMandi = useMemo(() => mandis[0], [mandis]);
  const activeStep = token ? Math.max(0, ["BOOKED", "GATE_ENTRY", "QUALITY_VERIFIED", "WEIGHED", "PAYMENT_DISPATCHED"].indexOf(token.status)) : 0;

  async function handleBooking(mandi: Mandi) {
    setSelectedMandi(mandi);
    setBookingCrop(Object.keys(cropPrices)[0] || "Wheat");
    setBookingQuantity(500);
    setNotice("");
  }

  async function filterMandis(state: string, city: string) {
    try { const result = await getAllMandis(position[0], position[1], state, city); setMandis(result.mandis); setCities(result.cities); if (!state && !city) setMandis(allMandis); } catch (error) { setNotice((error as Error).message); }
  }

  async function submitBooking(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedMandi || !farmerId) return;
    const form = new FormData(event.currentTarget);
    try {
      const result = await bookToken({ farmerId, mandiId: selectedMandi.id, cropType: form.get("cropType"), quantityKg: Number(form.get("quantityKg")), slotTime: form.get("slotTime") });
      setToken(result.token); setSelectedMandi(undefined); setNotice(`Token ${result.token.tokenNumber} booked successfully.`);
    } catch (error) {
      const payload = { farmerId, mandiId: selectedMandi.id, cropType: form.get("cropType"), quantityKg: Number(form.get("quantityKg")), slotTime: form.get("slotTime") };
      if (!navigator.onLine) { queueOfflineBooking(payload); setSelectedMandi(undefined); setNotice("You are offline. This booking is queued and will sync automatically when you reconnect."); }
      else setNotice((error as Error).message);
    }
  }

  async function simulatePayment() {
    if (!token) return;
    const rate = cropPrices[token.cropType]?.mspPerKg || 0;
    try {
      const result = await dispatchPayout(token.id, token.quantityKg * rate);
      setToken({ ...token, status: "PAYMENT_DISPATCHED" });
      setNotice(`${result.sms.message} SMS sent to farmer ending ${result.sms.recipientLast4}.`);
    } catch (error) { setNotice((error as Error).message); }
  }

  function speakAndListen() {
    const speech = window.speechSynthesis;
    speech.cancel();
    const locale = languageLocales[language] || "en-IN";
    const utterance = new SpeechSynthesisUtterance(`Welcome ${farmer?.name || "farmer"}. You can say farmer desk or mandi operations.`);
    utterance.lang = locale;
    speech.speak(utterance);
    const speechWindow = window as SpeechWindow;
    const Recognition = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;
    if (!Recognition) {
      setNotice("Voice input is not supported. Use Google Chrome or Microsoft Edge and allow microphone access.");
      return;
    }
    const recognition = new Recognition();
    recognition.lang = locale;
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.onstart = () => { setIsListening(true); setNotice(`Listening in ${language}... say farmer desk or mandi operations.`); };
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event) => {
      const command = event.results[0][0].transcript.toLowerCase();
      if (command.includes("mandi") || command.includes("operation")) setView("admin");
      if (command.includes("farmer") || command.includes("desk")) setView("farmer");
    };
    recognition.onerror = (event) => { setIsListening(false); setNotice(event.error === "not-allowed" ? "Microphone access is blocked. Click the lock icon near the address bar and allow Microphone." : "I could not hear that. Please try again in a quiet place."); };
    try { recognition.start(); } catch { setIsListening(false); setNotice("Voice input is already starting. Please try again in a moment."); }
  }

  function switchAccount() {
    localStorage.removeItem("krishigati_farmer");
    setFarmer(undefined);
    setToken(undefined);
    setFarmerId("");
    setView("farmer");
  }

  if (!farmer) return <FarmerLogin language={language} onLanguageChange={setLanguage} onRegistered={(profile) => { setFarmer(profile); setView(profile.role === "OFFICIAL" ? "admin" : "farmer"); }} onVoice={speakAndListen} onNotice={setNotice} />;

  return <div className="app-shell">
    <header className="topbar"><a className="brand" href="#top"><span className="brand-mark"><Leaf size={19} /></span><span><b>KrishiGati</b><small>Smart procurement network</small></span></a><nav className="main-nav"><button className={view === "farmer" ? "active" : ""} onClick={() => setView("farmer")}>{text.farmer}</button><button className={view === "admin" ? "active" : ""} onClick={() => setView("admin")}>{text.procurement}</button></nav><div className="top-actions"><OfflineStatus onNotice={setNotice} /><button className="language" onClick={() => setLanguage(languages[(languages.indexOf(language) + 1) % languages.length])}><Globe2 size={16} /> {language}<ChevronDown size={13} /></button><button className={`voice-button top-voice ${isListening ? "listening" : ""}`} onClick={speakAndListen}><Mic size={15} /> {isListening ? "Listening..." : text.voice}</button><button className="account-button" onClick={switchAccount}><LogOut size={14} /> Switch account</button><button className="menu-button"><Menu size={20} /></button></div></header>
    <main id="top">
      <motion.section className="hero" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .55 }}><div className="hero-copy"><span className="hero-kicker"><Sparkles size={15} /> Ministry-grade automation for every harvest</span><h1>Move grain faster.<br /><em>Protect farmer time.</em></h1><p>One transparent route from mandi discovery to DBT payout, built for the pace of India's agricultural network.</p><div className="hero-actions"><button className="button button-primary" onClick={() => document.getElementById("mandis")?.scrollIntoView({ behavior: "smooth" })}>Find my nearest mandi <ArrowRight size={17} /></button><span className="secure-note"><ShieldCheck size={16} /> Secure digital token</span></div></div><div className="hero-orbit"><div className="orbit-card"><span>Today's network</span><strong>{stats.activeMandis || "--"}</strong><small>active mandis</small><div className="orbit-line" /></div><div className="hero-stamp"><Truck size={18} /><span>Queue intelligence<br /><b>ON</b></span></div></div></motion.section>
      <section className="stats-strip"><Stat label="Grains procured today" value={`${(stats.grainsProcuredKg / 1000).toFixed(1)} t`} accent="green" /><Stat label="Average wait time" value={`${stats.averageWaitMinutes} min`} accent="amber" /><Stat label="Active procurement centers" value={String(stats.activeMandis || "--")} accent="blue" /><Stat label="Network status" value="Operational" accent="green" /> </section>
      {notice && <div className="notice"><span>{notice}</span><button onClick={() => setNotice("")}><X size={16} /></button></div>}
      {view === "farmer" ? <><section className="workspace-grid"><MandiMap mandis={mandis} position={position} /><FarmerDashboard token={token} activeStep={activeStep} steps={steps} /></section>{token && <ProcurementReceipt token={token} />}<CropRateBoard crops={cropPrices} /><SmartRecommendation position={position} onSelect={handleBooking} /><section id="mandis"><NearestMandiList mandis={mandis} states={states} cities={cities} onFilter={filterMandis} onBook={handleBooking} /></section><LowTechAccess onNotice={setNotice} />{token && token.status !== "PAYMENT_DISPATCHED" && <button className="button button-primary payment-demo-button" onClick={simulatePayment}>Simulate DBT credit + SMS receipt <ArrowRight size={16} /></button>}</> : <section className="admin-view"><div className="admin-intro"><div><p className="eyebrow">Mandi command center</p><h2>Keep the yard moving.</h2><p>See demand, balance counters, and keep every arrival accountable.</p></div><span className="admin-pill"><span /> Operations live</span></div><LiveQueueBoard mandi={primaryMandi} /></section>}
    </main>
    <footer><span>KrishiGati · Smart India Hackathon 2026</span><span>Designed for farmers, operators, and public trust.</span></footer>
    {selectedMandi && <div className="modal-backdrop"><form className="booking-modal" onSubmit={submitBooking}><button type="button" className="modal-close" onClick={() => setSelectedMandi(undefined)}><X size={18} /></button><p className="eyebrow">Reserve a smart slot</p><h2>{selectedMandi.name}</h2><p className="modal-context">{selectedMandi.distanceKm} km away · {selectedMandi.freeCapacityPercentage}% capacity free</p><label>Crop type<select name="cropType" value={bookingCrop} onChange={(event) => setBookingCrop(event.target.value)}>{groupedCrops.map((group) => <optgroup label={group.category} key={group.category}>{group.crops.map(([crop]) => <option key={crop}>{crop}</option>)}</optgroup>)}</select></label><label>Expected quantity (kg)<input name="quantityKg" type="number" min="1" value={bookingQuantity} onChange={(event) => setBookingQuantity(Number(event.target.value))} required /></label><p className="payout-preview">Estimated MSP payout: <strong>₹{((cropPrices[bookingCrop]?.mspPerKg || 0) * bookingQuantity).toFixed(2)}</strong></p><label>Preferred arrival<input name="slotTime" type="datetime-local" required /></label><button className="button button-primary" type="submit">Confirm procurement slot <ArrowRight size={16} /></button><small>Your digital token activates within 2 km of the center.</small></form></div>}
  </div>;
}

function Stat({ label, value, accent }: { label: string; value: string; accent: string }) { return <div className={`stat stat-${accent}`}><span>{label}</span><strong>{value}</strong></div>; }
