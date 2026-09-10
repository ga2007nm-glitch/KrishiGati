import React, { useEffect, useState } from "react";
import { 
  MapPin, 
  CheckCircle2, 
  Clock, 
  Scale, 
  CreditCard, 
  QrCode, 
  ChevronRight, 
  AlertCircle 
} from "lucide-react";

export default function KrishiGatiDashboard() {
  const [lang, setLang] = useState("EN");
  const [mandis, setMandis] = useState([]);
  const [isLoadingMandis, setIsLoadingMandis] = useState(true);
  const [mandiError, setMandiError] = useState("");

  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
    const fallbackLocation = { latitude: 13.1007, longitude: 77.5963 };

    const loadMandis = async (location) => {
      const params = new URLSearchParams({
        lat: location.latitude.toString(),
        lng: location.longitude.toString(),
      });
      const response = await fetch(`${apiUrl}/api/mandis/nearest?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to load nearby mandis.");
      }

      setMandis(data.mandis);
    };

    const loadWithLocation = () => {
      if (!navigator.geolocation) {
        return loadMandis(fallbackLocation);
      }

      return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          async ({ coords }) => {
            try {
              await loadMandis({
                latitude: coords.latitude,
                longitude: coords.longitude,
              });
            } catch (error) {
              setMandiError(error.message);
            } finally {
              resolve();
            }
          },
          async () => {
            try {
              await loadMandis(fallbackLocation);
            } catch (error) {
              setMandiError(error.message);
            } finally {
              resolve();
            }
          }
        );
      });
    };

    loadWithLocation()
      .catch((error) => setMandiError(error.message))
      .finally(() => setIsLoadingMandis(false));
  }, []);

  const statusColors = {
    "LOW WAIT": "bg-emerald-100 text-emerald-800 border-emerald-300",
    "MED WAIT": "bg-amber-100 text-amber-800 border-amber-300",
    "HIGH WAIT": "bg-rose-100 text-rose-800 border-rose-300",
  };

  return (
    <div className="min-h-screen bg-slate-900 flex justify-center items-center p-4 font-sans">
      {/* Mobile Screen Container */}
      <div className="w-full max-w-md bg-slate-50 min-h-[840px] rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        
        {/* Top Navbar */}
        <div className="bg-white px-5 py-4 flex justify-between items-center border-b border-slate-100 sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-lg">
              🌱
            </div>
            <div>
              <h1 className="font-bold text-slate-800 text-lg leading-tight">KrishiGati</h1>
              <p className="text-[10px] text-slate-500 font-medium tracking-wide uppercase">Smart Mandi Portal</p>
            </div>
          </div>

          {/* Language Toggle */}
          <button 
            onClick={() => setLang(lang === "EN" ? "HI" : "EN")}
            className="flex items-center bg-slate-100 px-3 py-1.5 rounded-full text-xs font-semibold text-slate-700 hover:bg-slate-200 transition"
          >
            <span>{lang === "EN" ? "English" : "हिंदी"}</span>
            <span className="ml-1.5 text-[10px] bg-emerald-600 text-white px-1.5 py-0.5 rounded-full">
              {lang === "EN" ? "HI" : "EN"}
            </span>
          </button>
        </div>

        {/* Scrollable Dashboard Body */}
        <div className="flex-1 p-4 space-y-5 overflow-y-auto">

          {/* Active Token Hero Card */}
          <div className="bg-gradient-to-br from-emerald-800 to-emerald-950 text-white p-5 rounded-2xl shadow-lg relative overflow-hidden">
            <div className="flex justify-between items-start mb-3">
              <span className="bg-emerald-700/60 backdrop-blur-md text-emerald-100 text-xs px-2.5 py-1 rounded-md font-medium border border-emerald-500/30">
                Active Smart Token
              </span>
              <span className="bg-amber-400 text-slate-950 font-bold text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1">
                <Clock className="w-3 h-3" /> Gate Entry Active
              </span>
            </div>

            <div className="my-2">
              <p className="text-emerald-200 text-xs font-medium">Token Number</p>
              <h2 className="text-4xl font-black tracking-tight text-white mt-0.5">#A-214</h2>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-emerald-700/50 text-xs">
              <div>
                <p className="text-emerald-300/80 text-[11px]">Est. Wait Time</p>
                <p className="font-semibold text-white">~25 mins</p>
              </div>
              <div>
                <p className="text-emerald-300/80 text-[11px]">Assigned Counter</p>
                <p className="font-semibold text-white">Gate Counter 02</p>
              </div>
            </div>

            <button className="w-full mt-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition">
              <QrCode className="w-4 h-4" /> View Digital Entry Pass
            </button>
          </div>

          {/* Procurement Progress Tracker */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-slate-800 text-sm">Procurement Status Tracker</h3>
              <span className="text-[11px] text-emerald-600 font-semibold">Step 2 of 5</span>
            </div>

            <div className="flex items-center justify-between relative px-1 py-2">
              {/* Tracker Steps */}
              <div className="flex flex-col items-center gap-1 z-10">
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow">
                  ✓
                </div>
                <span className="text-[10px] font-medium text-slate-700 text-center">Slot<br/>Booked</span>
              </div>

              <div className="flex-1 h-1 bg-emerald-500 -mt-4"></div>

              <div className="flex flex-col items-center gap-1 z-10">
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs ring-4 ring-emerald-100 shadow">
                  2
                </div>
                <span className="text-[10px] font-bold text-emerald-700 text-center">Gate<br/>Verified</span>
              </div>

              <div className="flex-1 h-1 bg-slate-200 -mt-4"></div>

              <div className="flex flex-col items-center gap-1 z-10">
                <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center font-bold text-xs border border-slate-300">
                  <Scale className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-medium text-slate-400 text-center">IoT<br/>Weighing</span>
              </div>

              <div className="flex-1 h-1 bg-slate-200 -mt-4"></div>

              <div className="flex flex-col items-center gap-1 z-10">
                <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center font-bold text-xs border border-slate-300">
                  <CreditCard className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-medium text-slate-400 text-center">DBT<br/>Payout</span>
              </div>
            </div>
          </div>

          {/* Nearest Mandi Finder */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-emerald-600" /> Nearest Procurement Mandis
              </h3>
              <span className="text-xs text-slate-500">Auto-Detected</span>
            </div>

            {isLoadingMandis && (
              <p className="text-sm text-slate-500">Finding nearby procurement centers...</p>
            )}

            {mandiError && (
              <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{mandiError}</span>
              </div>
            )}

            {/* Mandi Cards List */}
            {!isLoadingMandis && !mandiError && mandis.map((mandi) => (
              <div 
                key={mandi.id} 
                className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-sm flex items-center justify-between hover:border-emerald-500/50 transition"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-800 text-sm">{mandi.name}</h4>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md border ${statusColors[mandi.congestionStatus]}`}>
                      {mandi.congestionStatus}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 flex items-center gap-2">
                    <span>📍 {mandi.distanceKm} km away</span>
                    <span>•</span>
                    <span className="text-emerald-700 font-medium">{mandi.freeCapacityPercentage}% Slots Free</span>
                  </p>
                </div>

                <button className="bg-slate-900 hover:bg-emerald-700 text-white px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1 transition shadow-sm">
                  Book <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

        </div>

        {/* Bottom Booking Action Bar */}
        <div className="bg-white p-4 border-t border-slate-200 sticky bottom-0">
          <button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-emerald-600/30 text-sm flex items-center justify-center gap-2 transition">
            <span>Select Crop & Book New Slot</span>
          </button>
        </div>

      </div>
    </div>
  );
}