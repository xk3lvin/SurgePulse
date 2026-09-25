import React, { useState, useMemo, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { 
  Compass, 
  Layers, 
  Navigation, 
  CloudRain, 
  Sparkles, 
  Terminal, 
  Github, 
  Flame, 
  Car, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp, 
  Clock, 
  DollarSign, 
  X,
  Play,
  Radio,
  RefreshCw,
  Sun,
  Moon,
  Thermometer,
  Wind
} from 'lucide-react';
import { 
  HotspotZone, 
  TravelIncident, 
  WeatherZoneRadar, 
  DriverState, 
  VehicleType 
} from './types';
import { 
  INITIAL_HOTSPOTS, 
  INITIAL_INCIDENTS, 
  INITIAL_WEATHER_ZONES, 
  DEFAULT_DRIVER_STATE 
} from './data/mockData';
import { computeDriverRoiList } from './services/mcpEngine';
import { 
  fetchLiveSingaporeWeatherData, 
  applyLiveWeatherToHotspots, 
  applyLiveMicroPulse, 
  LiveWeatherData 
} from './services/liveDataService';
import { Header } from './components/Header';
import { DriverMap } from './components/DriverMap';
import { SurgeCardList } from './components/SurgeCardList';
import { RoiCalculator } from './components/RoiCalculator';
import { WeatherRadarPanel } from './components/WeatherRadarPanel';
import { IncidentsFeed } from './components/IncidentsFeed';
import { McpConsoleModal } from './components/McpConsoleModal';
import { DeployModal } from './components/DeployModal';
import { AiCopilotModal } from './components/AiCopilotModal';

export default function App() {
  // Theme state: 'dark' or 'light'
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('surgepulse_theme');
      if (saved === 'light' || saved === 'dark') return saved;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'dark';
  });

  // Sync theme to document element
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
    }
    localStorage.setItem('surgepulse_theme', theme);
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Core Data State
  const [hotspots, setHotspots] = useState<HotspotZone[]>(INITIAL_HOTSPOTS);
  const [incidents, setIncidents] = useState<TravelIncident[]>(INITIAL_INCIDENTS);
  const [weatherZones, setWeatherZones] = useState<WeatherZoneRadar[]>(INITIAL_WEATHER_ZONES);
  const [driver, setDriver] = useState<DriverState>(DEFAULT_DRIVER_STATE);
  const [selectedHotspot, setSelectedHotspot] = useState<HotspotZone | null>(INITIAL_HOTSPOTS[0]);
  const [activeView, setActiveView] = useState<'map' | 'list' | 'roi' | 'weather'>('map');

  // Live Data State
  const [liveWeather, setLiveWeather] = useState<LiveWeatherData | null>(null);
  const [isSyncingLive, setIsSyncingLive] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('Connecting...');
  const [autoSync, setAutoSync] = useState(true);

  // Modals state
  const [isMcpConsoleOpen, setIsMcpConsoleOpen] = useState(false);
  const [isDeployModalOpen, setIsDeployModalOpen] = useState(false);
  const [isAiCopilotOpen, setIsAiCopilotOpen] = useState(false);
  const [recentTripFare, setRecentTripFare] = useState<number | null>(null);

  // Live Sync handler: Queries Data.gov.sg & Open-Meteo in real-time
  const syncLiveData = useCallback(async () => {
    setIsSyncingLive(true);
    try {
      const data = await fetchLiveSingaporeWeatherData();
      setLiveWeather(data);
      setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));

      // Update hotspots dynamically
      setHotspots((prev) => applyLiveWeatherToHotspots(prev, data));

      // Update weather zones with live precipitation
      setWeatherZones((prev) =>
        prev.map((w) => {
          const livePrecip = data.openMeteo.precipitationMm;
          return {
            ...w,
            rainfallRateMmPerHour: Math.max(w.rainfallRateMmPerHour, livePrecip),
          };
        })
      );
    } catch (err) {
      console.warn('Live sync error:', err);
    } finally {
      setIsSyncingLive(false);
    }
  }, []);

  // Initial live sync on mount
  useEffect(() => {
    syncLiveData();
  }, [syncLiveData]);

  // Periodic Auto-Sync every 30 seconds
  useEffect(() => {
    if (!autoSync) return;
    const interval = setInterval(() => {
      syncLiveData();
    }, 30000);
    return () => clearInterval(interval);
  }, [autoSync, syncLiveData]);

  // Real-Time Ticker Micro-Pulse (every 3.5 seconds)
  useEffect(() => {
    const pulseInterval = setInterval(() => {
      setHotspots((prev) => applyLiveMicroPulse(prev));
    }, 3500);
    return () => clearInterval(pulseInterval);
  }, []);

  // Compute live ROI list based on driver's position & vehicle
  const roiList = useMemo(() => {
    return computeDriverRoiList(driver.currentZoneId, driver.vehicleType, hotspots, driver.fuelCostPerKm);
  }, [driver.currentZoneId, driver.vehicleType, hotspots, driver.fuelCostPerKm]);

  // Handle Driver Position change
  const handleChangeDriverZone = (zoneId: string) => {
    setDriver((prev) => ({
      ...prev,
      currentZoneId: zoneId,
      status: prev.targetZoneId === zoneId ? 'idle' : prev.status,
      targetZoneId: prev.targetZoneId === zoneId ? null : prev.targetZoneId,
    }));
  };

  // Handle Vehicle classification change
  const handleChangeVehicleType = (vehicleType: VehicleType) => {
    setDriver((prev) => ({
      ...prev,
      vehicleType,
    }));
  };

  // Start Navigation to Hotspot
  const handleStartNavigation = (hotspot: HotspotZone) => {
    setDriver((prev) => ({
      ...prev,
      status: 'navigating',
      targetZoneId: hotspot.id,
    }));
    setSelectedHotspot(hotspot);
  };

  // Complete Trip / Simulate Ride Pickup
  const handleSimulateTripCompleted = () => {
    const target = hotspots.find((h) => h.id === driver.targetZoneId) || selectedHotspot || hotspots[0];
    const tripFare = Number((target.estimatedFare * (driver.vehicleType === 'xl_6' ? 1.35 : 1.0)).toFixed(2));

    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 },
      });
    } catch (e) {
      // safe fallback
    }

    setRecentTripFare(tripFare);
    setDriver((prev) => ({
      ...prev,
      status: 'idle',
      currentZoneId: target.id,
      targetZoneId: null,
      earningsToday: Number((prev.earningsToday + tripFare).toFixed(2)),
      completedTrips: prev.completedTrips + 1,
    }));

    setTimeout(() => {
      setRecentTripFare(null);
    }, 4500);
  };

  // Toggle status
  const handleToggleDriverStatus = () => {
    setDriver((prev) => {
      const nextStatus = prev.status === 'idle' ? 'navigating' : 'idle';
      return {
        ...prev,
        status: nextStatus,
        targetZoneId: nextStatus === 'navigating' ? prev.targetZoneId || hotspots[0].id : null,
      };
    });
  };

  // Simulate Tropical Torrential Storm
  const handleTriggerStormSimulation = () => {
    setWeatherZones((prev) =>
      prev.map((w) => ({
        ...w,
        rainfallRateMmPerHour: w.rainfallRateMmPerHour + 18,
        surgeMultiplierImpact: Number((w.surgeMultiplierImpact + 0.35).toFixed(2)),
      }))
    );

    setHotspots((prev) =>
      prev.map((h) => {
        if (h.category === 'weather_surge' || h.district.includes('Downtown') || h.district.includes('Kallang')) {
          const newSurge = Number((h.surgeMultiplier + 0.4).toFixed(2));
          return {
            ...h,
            weatherCondition: 'heavy_rain',
            rainfallMm: h.rainfallMm + 22,
            surgeMultiplier: newSurge,
            estimatedFare: Number((h.baseFare * newSurge).toFixed(2)),
            passengerCount: h.passengerCount + 600,
            passengerToDriverRatio: Number((h.passengerToDriverRatio * 1.3).toFixed(1)),
          };
        }
        return h;
      })
    );
  };

  const navigatingZone = driver.targetZoneId ? hotspots.find((h) => h.id === driver.targetZoneId) : null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col antialiased selection:bg-amber-500 selection:text-slate-950 transition-colors duration-200">
      
      {/* Global Header with Light/Dark Mode and Live Refresh */}
      <Header
        driver={driver}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        onOpenMcpConsole={() => setIsMcpConsoleOpen(true)}
        onOpenDeployModal={() => setIsDeployModalOpen(true)}
        onOpenAiCopilot={() => setIsAiCopilotOpen(true)}
        onToggleStatus={handleToggleDriverStatus}
        activeView={activeView}
        setActiveView={setActiveView}
        isSyncingLive={isSyncingLive}
        onSyncLiveData={syncLiveData}
        lastSyncTime={lastSyncTime}
        liveSource={liveWeather?.source || 'Data.gov.sg & Open-Meteo'}
      />

      {/* Live API Telemetry & Forecast Status Bar */}
      <div className="bg-slate-100 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 py-2 px-4 transition-colors">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-2 text-xs">
          
          <div className="flex flex-wrap items-center gap-3">
            {/* Live Indicator */}
            <div className="flex items-center gap-1.5 font-semibold text-emerald-700 dark:text-emerald-400">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>LIVE API:</span>
              <span className="font-mono text-slate-700 dark:text-slate-300">
                {liveWeather?.source || 'Data.gov.sg NEA & Open-Meteo'}
              </span>
            </div>

            <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">•</span>

            {/* Weather Telemetry */}
            {liveWeather && (
              <div className="flex items-center gap-3 font-mono text-slate-600 dark:text-slate-300">
                <span className="flex items-center gap-1">
                  <Thermometer className="w-3.5 h-3.5 text-amber-500" />
                  {liveWeather.openMeteo.temperature}°C
                </span>
                <span className="flex items-center gap-1">
                  <CloudRain className="w-3.5 h-3.5 text-sky-500" />
                  {liveWeather.openMeteo.precipitationMm} mm/h ({liveWeather.openMeteo.description})
                </span>
                <span className="hidden lg:flex items-center gap-1">
                  <Wind className="w-3.5 h-3.5 text-blue-400" />
                  {liveWeather.openMeteo.windSpeedKmH} km/h
                </span>
              </div>
            )}
          </div>

          {/* Sync Controls */}
          <div className="flex items-center gap-3 self-end md:self-auto font-mono text-[11px]">
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-600 dark:text-slate-400">
              <input
                type="checkbox"
                checked={autoSync}
                onChange={(e) => setAutoSync(e.target.checked)}
                className="rounded accent-amber-500"
              />
              Auto-Sync (30s)
            </label>

            <button
              onClick={syncLiveData}
              disabled={isSyncingLive}
              className="text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer font-semibold disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${isSyncingLive ? 'animate-spin' : ''}`} />
              {isSyncingLive ? 'Syncing...' : 'Sync Now'}
            </button>
          </div>

        </div>
      </div>

      {/* Live Disruption / Surge Alert Ticker */}
      <div className="bg-amber-500/10 border-b border-amber-500/20 py-1.5 px-4 overflow-hidden select-none">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap">
            <span className="flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400 font-mono text-[11px] uppercase tracking-wider">
              <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
              Surge Alert:
            </span>
            <span className="text-slate-700 dark:text-slate-300">
              🌧️ Live Weather: <strong>Marina Bay & CBD</strong> (+75% surge)
            </span>
            <span className="text-slate-400 dark:text-slate-600">•</span>
            <span className="text-slate-700 dark:text-slate-300">
              🏟️ <strong>National Stadium</strong> concert dispersal (2.85x Max Surge)
            </span>
            <span className="text-slate-400 dark:text-slate-600">•</span>
            <span className="text-slate-700 dark:text-slate-300">
              🚆 <strong>Bugis MRT</strong> signaling disruption (1,800+ stranded passengers)
            </span>
          </div>

          <button
            onClick={() => setIsDeployModalOpen(true)}
            className="hidden lg:flex items-center gap-1 text-[11px] font-mono text-amber-600 dark:text-amber-400 hover:underline transition-colors shrink-0 pl-4 cursor-pointer"
          >
            <Github className="w-3 h-3" />
            Push to GitHub & Vercel
          </button>
        </div>
      </div>

      {/* Navigation En Route Active Banner */}
      {navigatingZone && (
        <div className="bg-sky-100 dark:bg-sky-950/80 border-b border-sky-300 dark:border-sky-500/30 px-4 py-2.5 backdrop-blur-md">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-sky-500/20 border border-sky-500/40 text-sky-600 dark:text-sky-400 flex items-center justify-center animate-pulse">
                <Navigation className="w-4 h-4 fill-sky-500" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>En Route to: <strong>{navigatingZone.name}</strong></span>
                  <span className="px-2 py-0.2 rounded-full bg-amber-500 text-slate-950 font-black text-[10px] font-mono">
                    {navigatingZone.surgeMultiplier}x SURGE
                  </span>
                </div>
                <div className="text-[11px] text-sky-700 dark:text-sky-300 font-mono">
                  Target Fare: ~${navigatingZone.estimatedFare} • ~{navigatingZone.surgeDecayMinutes} min surge window
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={handleSimulateTripCompleted}
                className="flex-1 sm:flex-initial px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 fill-slate-950" />
                Simulate Ride Complete
              </button>

              <button
                onClick={() => setDriver((p) => ({ ...p, status: 'idle', targetZoneId: null }))}
                className="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Trip Completed Notification Toast */}
      {recentTripFare && (
        <div className="fixed top-16 right-4 z-50 bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-4 py-3 rounded-2xl shadow-2xl border border-emerald-400/40 flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
          <div className="p-2 rounded-xl bg-white/20">
            <DollarSign className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-emerald-100">Surge Fare Collected!</div>
            <div className="text-base font-black font-mono">+${recentTripFare.toFixed(2)} Added to Today's Earnings</div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 space-y-6">
        
        {/* VIEW 1: RADAR MAP & LIVE DISPATCH VIEW */}
        {activeView === 'map' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Interactive Map (8 cols) */}
            <div className="lg:col-span-8">
              <DriverMap
                hotspots={hotspots}
                selectedHotspot={selectedHotspot}
                onSelectHotspot={setSelectedHotspot}
                driver={driver}
                onStartNavigation={handleStartNavigation}
                incidents={incidents}
              />
            </div>

            {/* Side Dispatch Column (4 cols) */}
            <div className="lg:col-span-4 space-y-4">
              
              {/* Quick Top Opportunity Card */}
              {roiList[0] && (
                <div className="bg-white dark:bg-gradient-to-br dark:from-amber-500/10 dark:via-slate-900 dark:to-slate-900 border border-slate-200 dark:border-amber-500/30 rounded-2xl p-4 shadow-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded bg-amber-500 text-slate-950">
                      Top Recommendation
                    </span>
                    <span className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
                      Score: {roiList[0].roiScore}/100
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    {roiList[0].hotspot.name}
                  </h3>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                    {roiList[0].hotspot.district} • {roiList[0].travelDurationMins} min drive
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-950/70 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 mb-3">
                    {roiList[0].rationale}
                  </div>

                  <div className="flex items-center justify-between text-xs font-mono mb-3">
                    <span className="text-slate-500 dark:text-slate-400">Expected Net Fare:</span>
                    <strong className="text-emerald-600 dark:text-emerald-400 text-sm font-bold">${roiList[0].expectedNetProfit}</strong>
                  </div>

                  <button
                    onClick={() => handleStartNavigation(roiList[0].hotspot)}
                    className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Navigation className="w-3.5 h-3.5 fill-slate-950" />
                    Lock In Navigation & Go
                  </button>
                </div>
              )}

              {/* Live Incident Disruptions */}
              <IncidentsFeed
                incidents={incidents}
                hotspots={hotspots}
                onSelectHotspot={setSelectedHotspot}
                onStartNavigation={handleStartNavigation}
              />

              {/* Fast Storm Simulation Card */}
              <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-md">
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <CloudRain className="w-3.5 h-3.5 text-sky-500" />
                    Live Bad Weather Simulator
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Trigger sudden tropical squall to test surge response
                  </div>
                </div>

                <button
                  onClick={handleTriggerStormSimulation}
                  className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition-all shadow cursor-pointer shrink-0"
                >
                  Trigger Rain
                </button>
              </div>

            </div>
          </div>
        )}

        {/* VIEW 2: HOTSPOTS FEED */}
        {activeView === 'list' && (
          <SurgeCardList
            hotspots={hotspots}
            selectedHotspot={selectedHotspot}
            onSelectHotspot={setSelectedHotspot}
            driver={driver}
            onStartNavigation={handleStartNavigation}
          />
        )}

        {/* VIEW 3: TRAVEL ROI MATRIX */}
        {activeView === 'roi' && (
          <RoiCalculator
            hotspots={hotspots}
            driver={driver}
            onChangeDriverZone={handleChangeDriverZone}
            onChangeVehicleType={handleChangeVehicleType}
            roiList={roiList}
            onSelectHotspot={setSelectedHotspot}
            onStartNavigation={handleStartNavigation}
          />
        )}

        {/* VIEW 4: WEATHER RADAR PANEL */}
        {activeView === 'weather' && (
          <WeatherRadarPanel
            weatherZones={weatherZones}
            hotspots={hotspots}
            onTriggerStormSimulation={handleTriggerStormSimulation}
            onSelectHotspot={setSelectedHotspot}
          />
        )}

      </main>

      {/* Global Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 py-5 text-xs text-slate-500 dark:text-slate-400 transition-colors">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div>
            <span className="font-bold text-slate-900 dark:text-slate-200">SurgePulse PHV & Taxi</span> — One-stop Driver Demand, Weather Surge & Travel ROI Platform.
          </div>
          <div className="flex items-center gap-4 text-slate-500 dark:text-slate-400 font-mono">
            <button
              onClick={() => setIsMcpConsoleOpen(true)}
              className="hover:text-blue-500 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Terminal className="w-3.5 h-3.5" />
              Model Context Protocol (MCP)
            </button>
            <button
              onClick={() => setIsDeployModalOpen(true)}
              className="hover:text-amber-500 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Github className="w-3.5 h-3.5" />
              GitHub & Vercel
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <McpConsoleModal
        isOpen={isMcpConsoleOpen}
        onClose={() => setIsMcpConsoleOpen(false)}
        hotspots={hotspots}
        incidents={incidents}
        weather={weatherZones}
      />

      <DeployModal
        isOpen={isDeployModalOpen}
        onClose={() => setIsDeployModalOpen(false)}
      />

      <AiCopilotModal
        isOpen={isAiCopilotOpen}
        onClose={() => setIsAiCopilotOpen(false)}
        currentZone={driver.currentZoneId}
        hotspots={hotspots}
        incidents={incidents}
        weather={weatherZones}
        topRoiList={roiList}
        onSelectHotspot={setSelectedHotspot}
        onStartNavigation={handleStartNavigation}
      />

    </div>
  );
}
