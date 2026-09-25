import React from 'react';
import { 
  Navigation, 
  Clock, 
  DollarSign, 
  TrendingUp, 
  Fuel, 
  AlertCircle, 
  CloudRain, 
  CheckCircle2, 
  ShieldCheck,
  ChevronRight,
  Flame,
  Award
} from 'lucide-react';
import { HotspotZone, DriverState, VehicleType, ROIAnalysis } from '../types';

interface RoiCalculatorProps {
  hotspots: HotspotZone[];
  driver: DriverState;
  onChangeDriverZone: (zoneId: string) => void;
  onChangeVehicleType: (vehicle: VehicleType) => void;
  roiList: ROIAnalysis[];
  onSelectHotspot: (hotspot: HotspotZone) => void;
  onStartNavigation: (hotspot: HotspotZone) => void;
}

export const RoiCalculator: React.FC<RoiCalculatorProps> = ({
  hotspots,
  driver,
  onChangeDriverZone,
  onChangeVehicleType,
  roiList,
  onSelectHotspot,
  onStartNavigation,
}) => {
  const topOpportunity = roiList[0];

  return (
    <div className="space-y-6">
      
      {/* Top Banner / Configuration Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900/95 to-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-5 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 font-mono uppercase tracking-wider mb-1">
              <Award className="w-4 h-4" />
              Surge Algorithm • Travel Duration vs Fare ROI
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Business Opportunity & Travel Duration Engine
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
              Highlights areas with top net profit potential based on real-time weather conditions, transit incidents, deadhead travel duration, and surge decay risk.
            </p>
          </div>

          {/* Quick Stats Pill */}
          {topOpportunity && (
            <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3">
              <Flame className="w-6 h-6 text-amber-400 animate-bounce" />
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-mono">Island #1 Top Pick</div>
                <div className="text-sm font-bold text-amber-400">
                  {topOpportunity.hotspot.name}
                </div>
                <div className="text-xs text-slate-300 font-mono">
                  {topOpportunity.hotspot.surgeMultiplier}x Surge • ~${topOpportunity.effectiveHourlyRate}/hr rate
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Inputs row: Driver Origin & Vehicle Type */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-5">
          
          {/* Driver Origin Selector */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Navigation className="w-3.5 h-3.5 text-sky-400" />
                Current Driver Position:
              </span>
              <span className="text-[11px] text-slate-400 font-mono">Simulate location change</span>
            </label>
            <select
              value={driver.currentZoneId}
              onChange={(e) => onChangeDriverZone(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
            >
              {hotspots.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name} ({h.district})
                </option>
              ))}
            </select>
          </div>

          {/* Vehicle Category Selector */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center justify-between">
              <span>Vehicle Fleet Classification:</span>
              <span className="text-[11px] text-slate-400 font-mono">Fare tier adjustment</span>
            </label>
            <div className="grid grid-cols-4 gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-medium">
              {[
                { id: 'standard_4', label: '4-Seater' },
                { id: 'xl_6', label: '6-Seater XL' },
                { id: 'premium', label: 'Exec/Prem' },
                { id: 'taxi', label: 'Meter Taxi' },
              ].map((veh) => (
                <button
                  key={veh.id}
                  onClick={() => onChangeVehicleType(veh.id as VehicleType)}
                  className={`py-1.5 px-2 rounded-lg text-center transition-all ${
                    driver.vehicleType === veh.id
                      ? 'bg-amber-500 text-slate-950 font-bold shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {veh.label}
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* Ranked Opportunity Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-400 font-medium px-1">
          <span>Ranked by ROI Score (Surge Rate + Demand - Travel Deadhead Cost)</span>
          <span className="font-mono text-amber-400">{roiList.length} destinations evaluated</span>
        </div>

        {roiList.map((item, index) => {
          const isSelected = driver.targetZoneId === item.hotspot.id;
          const isTop = index === 0;

          return (
            <div
              key={item.hotspot.id}
              className={`relative bg-slate-900/90 rounded-2xl border transition-all p-4 sm:p-5 shadow-lg hover:border-slate-700 ${
                isTop
                  ? 'border-amber-500/50 bg-gradient-to-r from-amber-500/5 via-slate-900 to-slate-900'
                  : 'border-slate-800'
              }`}
            >
              {/* Ribbon tag for top pick */}
              {isTop && (
                <div className="absolute -top-2.5 left-6 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-md">
                  ★ #1 HIGHEST ROI OPPORTUNITY
                </div>
              )}

              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                
                {/* Left Section: Info & Catalysts */}
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1.5">
                    <span className="font-mono font-bold text-xs text-slate-400">
                      #{index + 1}
                    </span>
                    <h3 className="text-base sm:text-lg font-bold text-white hover:text-amber-400 cursor-pointer transition-colors"
                        onClick={() => onSelectHotspot(item.hotspot)}>
                      {item.hotspot.name}
                    </h3>
                    <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                      {item.hotspot.district}
                    </span>
                    {item.hotspot.weatherCondition === 'heavy_rain' || item.hotspot.weatherCondition === 'thunderstorm' ? (
                      <span className="text-xs px-2 py-0.5 rounded bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center gap-1 font-medium">
                        <CloudRain className="w-3 h-3" />
                        Rain Surge ({item.hotspot.rainfallMm}mm)
                      </span>
                    ) : null}
                  </div>

                  {/* Operational Rationale */}
                  <p className="text-xs sm:text-sm text-slate-300 mb-2">
                    {item.rationale}
                  </p>

                  {/* Platforms breakdown pills */}
                  <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono">
                    <span className="text-slate-400">Live Rates:</span>
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Grab {item.hotspot.platformSurges.grab}x
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-green-500/10 text-green-400 border border-green-500/20">
                      Gojek {item.hotspot.platformSurges.gojek}x
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      Comfort CDG {item.hotspot.platformSurges.comfort}x
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                      Tada {item.hotspot.platformSurges.tada}x
                    </span>
                  </div>
                </div>

                {/* Middle Section: Financial & Travel Duration Breakdown */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-slate-950/70 p-3 rounded-xl border border-slate-800/80 text-center">
                  
                  {/* Travel Duration */}
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase font-mono flex items-center justify-center gap-1">
                      <Clock className="w-3 h-3 text-sky-400" />
                      Travel
                    </div>
                    <div className="text-sm font-bold text-white font-mono mt-0.5">
                      {item.travelDurationMins} min
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      {item.distanceKm} km
                    </div>
                  </div>

                  {/* Surge Multiplier */}
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase font-mono flex items-center justify-center gap-1">
                      <TrendingUp className="w-3 h-3 text-amber-400" />
                      Surge
                    </div>
                    <div className="text-sm font-black text-amber-400 font-mono mt-0.5">
                      {item.hotspot.surgeMultiplier}x
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      ~{item.hotspot.surgeDecayMinutes}m left
                    </div>
                  </div>

                  {/* Net Profit per Trip */}
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase font-mono flex items-center justify-center gap-1">
                      <DollarSign className="w-3 h-3 text-emerald-400" />
                      Net Take
                    </div>
                    <div className="text-sm font-bold text-emerald-400 font-mono mt-0.5">
                      ${item.expectedNetProfit}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      Fuel -${item.fuelCost}
                    </div>
                  </div>

                  {/* Effective Pace ($/hr) */}
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase font-mono flex items-center justify-center gap-1">
                      <Award className="w-3 h-3 text-purple-400" />
                      ROI Score
                    </div>
                    <div className="text-sm font-black text-purple-300 font-mono mt-0.5">
                      {item.roiScore}/100
                    </div>
                    <div className="text-[10px] font-bold text-emerald-400 font-mono">
                      ${item.effectiveHourlyRate}/hr
                    </div>
                  </div>

                </div>

                {/* Right Section: Action Button */}
                <div className="flex lg:flex-col items-center gap-2 min-w-[140px]">
                  <button
                    onClick={() => onStartNavigation(item.hotspot)}
                    className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer ${
                      isSelected
                        ? 'bg-sky-500 hover:bg-sky-400 text-slate-950 font-black'
                        : 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold'
                    }`}
                  >
                    <Navigation className="w-3.5 h-3.5 fill-slate-950" />
                    {isSelected ? 'Navigating' : 'Head Here'}
                  </button>

                  <button
                    onClick={() => onSelectHotspot(item.hotspot)}
                    className="w-full py-1.5 px-3 rounded-xl text-xs font-medium text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 transition-all text-center"
                  >
                    Inspect Map
                  </button>
                </div>

              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
