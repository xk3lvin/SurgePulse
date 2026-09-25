import React from 'react';
import { 
  AlertTriangle, 
  Train, 
  Car, 
  Clock, 
  Navigation, 
  ShieldAlert, 
  Flame, 
  Users,
  Compass,
  ArrowRight
} from 'lucide-react';
import { TravelIncident, HotspotZone } from '../types';

interface IncidentsFeedProps {
  incidents: TravelIncident[];
  hotspots: HotspotZone[];
  onSelectHotspot: (hotspot: HotspotZone) => void;
  onStartNavigation: (hotspot: HotspotZone) => void;
}

export const IncidentsFeed: React.FC<IncidentsFeedProps> = ({
  incidents,
  hotspots,
  onSelectHotspot,
  onStartNavigation,
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Live Disruptions & Demand Spikes</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">MRT faults & dispersals driving passenger demand</p>
          </div>
        </div>

        <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
          {incidents.length} Active Events
        </span>
      </div>

      <div className="space-y-3">
        {incidents.map((incident) => {
          const associatedZone = hotspots.find((h) => h.id === incident.affectedHotspotId);

          return (
            <div
              key={incident.id}
              className={`p-3.5 sm:p-4 rounded-xl border transition-all ${
                incident.severity === 'critical'
                  ? 'bg-red-50 dark:bg-red-950/20 border-red-300 dark:border-red-500/40'
                  : 'bg-slate-50 dark:bg-slate-950/70 border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-mono font-black uppercase px-2 py-0.5 rounded-full ${
                      incident.severity === 'critical'
                        ? 'bg-red-500 text-white animate-pulse'
                        : 'bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    {incident.severity}
                  </span>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">{incident.title}</h4>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-mono">
                  <Clock className="w-3.5 h-3.5" />
                  {incident.timestamp}
                </div>
              </div>

              <p className="text-xs text-slate-700 dark:text-slate-300 mb-2.5">
                {incident.description}
              </p>

              {/* Surge Impact Tag & Location */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200 dark:border-slate-800/80">
                <div className="text-xs">
                  <span className="text-slate-500 dark:text-slate-400">Demand Catalyst: </span>
                  <strong className="text-amber-600 dark:text-amber-400">{incident.surgeImpact}</strong>
                </div>

                {associatedZone && (
                  <button
                    onClick={() => {
                      onSelectHotspot(associatedZone);
                      onStartNavigation(associatedZone);
                    }}
                    className="flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400 hover:text-amber-500 transition-colors cursor-pointer"
                  >
                    Position to {associatedZone.name} ({associatedZone.surgeMultiplier}x)
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
