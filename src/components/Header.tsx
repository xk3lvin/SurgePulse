import React from 'react';
import { 
  Zap, 
  CloudRain, 
  Navigation, 
  Terminal, 
  Github, 
  DollarSign, 
  Compass, 
  Sparkles,
  Layers,
  Car,
  Clock,
  Sun,
  Moon,
  RefreshCw,
  Radio
} from 'lucide-react';
import { DriverState } from '../types';

interface HeaderProps {
  driver: DriverState;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onOpenMcpConsole: () => void;
  onOpenDeployModal: () => void;
  onOpenAiCopilot: () => void;
  onToggleStatus: () => void;
  activeView: 'map' | 'list' | 'roi' | 'weather';
  setActiveView: (view: 'map' | 'list' | 'roi' | 'weather') => void;
  isSyncingLive: boolean;
  onSyncLiveData: () => void;
  lastSyncTime: string;
  liveSource: string;
}

export const Header: React.FC<HeaderProps> = ({
  driver,
  theme,
  onToggleTheme,
  onOpenMcpConsole,
  onOpenDeployModal,
  onOpenAiCopilot,
  onToggleStatus,
  activeView,
  setActiveView,
  isSyncingLive,
  onSyncLiveData,
  lastSyncTime,
  liveSource,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors shadow-sm">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          
          {/* Brand Logo & Radar Status */}
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 via-orange-500 to-red-600 shadow-lg shadow-amber-500/20 text-slate-950 font-black shrink-0">
              <Zap className="w-5 h-5 fill-slate-950 stroke-slate-950" />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                  SurgePulse <span className="text-xs px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30 font-mono">PHV</span>
                </h1>
                
                {/* Live Data Badge */}
                <button
                  onClick={onSyncLiveData}
                  title="Click to sync real-time weather & surge rates"
                  className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 transition-all cursor-pointer"
                >
                  <Radio className={`w-3 h-3 text-emerald-500 ${isSyncingLive ? 'animate-spin' : 'animate-pulse'}`} />
                  <span className="font-mono font-semibold">LIVE</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 hidden md:inline">({lastSyncTime})</span>
                </button>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block truncate max-w-xs">
                Real-Time Weather & Demand Surge Engine
              </p>
            </div>
          </div>

          {/* Navigation View Switcher (Desktop Pills) */}
          <div className="hidden lg:flex items-center bg-slate-100 dark:bg-slate-950/80 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-medium">
            <button
              onClick={() => setActiveView('map')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeView === 'map'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              Surge Map
            </button>
            <button
              onClick={() => setActiveView('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeView === 'list'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Hotspots Feed
            </button>
            <button
              onClick={() => setActiveView('roi')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeView === 'roi'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Navigation className="w-3.5 h-3.5" />
              Travel ROI Matrix
            </button>
            <button
              onClick={() => setActiveView('weather')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeView === 'weather'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <CloudRain className="w-3.5 h-3.5" />
              Rain Surge Radar
            </button>
          </div>

          {/* Action Buttons & Theme Toggle */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            
            {/* Live Refresh Button */}
            <button
              onClick={onSyncLiveData}
              disabled={isSyncingLive}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
              title={`Fetch live weather & surge rates (Connected to ${liveSource})`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingLive ? 'animate-spin text-amber-500' : ''}`} />
            </button>

            {/* Light / Dark Mode Toggle */}
            <button
              onClick={onToggleTheme}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-all cursor-pointer"
              title={theme === 'dark' ? 'Switch to Daytime Light Mode' : 'Switch to Dark HUD Mode'}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun className="w-3.5 h-3.5 text-amber-400 hover:rotate-45 transition-transform" />
              ) : (
                <Moon className="w-3.5 h-3.5 text-indigo-600 hover:-rotate-12 transition-transform" />
              )}
            </button>

            {/* Driver Earnings & Status Pill */}
            <div className="hidden sm:flex items-center gap-2.5 bg-slate-100 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5">
              <div className="flex items-center gap-1.5">
                <div className="p-1 rounded bg-amber-500/10 text-amber-500">
                  <DollarSign className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-mono">Today</div>
                  <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                    ${driver.earningsToday.toFixed(2)}
                  </div>
                </div>
              </div>
              
              <div className="h-5 w-px bg-slate-300 dark:bg-slate-800" />

              <button
                onClick={onToggleStatus}
                className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  driver.status === 'navigating'
                    ? 'bg-sky-500/20 text-sky-600 dark:text-sky-400 border border-sky-500/40 animate-pulse'
                    : 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${
                  driver.status === 'navigating' ? 'bg-sky-500' : 'bg-emerald-500'
                }`} />
                <span className="capitalize">{driver.status}</span>
              </button>
            </div>

            {/* AI Advisor Button */}
            <button
              onClick={onOpenAiCopilot}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-700 dark:text-purple-300 text-xs font-medium transition-all shadow-sm shadow-purple-500/10 cursor-pointer"
              title="Open AI Driver Dispatch Copilot"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-500 dark:text-purple-400" />
              <span className="hidden sm:inline">AI Copilot</span>
            </button>

            {/* MCP Console Button */}
            <button
              onClick={onOpenMcpConsole}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-700 dark:text-blue-300 text-xs font-medium transition-all shadow-sm shadow-blue-500/10 cursor-pointer"
              title="Open Model Context Protocol (MCP) Server Console"
            >
              <Terminal className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
              <span className="font-mono">MCP</span>
            </button>

            {/* GitHub & Vercel Deploy Button */}
            <button
              onClick={onOpenDeployModal}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium transition-all cursor-pointer"
              title="GitHub & Vercel Deployment Instructions"
            >
              <Github className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Deploy</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation View Switcher (Under Header on small screens) */}
        <div className="flex lg:hidden items-center justify-between bg-slate-100 dark:bg-slate-950/80 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-medium mt-2">
          <button
            onClick={() => setActiveView('map')}
            className={`flex-1 flex justify-center items-center gap-1 py-1.5 rounded-lg transition-all ${
              activeView === 'map'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            Map
          </button>
          <button
            onClick={() => setActiveView('list')}
            className={`flex-1 flex justify-center items-center gap-1 py-1.5 rounded-lg transition-all ${
              activeView === 'list'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Hotspots
          </button>
          <button
            onClick={() => setActiveView('roi')}
            className={`flex-1 flex justify-center items-center gap-1 py-1.5 rounded-lg transition-all ${
              activeView === 'roi'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <Navigation className="w-3.5 h-3.5" />
            ROI
          </button>
          <button
            onClick={() => setActiveView('weather')}
            className={`flex-1 flex justify-center items-center gap-1 py-1.5 rounded-lg transition-all ${
              activeView === 'weather'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <CloudRain className="w-3.5 h-3.5" />
            Weather
          </button>
        </div>

      </div>
    </header>
  );
};

