import { CloudOff, CloudUpload, Wifi } from "lucide-react";
import { useEffect, useState } from "react";
import { syncOfflineBookings } from "./api";

export function OfflineStatus({ onNotice }: { onNotice: (message: string) => void }) {
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => { const up = async () => { setOnline(true); const synced = await syncOfflineBookings(); onNotice(synced ? `${synced} offline booking action${synced === 1 ? "" : "s"} synced.` : "Connection restored. Offline actions are synced."); }; const down = () => { setOnline(false); onNotice("Offline mode active. New booking actions will sync when you reconnect."); }; window.addEventListener("online", up); window.addEventListener("offline", down); return () => { window.removeEventListener("online", up); window.removeEventListener("offline", down); }; }, [onNotice]);
  return <span className={`network-status ${online ? "online" : "offline"}`}>{online ? <Wifi size={14} /> : <CloudOff size={14} />}{online ? "Network online" : "Offline queue mode"}{!online && <CloudUpload size={13} />}</span>;
}
