import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  Send, 
  Bot, 
  User, 
  Compass, 
  CloudRain, 
  AlertTriangle, 
  TrendingUp, 
  Zap,
  Loader2
} from 'lucide-react';
import { HotspotZone, TravelIncident, WeatherZoneRadar, ROIAnalysis } from '../types';
import { generateDriverAdvice } from '../services/geminiService';

interface AiCopilotModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentZone: string;
  hotspots: HotspotZone[];
  incidents: TravelIncident[];
  weather: WeatherZoneRadar[];
  topRoiList: ROIAnalysis[];
  onSelectHotspot: (hotspot: HotspotZone) => void;
  onStartNavigation: (hotspot: HotspotZone) => void;
}

interface Message {
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
}

export const AiCopilotModal: React.FC<AiCopilotModalProps> = ({
  isOpen,
  onClose,
  currentZone,
  hotspots,
  incidents,
  weather,
  topRoiList,
  onSelectHotspot,
  onStartNavigation,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'ai',
      text: `👋 Hey captain! I'm your SurgePulse AI Strategist.
I am continuously tracking island-wide Doppler rain cells, concert dispersals, and MRT rail disruptions.

Current top opportunity: **${topRoiList[0]?.hotspot.name}** at **${topRoiList[0]?.hotspot.surgeMultiplier}x Surge** (~$${topRoiList[0]?.effectiveHourlyRate}/hr pace).

What shift strategy do you need?`,
      timestamp: 'Just now',
    },
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || inputQuery;
    if (!textToSend.trim() || isLoading) return;

    const userMsg: Message = {
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsLoading(true);

    try {
      const advice = await generateDriverAdvice(textToSend, {
        currentZone,
        hotspots,
        incidents,
        weather,
        topRoiList,
      });

      const aiMsg: Message = {
        sender: 'ai',
        text: advice,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: `Error contacting dispatch AI: ${err.message || 'Please retry'}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickPrompts = [
    '🌧️ Where is the best rain surge right now?',
    '🏟️ Is it worth driving to National Stadium for concert dispersal?',
    '🚆 How to capitalize on the Bugis MRT rail breakdown?',
    '⚡ Plan my next 90-minute evening rush shift',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[650px] max-h-[90vh]">
        
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                SurgePulse AI Dispatch Strategist
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono font-medium">
                  Gemini 2.5 Flash
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Real-time strategic positioning for maximum $/hr
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick prompt pills */}
        <div className="px-4 py-2 bg-slate-950/40 border-b border-slate-800/80 flex items-center gap-1.5 overflow-x-auto text-[11px]">
          <span className="text-slate-400 font-medium shrink-0">Quick Ask:</span>
          {quickPrompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(prompt)}
              className="whitespace-nowrap px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-purple-600/20 text-slate-300 hover:text-purple-300 border border-slate-700/60 transition-colors"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Chat message history */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex items-start gap-2.5 ${
                msg.sender === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {msg.sender === 'ai' && (
                <div className="w-7 h-7 rounded-lg bg-purple-600 flex items-center justify-center text-white shrink-0 mt-0.5">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl p-3.5 text-xs sm:text-sm whitespace-pre-wrap ${
                  msg.sender === 'user'
                    ? 'bg-amber-500 text-slate-950 font-medium rounded-tr-none'
                    : 'bg-slate-950/80 text-slate-200 border border-slate-800 rounded-tl-none leading-relaxed'
                }`}
              >
                {msg.text}
                <div
                  className={`text-[10px] mt-1 text-right ${
                    msg.sender === 'user' ? 'text-slate-800' : 'text-slate-500'
                  }`}
                >
                  {msg.timestamp}
                </div>
              </div>

              {msg.sender === 'user' && (
                <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300 shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 text-slate-400 text-xs">
              <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
              <span>Analyzing live traffic, rainfall Doppler & demand surges...</span>
            </div>
          )}
        </div>

        {/* Input box */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/70">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Ask anything: where to position, weather impact, route advice..."
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              type="submit"
              disabled={isLoading || !inputQuery.trim()}
              className="p-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white transition-all disabled:opacity-40 cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};
