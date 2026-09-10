import { useState } from "react";
import { Headphones, MessageSquare, PhoneCall, Send } from "lucide-react";
import { requestLowTech } from "./api";

type Props = { onNotice: (message: string) => void };

export function LowTechAccess({ onNotice }: Props) {
  const [phone, setPhone] = useState("");
  const [channel, setChannel] = useState<"sms" | "ivr">("sms");
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    try {
      const result = await requestLowTech(channel, phone);
      onNotice(result.message || result.menu?.join(" · ") || `${result.channel} demo started for phone ending ${result.phoneLast4}.`);
    } catch (error) { onNotice((error as Error).message); }
    finally { setLoading(false); }
  }

  return <section className="low-tech-panel"><div><p className="eyebrow"><Headphones size={12} /> No smartphone? No problem.</p><h3>Use SMS or a voice call</h3><p>Get a token, hear queue status, and receive mandi directions through low-tech channels.</p></div><div className="low-tech-controls"><div className="channel-toggle"><button className={channel === "sms" ? "active" : ""} onClick={() => setChannel("sms")}><MessageSquare size={15} /> SMS</button><button className={channel === "ivr" ? "active" : ""} onClick={() => setChannel("ivr")}><PhoneCall size={15} /> IVR call</button></div><div className="phone-action"><input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="10-digit mobile" inputMode="numeric" maxLength={10} /><button onClick={submit} disabled={loading}><Send size={14} /> {loading ? "Sending" : "Try demo"}</button></div></div></section>;
}
