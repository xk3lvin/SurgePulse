import React, { useState } from 'react';
import { 
  CloudRain, 
  Users, 
  AlertTriangle, 
  Plane, 
  Navigation, 
  TrendingUp, 
  Clock, 
  Search, 
  Filter,
  DollarSign,
  Sparkles,
  Zap,
  ArrowUpDown
} from 'lucide-react';
import { HotspotZone, DemandCategory, DriverState } from '../types';
import { calculateDistanceAndDuration } from '../services/mcpEngine';

interface SurgeCardListProps {
  hotspots: HotspotZone[];
  selectedHotspot: HotspotZone | null;
  onSelectHotspot: (hotspot: HotspotZone) => void;
  driver: DriverState;
  onStartNavigation: (hotspot: HotspotZone) => void;
}

export const SurgeCardList: React.FC<SurgeCardListProps> = ({
  hotspots,
  selectedHotspot,
  onSelectHotspot,
  driver,
  onStartNavigation,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<DemandCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'surge' | 'travel_time' | 'fare' | 'passengers'>('surge');

  const driverCurrentZone = hotspots.find((h) => h.id === driver.currentZoneId) || hotspots[0];

  // Filtering
  let filtered = hotspots.filter((h) => {
    if (selectedCategory !== 'all' && h.category !== selectedCategory) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        h.name.toLowerCase().includes(q) ||
        h.district.toLowerCase().includes(q) ||
        h.reason.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Sorting
  filtered.sort((a, b) => {
    if (sortBy === 'surge') return b.surgeMultiplier - a.surgeMultiplier;
    if (sortBy === 'fare') return b.estimatedFare - a.estimatedFare;
    if (sortBy === 'passengers') return b.passengerCount - a.passengerCount;
    if (sortBy === 'travel_time') {
      const distA = calculateDistanceAndDuration(driverCurrentZone.coordinates, a.coordinates).durationMins;
      const distB = calculateDistanceAndDuration(driverCurrentZone.coordinates, b.coordinates).durationMins;
      return distA - distB;
    }
    return 0;
  });

  return (
    <div className="space-y-4">
      
      {/* Search and Category Filters */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-3">
        
        {/* Top filter row: Search bar & Sort dropdown */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by zone, stadium, mall, district, or event..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs text-slate-400 font-medium">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
            >
              <option value="surge">Highest Surge (x)</option>
              <option value="travel_time">Fastest Travel Time</option>
              <option value="fare">Highest Estimated Fare</option>
              <option value="passengers">Most Commuters Waiting</option>
            </select>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {[
            { id: 'all', label: 'All Hotspots', icon: Sparkles },
            { id: 'weather_surge', label: '🌧️ Bad Weather', icon: CloudRain },
            { id: 'event_crowd', label: '🏟️ Event Crowds', icon: Users },
            { id: 'transit_breakdown', label: '🚆 Transit Disruption', icon: AlertTriangle },
            { id: 'airport', label: '✈️ Airport Waves', icon: Plane },
            { id: 'nightlife', label: '🍸 Nightlife', icon: Sparkles },
            { id: 'commercial', label: '🛍️ Commercial', icon: Zap },
          ].map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id as any)}
                className={`whitespace-nowrap px-3 py-1.5 rounded-xl font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 font-bold shadow'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

      </div>

      {/* Grid of Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((hotspot) => {
          const isSelected = selectedHotspot?.id === hotspot.id;
          const isTarget = driver.targetZoneId === hotspot.id;
          const { distanceKm, durationMins } = calculateDistanceAndDuration(
            driverCurrentZone.coordinates,
            hotspot.coordinates
          );

          return (
            <div
              key={hotspot.id}
              className={`bg-slate-900/90 rounded-2xl border transition-all p-4 shadow-lg hover:border-slate-700 flex flex-col justify-between ${
                isSelected
                  ? 'border-amber-500 ring-2 ring-amber-500/20'
                  : 'border-slate-800'
              }`}
            >
              <div>
                {/* Header row */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] px-2 py-0.5 rounded font-mono font-semibold bg-slate-800 text-slate-300">
                        {hotspot.shortCode}
                      </span>
                      <span className="text-xs text-slate-400">{hotspot.district}</span>
                    </div>
                    <h3 className="text-base font-bold text-white mt-1 hover:text-amber-400 cursor-pointer transition-colors"
                        onClick={() => onSelectHotspot(hotspot)}>
                      {hotspot.name}
                    </h3>
                  </div>

                  <div className="text-right">
                    <span className="inline-block px-2.5 py-1 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-sm font-mono shadow">
                      {hotspot.surgeMultiplier}x
                    </span>
                    <div className="text-[11px] text-emerald-400 font-bold font-mono mt-0.5">
                      ~${hotspot.estimatedFare} fare
                    </div>
                  </div>
                </div>

                {/* Reason description */}
                <p className="text-xs text-slate-300 bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80 mb-3">
                  {hotspot.reason}
                </p>

                {/* Weather / Rain Alert if active */}
                {hotspot.rainfallMm > 15 && (
                  <div className="flex items-center gap-2 mb-3 bg-sky-500/10 border border-sky-500/20 rounded-xl px-2.5 py-1.5 text-xs text-sky-300">
                    <CloudRain className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
                    <span>Rainfall: <strong>{hotspot.rainfallMm} mm/h</strong> — Severe passenger rush</span>
                  </div>
                )}

                {/* Key indicators */}
                <div className="grid grid-cols-3 gap-2 mb-3 text-center">
                  <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800">
                    <div className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
                      <Clock className="w-3 h-3 text-sky-400" />
                      Travel
                    </div>
                    <div className="text-xs font-bold text-white font-mono mt-0.5">
                      {durationMins} min ({distanceKm}km)
                    </div>
                  </div>

                  <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800">
                    <div className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
                      <Users className="w-3 h-3 text-purple-400" />
                      Queuing
                    </div>
                    <div className="text-xs font-bold text-white font-mono mt-0.5">
                      {hotspot.passengerCount} pax
                    </div>
                  </div>

                  <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800">
                    <div className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
                      <TrendingUp className="w-3 h-3 text-emerald-400" />
                      Surge Decay
                    </div>
                    <div className="text-xs font-bold text-emerald-400 font-mono mt-0.5">
                      ~{hotspot.surgeDecayMinutes} min
                    </div>
                  </div>
                </div>

                {/* Platform Surge Breakdown */}
                <div className="flex items-center justify-between bg-slate-950/50 p-2 rounded-xl border border-slate-800/80 mb-3 text-[11px] font-mono">
                  <span className="text-slate-400">Grab: <strong className="text-amber-400">{hotspot.platformSurges.grab}x</strong></span>
                  <span className="text-slate-400">Gojek: <strong className="text-emerald-400">{hotspot.platformSurges.gojek}x</strong></span>
                  <span className="text-slate-400">CDG: <strong className="text-blue-400">{hotspot.platformSurges.comfort}x</strong></span>
                  <span className="text-slate-400">Tada: <strong className="text-yellow-400">{hotspot.platformSurges.tada}x</strong></span>
                </div>
              </div>

              {/* Actions row */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                <button
                  onClick={() => onStartNavigation(hotspot)}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    isTarget
                      ? 'bg-sky-500 text-slate-950 font-black'
                      : 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold'
                  }`}
                >
                  <Navigation className="w-3.5 h-3.5 fill-slate-950" />
                  {isTarget ? 'Currently En Route' : 'Position Here'}
                </button>

                <button
                  onClick={() => onSelectHotspot(hotspot)}
                  className="py-2 px-3 rounded-xl text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 transition-all cursor-pointer"
                >
                  View on Map
                </button>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};
