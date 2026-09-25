import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import { 
  CloudRain, 
  Users, 
  AlertTriangle, 
  Plane, 
  Navigation, 
  TrendingUp, 
  Clock, 
  Zap, 
  Sparkles,
  Layers,
  LocateFixed,
  Car,
  Maximize2
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
  theme?: 'dark' | 'light';
}

export const DriverMap: React.FC<DriverMapProps> = ({
  hotspots,
  selectedHotspot,
  onSelectHotspot,
  driver,
  onStartNavigation,
  incidents,
  theme = 'dark',
}) => {
  const [mapMode, setMapMode] = useState<'real' | 'radar'>('real');
  const [showRainRadar, setShowRainRadar] = useState(true);
  const [showIncidents, setShowIncidents] = useState(true);
  const [filterSurgeMin, setFilterSurgeMin] = useState<number>(1.0);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const routeLayerRef = useRef<L.Polyline | null>(null);
  const rainLayerRef = useRef<L.LayerGroup | null>(null);

  const driverCurrentZone = hotspots.find((h) => h.id === driver.currentZoneId) || hotspots[0];
  const navigatingToZone = driver.targetZoneId ? hotspots.find((h) => h.id === driver.targetZoneId) : null;
  const filteredHotspots = hotspots.filter((h) => h.surgeMultiplier >= filterSurgeMin);

  // Initialize Leaflet Map
  useEffect(() => {
    if (mapMode !== 'real' || !mapContainerRef.current) return;

    if (!leafletMapRef.current) {
      // Singapore center: 1.3521° N, 103.8198° E
      const map = L.map(mapContainerRef.current, {
        center: [1.325, 103.845],
        zoom: 12,
        minZoom: 10,
        maxZoom: 17,
        zoomControl: false,
      });

      L.control.zoom({ position: 'topright' }).addTo(map);

      leafletMapRef.current = map;
      markersLayerRef.current = L.layerGroup().addTo(map);
      rainLayerRef.current = L.layerGroup().addTo(map);
    }

    const map = leafletMapRef.current;

    // Remove existing tile layers
    map.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) {
        map.removeLayer(layer);
      }
    });

    // Add appropriate CartoDB Dark Matter or Voyager Light tiles
    const tileUrl =
      theme === 'dark'
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

    L.tileLayer(tileUrl, {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map);

    // Invalidate size in case container rendered while hidden
    setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      // Keep map reference or cleanup
    };
  }, [mapMode, theme]);

  // Update Markers & Overlays on Leaflet Map
  useEffect(() => {
    if (mapMode !== 'real' || !leafletMapRef.current || !markersLayerRef.current) return;

    const map = leafletMapRef.current;
    const markersLayer = markersLayerRef.current;
    const rainLayer = rainLayerRef.current;

    markersLayer.clearLayers();
    if (rainLayer) rainLayer.clearLayers();

    // 1. Draw Rain Radar Circles if enabled
    if (showRainRadar && rainLayer) {
      hotspots
        .filter((h) => h.weatherCondition === 'heavy_rain' || h.weatherCondition === 'thunderstorm')
        .forEach((h) => {
          L.circle([h.coordinates.lat, h.coordinates.lng], {
            radius: 2800,
            color: '#38bdf8',
            fillColor: '#0284c7',
            fillOpacity: 0.18,
            weight: 1.5,
            dashArray: '4, 4',
          }).addTo(rainLayer);
        });
    }

    // 2. Draw Navigation Route Polyline
    if (routeLayerRef.current) {
      map.removeLayer(routeLayerRef.current);
      routeLayerRef.current = null;
    }

    if (navigatingToZone) {
      const latlngs: L.LatLngExpression[] = [
        [driverCurrentZone.coordinates.lat, driverCurrentZone.coordinates.lng],
        [
          (driverCurrentZone.coordinates.lat + navigatingToZone.coordinates.lat) / 2 + 0.005,
          (driverCurrentZone.coordinates.lng + navigatingToZone.coordinates.lng) / 2 - 0.005,
        ],
        [navigatingToZone.coordinates.lat, navigatingToZone.coordinates.lng],
      ];

      routeLayerRef.current = L.polyline(latlngs, {
        color: '#38bdf8',
        weight: 4,
        opacity: 0.85,
        dashArray: '8, 8',
      }).addTo(map);
    }

    // 3. Draw Driver Position Marker
    const driverIconHtml = `
      <div class="relative flex items-center justify-center -translate-x-1/2 -translate-y-1/2">
        <span class="absolute w-8 h-8 rounded-full bg-emerald-500/40 animate-ping"></span>
        <div class="relative w-8 h-8 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shadow-lg border-2 border-white font-black text-xs">
          🚗
        </div>
        <span class="absolute -top-5 bg-emerald-500 text-slate-950 font-black text-[9px] px-1 py-0.2 rounded font-mono shadow whitespace-nowrap">
          YOU
        </span>
      </div>
    `;

    const driverMarkerIcon = L.divIcon({
      html: driverIconHtml,
      className: 'custom-surge-marker',
      iconSize: [32, 32],
    });

    L.marker([driverCurrentZone.coordinates.lat, driverCurrentZone.coordinates.lng], {
      icon: driverMarkerIcon,
      zIndexOffset: 1000,
    })
      .bindPopup(
        `<div class="p-1">
          <div class="font-bold text-xs">Your Current Location</div>
          <div class="text-[11px] text-slate-400 font-mono">${driverCurrentZone.name}</div>
        </div>`
      )
      .addTo(markersLayer);

    // 4. Draw Hotspot Surge Markers
    filteredHotspots.forEach((h) => {
      const isSelected = selectedHotspot?.id === h.id;
      const isCritical = h.surgeMultiplier >= 2.4;
      const isRain = h.weatherCondition === 'heavy_rain' || h.weatherCondition === 'thunderstorm';

      const surgeColorClass =
        h.surgeMultiplier >= 2.5
          ? 'from-red-500 to-rose-600 text-white'
          : h.surgeMultiplier >= 2.0
          ? 'from-amber-500 to-orange-600 text-slate-950'
          : h.surgeMultiplier >= 1.6
          ? 'from-yellow-400 to-amber-500 text-slate-950'
          : 'from-emerald-400 to-teal-500 text-slate-950';

      const iconSymbol =
        h.category === 'weather_surge'
          ? '🌧️'
          : h.category === 'event_crowd'
          ? '🏟️'
          : h.category === 'transit_breakdown'
          ? '🚆'
          : h.category === 'airport'
          ? '✈️'
          : '⚡';

      const markerHtml = `
        <div class="relative cursor-pointer group -translate-x-1/2 -translate-y-1/2">
          ${
            isCritical
              ? `<span class="absolute -inset-2 rounded-full bg-red-500/30 animate-ping"></span>`
              : ''
          }
          <div class="relative flex items-center gap-1 px-2 py-1 rounded-full font-bold text-xs shadow-xl bg-gradient-to-r ${surgeColorClass} ${
            isSelected ? 'ring-4 ring-amber-400 scale-110' : ''
          }">
            <span class="text-xs">${iconSymbol}</span>
            <span class="font-mono font-black">${h.surgeMultiplier}x</span>
          </div>
          <div class="absolute top-full left-1/2 -translate-x-1/2 mt-1 px-1.5 py-0.5 rounded text-[9px] font-bold whitespace-nowrap bg-slate-950/90 text-white border border-slate-700 shadow">
            ${h.name}
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: markerHtml,
        className: 'custom-surge-marker',
        iconSize: [40, 24],
      });

      const marker = L.marker([h.coordinates.lat, h.coordinates.lng], {
        icon: customIcon,
        zIndexOffset: isSelected ? 500 : 200,
      });

      marker.on('click', () => {
        onSelectHotspot(h);
      });

      marker.addTo(markersLayer);
    });
  }, [
    mapMode,
    filteredHotspots,
    selectedHotspot,
    driverCurrentZone,
    navigatingToZone,
    showRainRadar,
    onSelectHotspot,
  ]);

  // Recenter map on driver
  const handleRecenter = () => {
    if (leafletMapRef.current) {
      leafletMapRef.current.setView([driverCurrentZone.coordinates.lat, driverCurrentZone.coordinates.lng], 13);
    }
  };

  // Zoom to fit all zones
  const handleFitAll = () => {
    if (leafletMapRef.current && filteredHotspots.length > 0) {
      const bounds = L.latLngBounds(
        filteredHotspots.map((h) => [h.coordinates.lat, h.coordinates.lng])
      );
      bounds.extend([driverCurrentZone.coordinates.lat, driverCurrentZone.coordinates.lng]);
      leafletMapRef.current.fitBounds(bounds, { padding: [40, 40] });
    }
  };

  return (
    <div className="relative w-full h-[620px] lg:h-[720px] bg-slate-950 rounded-2xl border border-slate-300 dark:border-slate-800 overflow-hidden shadow-2xl flex flex-col">
      
      {/* Top Map Control Bar */}
      <div className="absolute top-3 left-3 right-3 z-[1000] flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        
        {/* Layer & Mode Toggles */}
        <div className="flex items-center gap-1.5 bg-white/95 dark:bg-slate-900/90 backdrop-blur-md p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-lg pointer-events-auto text-xs">
          
          {/* Mode Switcher: Real GPS Map vs Radar Vector */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-950 p-0.5 rounded-lg border border-slate-200 dark:border-slate-800 mr-1">
            <button
              onClick={() => setMapMode('real')}
              className={`px-2 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                mapMode === 'real'
                  ? 'bg-amber-500 text-slate-950 shadow'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              GPS Streets
            </button>
            <button
              onClick={() => setMapMode('radar')}
              className={`px-2 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                mapMode === 'radar'
                  ? 'bg-amber-500 text-slate-950 shadow'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Radar Vector
            </button>
          </div>

          <button
            onClick={() => setShowRainRadar(!showRainRadar)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
              showRainRadar
                ? 'bg-sky-500/20 text-sky-700 dark:text-sky-400 border border-sky-500/40 font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <CloudRain className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Rain Cells</span>
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

          <div className="h-4 w-px bg-slate-300 dark:bg-slate-800 mx-0.5" />

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

        {/* Quick Map Navigation Controls */}
        <div className="flex items-center gap-1.5 bg-white/95 dark:bg-slate-900/90 backdrop-blur-md p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-lg pointer-events-auto">
          {mapMode === 'real' && (
            <>
              <button
                onClick={handleRecenter}
                title="Recenter on My Location"
                className="p-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <LocateFixed className="w-4 h-4 text-emerald-500" />
              </button>
              <button
                onClick={handleFitAll}
                title="Fit Island Singapore View"
                className="p-1.5 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <Maximize2 className="w-4 h-4 text-sky-500" />
              </button>
              <div className="h-4 w-px bg-slate-300 dark:bg-slate-800 mx-1" />
            </>
          )}

          <div className="flex items-center gap-1.5 px-1">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-mono text-slate-700 dark:text-slate-300">
              <strong className="text-amber-600 dark:text-amber-400 font-semibold">{filteredHotspots.length} Zones</strong>
            </span>
          </div>
        </div>

      </div>

      {/* Main Map Rendering Area */}
      <div className="relative w-full flex-1 overflow-hidden select-none">
        
        {/* MODE 1: Interactive Real Leaflet Map */}
        <div
          ref={mapContainerRef}
          className={`w-full h-full ${mapMode === 'real' ? 'block' : 'hidden'}`}
          style={{ minHeight: '100%' }}
        />

        {/* MODE 2: Clean SVG Vector Radar Map */}
        {mapMode === 'radar' && (
          <div className="w-full h-full relative bg-slate-950">
            <svg
              className="w-full h-full"
              viewBox="0 0 1000 700"
              preserveAspectRatio="xMidYMid meet"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <radialGradient id="radarGrad" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* Grid Lines */}
              <g stroke="rgba(51, 65, 85, 0.3)" strokeWidth="1" strokeDasharray="4,6">
                <line x1="200" y1="0" x2="200" y2="700" />
                <line x1="400" y1="0" x2="400" y2="700" />
                <line x1="600" y1="0" x2="600" y2="700" />
                <line x1="800" y1="0" x2="800" y2="700" />
                <line x1="0" y1="180" x2="1000" y2="180" />
                <line x1="0" y1="360" x2="1000" y2="360" />
                <line x1="0" y1="540" x2="1000" y2="540" />
              </g>

              {/* Concentric Radar Rings */}
              <circle cx="550" cy="380" r="160" fill="none" stroke="rgba(56, 189, 248, 0.2)" strokeWidth="1.5" strokeDasharray="6,6" />
              <circle cx="550" cy="380" r="280" fill="none" stroke="rgba(56, 189, 248, 0.15)" strokeWidth="1" />
              <circle cx="550" cy="380" r="420" fill="none" stroke="rgba(56, 189, 248, 0.08)" strokeWidth="1" />

              {/* Island Landmass Contour (Numeric Coordinates) */}
              <path
                d="M 120 340 Q 180 210, 350 140 Q 550 100, 720 190 Q 940 240, 960 340 Q 920 440, 780 470 Q 650 540, 500 520 Q 380 600, 260 530 Q 100 450, 120 340 Z"
                fill="rgba(15, 23, 42, 0.95)"
                stroke="rgba(71, 85, 105, 0.6)"
                strokeWidth="2"
              />

              {/* Sentosa Island */}
              <ellipse cx="460" cy="580" rx="50" ry="25" fill="rgba(15, 23, 42, 0.95)" stroke="rgba(71, 85, 105, 0.6)" strokeWidth="2" />

              {/* Major Expressways (PIE & CTE) */}
              <path d="M 180 370 Q 400 350, 650 360 T 920 320" fill="none" stroke="#38bdf8" strokeWidth="2.5" opacity="0.4" />
              <path d="M 540 150 Q 530 320, 520 480" fill="none" stroke="#38bdf8" strokeWidth="2" strokeDasharray="6,4" opacity="0.4" />

              {/* Rain Clouds in Radar Mode */}
              {showRainRadar && (
                <g className="animate-pulse">
                  <path
                    d="M 450 350 Q 650 300, 700 440 Q 620 550, 460 520 Q 400 420, 450 350 Z"
                    fill="rgba(14, 165, 233, 0.22)"
                    stroke="rgba(56, 189, 248, 0.5)"
                    strokeWidth="2"
                    strokeDasharray="4,4"
                  />
                  <text x="540" y="340" fill="#38bdf8" fontSize="12" fontFamily="monospace" fontWeight="bold">
                    🌧️ HEAVY RAIN CELL 38mm/h
                  </text>
                </g>
              )}

              {/* Driver route line in vector mode */}
              {navigatingToZone && (
                <line
                  x1={driverCurrentZone.coordinates.x * 10}
                  y1={driverCurrentZone.coordinates.y * 7}
                  x2={navigatingToZone.coordinates.x * 10}
                  y2={navigatingToZone.coordinates.y * 7}
                  stroke="#38bdf8"
                  strokeWidth="3"
                  strokeDasharray="6,6"
                />
              )}
            </svg>

            {/* Absolute Hotspot Markers Overlay for Radar Mode */}
            {filteredHotspots.map((h) => {
              const isSelected = selectedHotspot?.id === h.id;
              return (
                <div
                  key={h.id}
                  onClick={() => onSelectHotspot(h)}
                  style={{
                    left: `${h.coordinates.x}%`,
                    top: `${h.coordinates.y}%`,
                  }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-10"
                >
                  <div className={`px-2.5 py-1 rounded-full text-xs font-black shadow-lg ${
                    isSelected ? 'bg-amber-400 text-slate-950 ring-4 ring-amber-500/50 scale-110' : 'bg-amber-500 text-slate-950'
                  }`}>
                    {h.surgeMultiplier}x
                  </div>
                  <div className="text-[10px] font-bold text-white bg-slate-900/90 px-1.5 py-0.5 rounded mt-1 whitespace-nowrap shadow">
                    {h.name}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Selected Hotspot Floating Inspector Card (Bottom of Map) */}
        {selectedHotspot && (
          <div className="absolute bottom-3 left-3 right-3 sm:left-auto sm:right-3 sm:w-96 z-[1000] bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-4 rounded-2xl border border-slate-300 dark:border-slate-700/80 shadow-2xl animate-in fade-in slide-in-from-bottom-4">
            
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
        <div className="text-[11px] font-mono text-slate-500">
          Pan & zoom streets • Click zone pin to dispatch
        </div>
      </div>
    </div>
  );
};
