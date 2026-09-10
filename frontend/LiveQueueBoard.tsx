import { useEffect, useState } from "react";
import { MonitorUp, Radio, Users } from "lucide-react";
import { io } from "socket.io-client";
import { API_URL, getQueue } from "./api";
import type { Mandi, QueueItem } from "./types";

type Props = { mandi: Mandi | undefined };

export function LiveQueueBoard({ mandi }: Props) {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  useEffect(() => {
    if (!mandi) return;
    getQueue(mandi.id).then((data) => setQueue(data.queue)).catch(() => setQueue([]));
    const socket = io(API_URL);
    socket.emit("mandi:join", mandi.id);
    socket.on("queue:updated", (data: { mandiId: string; queue: QueueItem[] }) => {
      if (data.mandiId === mandi.id) setQueue(data.queue);
    });
    return () => { socket.disconnect(); };
  }, [mandi]);

  return (
    <section className="panel queue-panel">
      <div className="section-heading"><div><p className="eyebrow">Operations control room</p><h2>Live queue board</h2></div><span className="live-dot"><span /> Socket live</span></div>
      <div className="queue-summary"><span><Users size={17} /> {queue.length} vehicles today</span><span><MonitorUp size={17} /> Counter allocation active</span></div>
      <div className="queue-columns">
        {queue.length === 0 && <div className="empty-state">No vehicles in the queue yet. New bookings appear here instantly.</div>}
        {queue.map((item, index) => <div className={`queue-ticket ${index === 0 ? "now-serving" : ""}`} key={item.tokenId}><span className="queue-position">{String(index + 1).padStart(2, "0")}</span><strong>{item.tokenNumber}</strong><span>{item.status.replaceAll("_", " ")}</span><b>Counter {item.assignedCounter || "TBD"}</b><small>{item.estimatedWaitMinutes === 0 ? "Now serving" : `~${item.estimatedWaitMinutes} min`}</small></div>)}
      </div>
      <p className="queue-footnote"><Radio size={14} /> Updates are broadcast to every mandi display and farmer device.</p>
    </section>
  );
}
