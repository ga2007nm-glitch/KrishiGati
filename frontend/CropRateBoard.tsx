import { useState } from "react";
import { Apple, Carrot, IndianRupee, Sprout } from "lucide-react";
import type { CropPrice } from "./api";

type Props = { crops: Record<string, CropPrice> };

export function CropRateBoard({ crops }: Props) {
  const categoryIcon = (category: string) => category === "Fruits" ? <Apple size={16} /> : category === "Vegetables" ? <Carrot size={16} /> : <Sprout size={16} />;
  const [category, setCategory] = useState("All");
  const categories = [{ name: "All", icon: <Sprout size={14} /> }, { name: "Grains", icon: <Sprout size={14} /> }, { name: "Pulses", icon: <Sprout size={14} /> }, { name: "Oilseeds", icon: <Sprout size={14} /> }, { name: "Vegetables", icon: <Carrot size={14} /> }, { name: "Fruits", icon: <Apple size={14} /> }];
  const visibleCrops = Object.entries(crops).filter(([, rate]) => category === "All" || rate.category === category);
  return <section className="panel crop-rate-panel"><div className="section-heading"><div><p className="eyebrow">Transparent procurement rates</p><h2>What your crop is worth</h2></div><span className="rate-source"><span /> MSP board · live demo</span></div><div className="rate-category-tabs">{categories.map((item) => <button className={category === item.name ? "active" : ""} key={item.name} onClick={() => setCategory(item.name)}>{item.icon} {item.name}</button>)}</div><div className="crop-rate-grid">{visibleCrops.map(([crop, rate]) => <article className="crop-rate-card" key={crop}><div className="crop-rate-top"><h3>{crop}</h3>{categoryIcon(rate.category)} </div><div className="crop-category">{rate.category}</div><div className="crop-msp"><IndianRupee size={15} /><strong>{rate.mspPerKg.toFixed(2)}</strong><span>/ kg MSP</span></div><div className="crop-rate-meta"><span>Market ₹{rate.marketPerKg.toFixed(2)}</span><small>{rate.season}</small></div></article>)}</div><p className="rate-note">Final DBT is calculated from accepted weighbridge weight × declared MSP. The rate board keeps the calculation visible to farmers.</p></section>;
}
