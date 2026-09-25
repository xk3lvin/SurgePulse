import React from 'react';
import { 
  CloudRain, 
  CloudLightning, 
  Cloud, 
  CloudDrizzle, 
  TrendingUp, 
  AlertTriangle, 
  ShieldAlert, 
  Zap, 
  Compass, 
  Sparkles,
  Droplets
} from 'lucide-react';
import { WeatherZoneRadar, HotspotZone } from '../types';

interface WeatherRadarPanelProps {
  weatherZones: WeatherZoneRadar[];
  hotspots: HotspotZone[];
  onTriggerStormSimulation: () => void;
  onSelectHotspot: (hotspot: HotspotZone) => void;
}

export const WeatherRadarPanel: React.FC<WeatherRadarPanelProps> = ({
  weatherZones,
  hotspots,
  onTriggerStormSimulation,
  onSelectHotspot,
}) => {
  // Find hotspots experiencing heavy rain
  const rainSurgeHotspots = hotspots.filter(
    (h) => h.weatherCondition === 'heavy_rain' || h.weatherCondition === 'thunderstorm'
  );

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-sky-950/60 via-slate-900 to-slate-900 border border-sky-900/40 rounded-2xl p-4 sm:p-6 shadow-xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-sky-400 font-mono uppercase tracking-wider mb-1">
              <CloudRain className="w-4 h-4" />
              Doppler Rain Radar • Bad Weather Multiplier
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Precipitation & Rain-Surge Correlation
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
              Tropical rainstorms trigger immediate +40% to +85% surges on PHV/taxi platforms as commuters avoid walking and outdoor bus stops. Position 10 minutes ahead of approaching rain bands.
            </p>
          </div>

          <button
            onClick={onTriggerStormSimulation}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-slate-950 font-bold text-xs shadow-lg shadow-sky-500/20 cursor-pointer transition-all"
          >
            <CloudLightning className="w-4 h-4 fill-slate-950" />
            Simulate Torrential Squall
          </button>
        </div>
      </div>

      {/* Weather Stations Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {weatherZones.map((zone) => {
          const isHeavy = zone.rainfallRateMmPerHour > 25;

          return (
            <div
              key={zone.id}
              className={`bg-slate-900/90 rounded-2xl border p-4 shadow-lg transition-all ${
                isHeavy
                  ? 'border-sky-500/40 bg-gradient-to-br from-sky-500/10 via-slate-900 to-slate-900'
                  : 'border-slate-800'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-xl ${isHeavy ? 'bg-sky-500/20 text-sky-400 animate-pulse' : 'bg-slate-800 text-slate-300'}`}>
                    {isHeavy ? <CloudLightning className="w-5 h-5" /> : <CloudRain className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{zone.name}</h3>
                    <div className="text-xs text-sky-400 font-medium">{zone.status}</div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    +{Math.round((zone.surgeMultiplierImpact - 1.0) * 100)}% Surge
                  </div>
                </div>
              </div>

              {/* Rain gauge bar */}
              <div className="space-y-1 mb-3">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-400">Precipitation Rate:</span>
                  <span className="text-white font-bold">{zone.rainfallRateMmPerHour} mm/hr</span>
                </div>
                <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      zone.rainfallRateMmPerHour > 30
                        ? 'bg-gradient-to-r from-sky-400 to-blue-500'
                        : 'bg-sky-600'
                    }`}
                    style={{ width: `${Math.min(100, (zone.rainfallRateMmPerHour / 50) * 100)}%` }}
                  />
                </div>
              </div>

              <div className="text-xs text-slate-300 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                <span className="text-slate-400 font-medium">Radar Forecast: </span>
                {zone.forecastNextHour}
              </div>
            </div>
          );
        })}
      </div>

      {/* Correlation Insight Box */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
          <Droplets className="w-4 h-4 text-sky-400" />
          Rainfall-to-Surge Economics Matrix
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-center">
          <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
            <div className="text-xs font-mono text-slate-400">0 - 5 mm (Clear/Cloudy)</div>
            <div className="text-lg font-bold text-slate-300 font-mono mt-1">1.0x - 1.2x</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Normal baseline demand</div>
          </div>

          <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
            <div className="text-xs font-mono text-slate-400">6 - 15 mm (Light Drizzle)</div>
            <div className="text-lg font-bold text-amber-400 font-mono mt-1">1.3x - 1.6x</div>
            <div className="text-[11px] text-slate-500 mt-0.5">+25% booking frequency</div>
          </div>

          <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800">
            <div className="text-xs font-mono text-slate-400">16 - 30 mm (Steady Rain)</div>
            <div className="text-lg font-bold text-orange-400 font-mono mt-1">1.8x - 2.2x</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Severe sheltered queueing</div>
          </div>

          <div className="bg-slate-950/70 p-3 rounded-xl border border-sky-500/30 bg-sky-500/5">
            <div className="text-xs font-mono text-sky-400">30+ mm (Torrential Storm)</div>
            <div className="text-lg font-bold text-red-400 font-mono mt-1">2.4x - 2.9x</div>
            <div className="text-[11px] text-sky-300 mt-0.5">Peak island-wide price surge</div>
          </div>
        </div>
      </div>

      {/* Active Rain-Impacted Hotspots */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-400" />
          Active Zones Experiencing Storm Surges Right Now ({rainSurgeHotspots.length})
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {rainSurgeHotspots.map((h) => (
            <div
              key={h.id}
              onClick={() => onSelectHotspot(h)}
              className="bg-slate-900 border border-slate-800 hover:border-amber-500/50 rounded-xl p-3.5 cursor-pointer transition-all flex items-center justify-between"
            >
              <div>
                <h4 className="text-sm font-bold text-white">{h.name}</h4>
                <div className="text-xs text-sky-400 flex items-center gap-1 mt-0.5">
                  <CloudRain className="w-3 h-3" />
                  {h.rainfallMm} mm/h • {h.passengerCount} commuters waiting
                </div>
              </div>

              <div className="text-right">
                <span className="text-base font-black text-amber-400 font-mono">
                  {h.surgeMultiplier}x
                </span>
                <div className="text-[10px] text-slate-400 font-mono">
                  ${h.estimatedFare}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
