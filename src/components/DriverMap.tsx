import React, { useState } from 'react';
import { 
  CloudRain, 
  Users, 
  AlertTriangle, 
  Plane, 
  MapPin, 
  Navigation, 
  TrendingUp, 
  Clock, 
  Fuel, 
  Zap, 
  Sparkles,
  Info,
  Car
} from 'lucide-react';
import { HotspotZone, DriverState, TravelIncident } from '../types';
import { calculateDistanceAndDuration } from '../services/mcpEngine';

interface DriverMapProps {
  hotspots: HotspotZone[];
  selectedHotspot: HotspotZone | null;
  onSelectHotspot: (hotspot: HotspotZone) => void;
  driver: DriverState;
  onStartNavigation: (hotspot: HotspotZone) => void;
  incidents: TravelIncident[];
}

export const DriverMap: React.FC<DriverMapProps> = ({
  hotspots,
  selectedHotspot,
  onSelectHotspot,
  driver,
  onStartNavigation,
  incidents,
}) => {
  const [showRainRadar, setShowRainRadar] = useState(true);
  const [showIncidents, setShowIncidents] = useState(true);
  const [filterSurgeMin, setFilterSurgeMin] = useState<number>(1.0);

  const driverCurrentZone = hotspots.find((h) => h.id === driver.currentZoneId) || hotspots[0];
  const navigatingToZone = driver.targetZoneId ? hotspots.find((h) => h.id === driver.targetZoneId) : null;

  const filteredHotspots = hotspots.filter((h) => h.surgeMultiplier >= filterSurgeMin);

  // Helper for color coding surge badge
  const getSurgeColor = (surge: number) => {
    if (surge >= 2.5) return 'from-red-500 to-rose-600 text-white shadow-red-500/50';
    if (surge >= 2.0) return 'from-amber-500 to-orange-600 text-slate-950 shadow-amber-500/40';
    if (surge >= 1.6) return 'from-yellow-400 to-amber-500 text-slate-950 shadow-yellow-500/30';
    return 'from-emerald-400 to-teal-500 text-slate-950 shadow-emerald-500/20';
  };

  return (
    <div className="relative w-full h-[620px] lg:h-[720px] bg-slate-950 rounded-2xl border border-slate-300 dark:border-slate-800 overflow-hidden shadow-2xl flex flex-col">
      {/* Map Control Bar */}
      <div className="absolute top-3 left-3 right-3 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        
        {/* Layer Toggles */}
        <div className="flex items-center gap-1.5 bg-white/95 dark:bg-slate-900/90 backdrop-blur-md p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-lg pointer-events-auto text-xs">
          <button
            onClick={() => setShowRainRadar(!showRainRadar)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
              showRainRadar
                ? 'bg-sky-500/20 text-sky-700 dark:text-sky-400 border border-sky-500/40 font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <CloudRain className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Rain Radar</span>
          </button>

          <button
            onClick={() => setShowIncidents(!showIncidents)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
              showIncidents
                ? 'bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/40 font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Incidents</span>
          </button>

          <div className="h-4 w-px bg-slate-300 dark:bg-slate-800 mx-1" />

          {/* Surge filter pills */}
          <div className="flex items-center gap-1">
            {[1.0, 1.8, 2.3].map((val) => (
              <button
                key={val}
                onClick={() => setFilterSurgeMin(val)}
                className={`px-2 py-0.5 rounded text-[11px] font-mono font-medium transition-all cursor-pointer ${
                  filterSurgeMin === val
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 bg-slate-200/80 dark:bg-slate-800/60'
                }`}
              >
                {val === 1.0 ? 'All' : `≥${val}x`}
              </button>
            ))}
          </div>
        </div>

        {/* Live Status indicator */}
        <div className="bg-white/95 dark:bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-lg pointer-events-auto flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-mono text-slate-700 dark:text-slate-300">
            Scanning: <strong className="text-amber-600 dark:text-amber-400 font-semibold">{filteredHotspots.length} Zones</strong>
          </span>
        </div>

      </div>

      {/* SVG Canvas Map Area */}
      <div className="relative w-full flex-1 bg-slate-950 overflow-hidden select-none">
        
        {/* Radar Circular Grid Background */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="radarSweepGradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.12" />
              <stop offset="60%" stopColor="#06b6d4" stopOpacity="0.04" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
            </radialGradient>
            
            <linearGradient id="roadGlow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#818cf8" stopOpacity="0.2" />
            </linearGradient>

            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Grid lines */}
          <g stroke="rgba(51, 65, 85, 0.25)" strokeWidth="0.8" strokeDasharray="3,6">
            <line x1="20%" y1="0%" x2="20%" y2="100%" />
            <line x1="40%" y1="0%" x2="40%" y2="100%" />
            <line x1="60%" y1="0%" x2="60%" y2="100%" />
            <line x1="80%" y1="0%" x2="80%" y2="100%" />
            <line x1="0%" y1="25%" x2="100%" y2="25%" />
            <line x1="0%" y1="50%" x2="100%" y2="50%" />
            <line x1="0%" y1="75%" x2="100%" y2="75%" />
          </g>

          {/* Radar range rings */}
          <circle cx="55%" cy="55%" r="140" fill="none" stroke="rgba(56, 189, 248, 0.15)" strokeWidth="1" strokeDasharray="4,6" />
          <circle cx="55%" cy="55%" r="240" fill="none" stroke="rgba(56, 189, 248, 0.1)" strokeWidth="1" />
          <circle cx="55%" cy="55%" r="360" fill="none" stroke="rgba(56, 189, 248, 0.05)" strokeWidth="1" />

          {/* Radar Sweep Rotating Beam */}
          <g className="radar-sweep-animation" style={{ transformOrigin: '55% 55%' }}>
            <path
              d="M 55% 55% L 55% 0% A 400 400 0 0 1 95% 45% Z"
              fill="url(#radarSweepGradient)"
            />
          </g>

          {/* Stylized Island Landmass Outline (Singapore Silhouette) */}
          <path
            d="M 12% 48% Q 18% 30%, 35% 20% Q 55% 15%, 72% 28% Q 94% 35%, 96% 48% Q 92% 62%, 78% 66% Q 65% 76%, 50% 74% Q 38% 85%, 26% 75% Q 10% 64%, 12% 48% Z"
            fill="rgba(15, 23, 42, 0.85)"
            stroke="rgba(71, 85, 105, 0.4)"
            strokeWidth="1.5"
          />

          {/* Southern Islands (Sentosa) */}
          <ellipse cx="46%" cy="82%" rx="5%" ry="2.5%" fill="rgba(15, 23, 42, 0.85)" stroke="rgba(71, 85, 105, 0.4)" strokeWidth="1.5" />

          {/* Expressways (PIE, CTE, ECP, AYE) */}
          <path
            d="M 18% 52% Q 40% 50%, 65% 51% T 92% 46%"
            fill="none"
            stroke="url(#roadGlow)"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d="M 54% 22% Q 53% 45%, 52% 68%"
            fill="none"
            stroke="url(#roadGlow)"
            strokeWidth="2"
            strokeDasharray="6,4"
          />
          <path
            d="M 52% 68% Q 70% 66%, 90% 48%"
            fill="none"
            stroke="url(#roadGlow)"
            strokeWidth="2"
          />

          {/* Rain Radar Doppler Clouds */}
          {showRainRadar && (
            <g>
              {/* Storm Cell 1: Central / Marina Bay & Kallang */}
              <path
                d="M 45% 50% Q 65% 42%, 70% 62% Q 62% 78%, 46% 74% Q 40% 60%, 45% 50% Z"
                fill="rgba(14, 165, 233, 0.18)"
                stroke="rgba(56, 189, 248, 0.4)"
                strokeWidth="1.5"
                strokeDasharray="4,4"
                className="animate-pulse"
              />
              <text x="56%" y="48%" fill="#38bdf8" fontSize="10" fontFamily="monospace" opacity="0.8">
                🌧️ HEAVY CELL 45mm/h
              </text>

              {/* Storm Cell 2: South & Sentosa */}
              <ellipse
                cx="48%"
                cy="80%"
                rx="8%"
                ry="5%"
                fill="rgba(59, 130, 246, 0.16)"
                stroke="rgba(96, 165, 250, 0.35)"
                strokeWidth="1"
              />
            </g>
          )}

          {/* Navigation Route Path (if driver has target) */}
          {navigatingToZone && (
            <g>
              <line
                x1={`${driverCurrentZone.coordinates.x}%`}
                y1={`${driverCurrentZone.coordinates.y}%`}
                x2={`${navigatingToZone.coordinates.x}%`}
                y2={`${navigatingToZone.coordinates.y}%`}
                stroke="#38bdf8"
                strokeWidth="3"
                strokeDasharray="6,6"
                strokeLinecap="round"
                className="animate-pulse"
              />
              <circle
                cx={`${(driverCurrentZone.coordinates.x + navigatingToZone.coordinates.x) / 2}%`}
                cy={`${(driverCurrentZone.coordinates.y + navigatingToZone.coordinates.y) / 2}%`}
                r="4"
                fill="#38bdf8"
              />
            </g>
          )}
        </svg>

        {/* Hotspot Markers */}
        {filteredHotspots.map((hotspot) => {
          const isSelected = selectedHotspot?.id === hotspot.id;
          const isDriverHere = driverCurrentZone.id === hotspot.id;
          const isTarget = driver.targetZoneId === hotspot.id;

          const { distanceKm, durationMins } = calculateDistanceAndDuration(
            driverCurrentZone.coordinates,
            hotspot.coordinates
          );

          return (
            <div
              key={hotspot.id}
              onClick={() => onSelectHotspot(hotspot)}
              style={{
                left: `${hotspot.coordinates.x}%`,
                top: `${hotspot.coordinates.y}%`,
              }}
              className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group z-10"
            >
              {/* Outer Pulsing Wave for Critical Surge (>2.4x) */}
              {hotspot.surgeMultiplier >= 2.4 && (
                <div className="absolute -inset-4 rounded-full bg-red-500/20 pulse-ring-animation pointer-events-none" />
              )}

              {/* Hotspot Pin Badge */}
              <div
                className={`relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-full font-bold text-xs shadow-xl transition-all duration-300 transform group-hover:scale-110 ${
                  isSelected
                    ? 'ring-4 ring-amber-400 ring-offset-2 ring-offset-slate-950 scale-110 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black'
                    : `bg-gradient-to-r ${getSurgeColor(hotspot.surgeMultiplier)}`
                }`}
              >
                {hotspot.category === 'weather_surge' && <CloudRain className="w-3.5 h-3.5" />}
                {hotspot.category === 'event_crowd' && <Users className="w-3.5 h-3.5" />}
                {hotspot.category === 'transit_breakdown' && <AlertTriangle className="w-3.5 h-3.5" />}
                {hotspot.category === 'airport' && <Plane className="w-3.5 h-3.5" />}
                {hotspot.category === 'nightlife' && <Sparkles className="w-3.5 h-3.5" />}
                {hotspot.category === 'commercial' && <Zap className="w-3.5 h-3.5" />}

                <span className="font-mono tracking-tight">{hotspot.surgeMultiplier}x</span>
              </div>

              {/* Name Tag Pill */}
              <div
                className={`absolute top-full left-1/2 -translate-x-1/2 mt-1 px-2 py-0.5 rounded-md text-[10px] font-medium whitespace-nowrap backdrop-blur-md transition-all ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 font-bold shadow'
                    : 'bg-slate-900/90 text-slate-300 border border-slate-800'
                }`}
              >
                {hotspot.name}
              </div>

              {/* Rain indicator droplet badge */}
              {hotspot.rainfallMm > 20 && (
                <span className="absolute -top-2 -right-1 flex h-4 w-4 rounded-full bg-sky-500 text-[9px] items-center justify-center font-bold text-white shadow">
                  🌧️
                </span>
              )}
            </div>
          );
        })}

        {/* Current Driver Marker */}
        <div
          style={{
            left: `${driverCurrentZone.coordinates.x}%`,
            top: `${driverCurrentZone.coordinates.y}%`,
          }}
          className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none z-30"
        >
          <div className="relative flex items-center justify-center">
            <span className="absolute w-8 h-8 rounded-full bg-emerald-500/30 animate-ping" />
            <div className="relative w-8 h-8 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shadow-lg shadow-emerald-500/50 border-2 border-white">
              <Car className="w-4 h-4 fill-slate-950" />
            </div>
            <span className="absolute -top-5 bg-emerald-500 text-slate-950 font-black text-[9px] px-1.5 py-0.5 rounded uppercase tracking-wider font-mono shadow">
              YOU
            </span>
          </div>
        </div>

        {/* Selected Hotspot Floating Inspector Card (Bottom of Map) */}
        {selectedHotspot && (
          <div className="absolute bottom-3 left-3 right-3 sm:left-auto sm:right-3 sm:w-96 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-4 rounded-2xl border border-slate-300 dark:border-slate-700/80 shadow-2xl animate-in fade-in slide-in-from-bottom-4">
            
            {/* Top row */}
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-400 font-mono font-medium border border-amber-500/30">
                    {selectedHotspot.category.replace('_', ' ').toUpperCase()}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">{selectedHotspot.district}</span>
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                  {selectedHotspot.name}
                </h3>
              </div>

              <div className="text-right">
                <div className="text-xl font-black text-amber-600 dark:text-amber-400 font-mono">
                  {selectedHotspot.surgeMultiplier}x
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  Est. ${selectedHotspot.estimatedFare}
                </div>
              </div>
            </div>

            {/* Catalyst Reason */}
            <p className="text-xs text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-950/60 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800/80 mb-3">
              <span className="font-semibold text-amber-600 dark:text-amber-300">Opportunity: </span>
              {selectedHotspot.reason}
            </p>

            {/* Metrics grid */}
            {(() => {
              const { distanceKm, durationMins } = calculateDistanceAndDuration(
                driverCurrentZone.coordinates,
                selectedHotspot.coordinates
              );
              return (
                <div className="grid grid-cols-3 gap-2 mb-3 text-center">
                  <div className="bg-slate-100 dark:bg-slate-950/50 p-2 rounded-xl border border-slate-200 dark:border-slate-800">
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1">
                      <Clock className="w-3 h-3 text-sky-600 dark:text-sky-400" />
                      Drive Time
                    </div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white font-mono mt-0.5">
                      {durationMins} min ({distanceKm}km)
                    </div>
                  </div>

                  <div className="bg-slate-100 dark:bg-slate-950/50 p-2 rounded-xl border border-slate-200 dark:border-slate-800">
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1">
                      <Users className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                      Wait Line
                    </div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white font-mono mt-0.5">
                      {selectedHotspot.passengerCount} pax
                    </div>
                  </div>

                  <div className="bg-slate-100 dark:bg-slate-950/50 p-2 rounded-xl border border-slate-200 dark:border-slate-800">
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1">
                      <TrendingUp className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                      Surge Window
                    </div>
                    <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
                      ~{selectedHotspot.surgeDecayMinutes} min
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Dispatch / Navigate Button */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => onStartNavigation(selectedHotspot)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold text-xs transition-all shadow-lg cursor-pointer ${
                  driver.targetZoneId === selectedHotspot.id
                    ? 'bg-sky-500 hover:bg-sky-400 text-slate-950 shadow-sky-500/30'
                    : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/30'
                }`}
              >
                <Navigation className="w-4 h-4 fill-slate-950" />
                {driver.targetZoneId === selectedHotspot.id ? 'Currently Navigating Here' : 'Position / Navigate Here'}
              </button>
            </div>

          </div>
        )}

      </div>

      {/* Quick Legend at bottom */}
      <div className="bg-slate-100 dark:bg-slate-900/90 border-t border-slate-200 dark:border-slate-800 px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-400">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
            <span>Critical Surge (&ge;2.5x)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span>High Surge (2.0x - 2.4x)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
            <span>Torrential Rain Cells</span>
          </div>
        </div>
        <div className="text-[11px] font-mono text-slate-500 dark:text-slate-500">
          Click any zone pin to calculate travel duration & ROI
        </div>
      </div>
    </div>
  );
};
