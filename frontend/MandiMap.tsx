import { MapContainer, Marker, Popup, TileLayer, Circle } from "react-leaflet";
import { Navigation } from "lucide-react";
import "leaflet/dist/leaflet.css";
import type { Mandi } from "./types";

type Props = { mandis: Mandi[]; position: [number, number] };

export function MandiMap({ mandis, position }: Props) {
  return <div className="map-shell"><MapContainer center={position} zoom={11} scrollWheelZoom={false} className="map"><TileLayer attribution='&copy; OpenStreetMap contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" /><Circle center={position} radius={2000} pathOptions={{ color: "#f59e0b", fillColor: "#fbbf24", fillOpacity: 0.08 }} /><Marker position={position}><Popup>You are here</Popup></Marker>{mandis.map((mandi) => <Marker key={mandi.id} position={[mandi.latitude, mandi.longitude]}><Popup><strong>{mandi.name}</strong><br />{mandi.distanceKm} km away · {mandi.freeCapacityPercentage}% free</Popup></Marker>)}</MapContainer><div className="map-overlay"><Navigation size={16} /> 2 km activation radius</div></div>;
}
