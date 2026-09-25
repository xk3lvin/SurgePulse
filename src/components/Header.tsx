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
  Clock
} from 'lucide-react';
import { DriverState } from '../types';

interface HeaderProps {
  driver: DriverState;
  onOpenMcpConsole: () => void;
  onOpenDeployModal: () => void;
  onOpenAiCopilot: () => void;
  onToggleStatus: () => void;
  activeView: 'map' | 'list' | 'roi' | 'weather';
  setActiveView: (view: 'map' | 'list' | 'roi' | 'weather') => void;
}

export const Header: React.FC<HeaderProps> = ({
  driver,
  onOpenMcpConsole,
  onOpenDeployModal,
  onOpenAiCopilot,
  onToggleStatus,
  activeView,
  setActiveView,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          
          {/* Brand Logo & Radar Status */}
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 via-orange-500 to-red-600 shadow-lg shadow-amber-500/20 text-slate-950 font-black">
              <Zap className="w-5 h-5 fill-slate-950 stroke-slate-950" />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                  SurgePulse <span className="text-xs px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 font-mono">PHV</span>
                </h1>
                <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live Surge Engine
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Bad Weather & Crowd Opportunity Radar
              </p>
            </div>
          </div>

          {/* Navigation View Switcher (Desktop & Mobile Pills) */}
          <div className="hidden lg:flex items-center bg-slate-950/80 p-1 rounded-xl border border-slate-800 text-xs font-medium">
            <button
              onClick={() => setActiveView('map')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeView === 'map'
                  ? 'bg-amber-500 text-slate-950 font-semibold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              Surge Map
            </button>
            <button
              onClick={() => setActiveView('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeView === 'list'
                  ? 'bg-amber-500 text-slate-950 font-semibold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Hotspots Feed
            </button>
            <button
              onClick={() => setActiveView('roi')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeView === 'roi'
                  ? 'bg-amber-500 text-slate-950 font-semibold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Navigation className="w-3.5 h-3.5" />
              Travel ROI Matrix
            </button>
            <button
              onClick={() => setActiveView('weather')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeView === 'weather'
                  ? 'bg-amber-500 text-slate-950 font-semibold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <CloudRain className="w-3.5 h-3.5" />
              Rain Surge Radar
            </button>
          </div>

          {/* Driver Stats & Quick Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Driver Earnings & Status Pill */}
            <div className="hidden sm:flex items-center gap-3 bg-slate-950/70 border border-slate-800 rounded-xl px-3 py-1.5">
              <div className="flex items-center gap-1.5">
                <div className="p-1 rounded bg-amber-500/10 text-amber-400">
                  <DollarSign className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-mono">Today's Take</div>
                  <div className="text-xs font-bold text-emerald-400 font-mono">
                    ${driver.earningsToday.toFixed(2)}
                  </div>
                </div>
              </div>
              
              <div className="h-6 w-px bg-slate-800" />

              <button
                onClick={onToggleStatus}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  driver.status === 'navigating'
                    ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40 animate-pulse'
                    : driver.status === 'on_trip'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${
                  driver.status === 'navigating' ? 'bg-sky-400' : 'bg-emerald-400'
                }`} />
                <span className="capitalize">{driver.status}</span>
              </button>
            </div>

            {/* AI Advisor Button */}
            <button
              onClick={onOpenAiCopilot}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs font-medium transition-all shadow-sm shadow-purple-500/10 cursor-pointer"
              title="Open AI Driver Dispatch Copilot"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span className="hidden sm:inline">AI Copilot</span>
            </button>

            {/* MCP Console Button */}
            <button
              onClick={onOpenMcpConsole}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-300 text-xs font-medium transition-all shadow-sm shadow-blue-500/10 cursor-pointer"
              title="Open Model Context Protocol (MCP) Server Console"
            >
              <Terminal className="w-3.5 h-3.5 text-blue-400" />
              <span className="font-mono">MCP</span>
            </button>

            {/* GitHub & Vercel Deploy Button */}
            <button
              onClick={onOpenDeployModal}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium transition-all cursor-pointer"
              title="GitHub & Vercel Deployment Instructions"
            >
              <Github className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Deploy</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation View Switcher (Under Header on small screens) */}
        <div className="flex lg:hidden items-center justify-between bg-slate-950/80 p-1 rounded-xl border border-slate-800 text-xs font-medium mt-2">
          <button
            onClick={() => setActiveView('map')}
            className={`flex-1 flex justify-center items-center gap-1 py-1.5 rounded-lg transition-all ${
              activeView === 'map'
                ? 'bg-amber-500 text-slate-950 font-semibold'
                : 'text-slate-400'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            Map
          </button>
          <button
            onClick={() => setActiveView('list')}
            className={`flex-1 flex justify-center items-center gap-1 py-1.5 rounded-lg transition-all ${
              activeView === 'list'
                ? 'bg-amber-500 text-slate-950 font-semibold'
                : 'text-slate-400'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Hotspots
          </button>
          <button
            onClick={() => setActiveView('roi')}
            className={`flex-1 flex justify-center items-center gap-1 py-1.5 rounded-lg transition-all ${
              activeView === 'roi'
                ? 'bg-amber-500 text-slate-950 font-semibold'
                : 'text-slate-400'
            }`}
          >
            <Navigation className="w-3.5 h-3.5" />
            ROI
          </button>
          <button
            onClick={() => setActiveView('weather')}
            className={`flex-1 flex justify-center items-center gap-1 py-1.5 rounded-lg transition-all ${
              activeView === 'weather'
                ? 'bg-amber-500 text-slate-950 font-semibold'
                : 'text-slate-400'
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
