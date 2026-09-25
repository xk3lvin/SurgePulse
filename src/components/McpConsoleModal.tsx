import React, { useState } from 'react';
import { 
  X, 
  Terminal, 
  Play, 
  Copy, 
  Check, 
  Cpu, 
  FileCode, 
  Globe, 
  ExternalLink,
  CheckCircle2,
  Code
} from 'lucide-react';
import { MCP_TOOLS, processMcpJsonRpc, executeMcpTool } from '../services/mcpEngine';
import { HotspotZone, TravelIncident, WeatherZoneRadar } from '../types';

interface McpConsoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  hotspots: HotspotZone[];
  incidents: TravelIncident[];
  weather: WeatherZoneRadar[];
}

export const McpConsoleModal: React.FC<McpConsoleModalProps> = ({
  isOpen,
  onClose,
  hotspots,
  incidents,
  weather,
}) => {
  const [selectedTool, setSelectedTool] = useState(MCP_TOOLS[0].name);
  const [toolArgs, setToolArgs] = useState<string>('{\n  "minSurge": 1.8,\n  "category": "all"\n}');
  const [jsonRpcOutput, setJsonRpcOutput] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'tester' | 'claude_config' | 'curl_docs'>('tester');
  const [copied, setCopied] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleToolChange = (toolName: string) => {
    setSelectedTool(toolName);
    switch (toolName) {
      case 'get_surge_hotspots':
        setToolArgs('{\n  "minSurge": 1.8,\n  "category": "all"\n}');
        break;
      case 'get_weather_impact':
        setToolArgs('{\n  "districtFilter": "Central"\n}');
        break;
      case 'get_travel_incidents':
        setToolArgs('{\n  "minSeverity": "high"\n}');
        break;
      case 'calculate_driver_roi':
        setToolArgs('{\n  "originHotspotId": "orchard-somerset",\n  "vehicleType": "standard_4"\n}');
        break;
      case 'get_ai_dispatch_strategy':
        setToolArgs('{\n  "driverCurrentZone": "orchard-somerset",\n  "timeRemainingMins": 90\n}');
        break;
      default:
        setToolArgs('{}');
    }
  };

  const handleExecuteTool = async () => {
    setIsLoading(true);
    try {
      let parsedArgs = {};
      if (toolArgs.trim()) {
        parsedArgs = JSON.parse(toolArgs);
      }

      const request = {
        jsonrpc: '2.0' as const,
        id: Math.floor(Math.random() * 1000) + 1,
        method: 'tools/call',
        params: {
          name: selectedTool,
          arguments: parsedArgs,
        },
      };

      const response = await processMcpJsonRpc(request, hotspots, incidents, weather);
      setJsonRpcOutput(JSON.stringify(response, null, 2));
    } catch (err: any) {
      setJsonRpcOutput(
        JSON.stringify(
          {
            jsonrpc: '2.0',
            id: null,
            error: {
              code: -32700,
              message: `Arguments Parse Error: ${err.message}`,
            },
          },
          null,
          2
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const currentToolDef = MCP_TOOLS.find((t) => t.name === selectedTool);

  const claudeDesktopConfig = `{
  "mcpServers": {
    "surgepulse-phv": {
      "command": "npx",
      "args": ["-y", "tsx", "mcp-server.ts"]
    }
  }
}`;

  const vercelHttpConfig = `// Model Context Protocol over HTTP (Vercel Serverless)
// POST https://your-app.vercel.app/api/mcp
curl -X POST https://your-app.vercel.app/api/mcp \\
  -H "Content-Type: application/json" \\
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/call",
    "params": {
      "name": "calculate_driver_roi",
      "arguments": {
        "originHotspotId": "orchard-somerset",
        "vehicleType": "standard_4"
      }
    }
  }'`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                Model Context Protocol (MCP) Server Console
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-mono font-medium">
                  v2024-11-05 Spec
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Direct integration endpoint for Claude Desktop, Cursor, and Vercel Serverless
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

        {/* Tab switcher */}
        <div className="px-5 pt-3 pb-0 border-b border-slate-800 flex items-center gap-2 text-xs font-medium">
          <button
            onClick={() => setActiveTab('tester')}
            className={`pb-2.5 px-3 border-b-2 transition-all ${
              activeTab === 'tester'
                ? 'border-blue-500 text-blue-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Interactive Tool Inspector
          </button>
          <button
            onClick={() => setActiveTab('claude_config')}
            className={`pb-2.5 px-3 border-b-2 transition-all ${
              activeTab === 'claude_config'
                ? 'border-blue-500 text-blue-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Claude Desktop Config
          </button>
          <button
            onClick={() => setActiveTab('curl_docs')}
            className={`pb-2.5 px-3 border-b-2 transition-all ${
              activeTab === 'curl_docs'
                ? 'border-blue-500 text-blue-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Vercel /api/mcp API
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          
          {activeTab === 'tester' && (
            <div className="space-y-4">
              
              {/* Tool Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Select MCP Tool Definition:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {MCP_TOOLS.map((t) => (
                    <button
                      key={t.name}
                      onClick={() => handleToolChange(t.name)}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        selectedTool === t.name
                          ? 'bg-blue-500/10 border-blue-500/40 text-blue-300'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div className="text-xs font-mono font-bold">{t.name}</div>
                      <div className="text-[10px] text-slate-400 truncate mt-0.5">{t.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Tool Description and Input Schema */}
              {currentToolDef && (
                <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800 text-xs space-y-1">
                  <div className="font-semibold text-slate-200">Description:</div>
                  <p className="text-slate-400">{currentToolDef.description}</p>
                </div>
              )}

              {/* Arguments Editor */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-1.5">
                    <span>Input Arguments (JSON):</span>
                    <button
                      onClick={handleExecuteTool}
                      disabled={isLoading}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-blue-600/20 cursor-pointer disabled:opacity-50"
                    >
                      <Play className="w-3.5 h-3.5 fill-white" />
                      {isLoading ? 'Executing...' : 'Run Tool'}
                    </button>
                  </div>
                  <textarea
                    rows={8}
                    value={toolArgs}
                    onChange={(e) => setToolArgs(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-xs text-sky-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Output Viewer */}
                <div>
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-1.5">
                    <span>JSON-RPC 2.0 Response:</span>
                    {jsonRpcOutput && (
                      <button
                        onClick={() => copyToClipboard(jsonRpcOutput, 'output')}
                        className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
                      >
                        {copied === 'output' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        Copy Response
                      </button>
                    )}
                  </div>
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 h-[184px] overflow-y-auto font-mono text-[11px] text-emerald-400 whitespace-pre">
                    {jsonRpcOutput || '// Click "Run Tool" to inspect live MCP tool execution payload'}
                  </div>
                </div>
              </div>

            </div>
          )}

          {activeTab === 'claude_config' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-300">
                To connect this MCP server to <strong>Claude Desktop</strong> or <strong>Cursor</strong>, add this definition to your <code className="text-amber-400 bg-slate-950 px-1 py-0.5 rounded">claude_desktop_config.json</code>:
              </p>

              <div className="relative">
                <button
                  onClick={() => copyToClipboard(claudeDesktopConfig, 'claude')}
                  className="absolute top-3 right-3 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 rounded-lg flex items-center gap-1.5 border border-slate-700 transition-colors"
                >
                  {copied === 'claude' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  Copy JSON
                </button>
                <pre className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs text-amber-300 overflow-x-auto">
                  {claudeDesktopConfig}
                </pre>
              </div>

              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2 text-xs text-slate-400">
                <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Configuration Path:
                </div>
                <div>• macOS: <code className="text-slate-300">~/Library/Application Support/Claude/claude_desktop_config.json</code></div>
                <div>• Windows: <code className="text-slate-300">%APPDATA%\Claude\claude_desktop_config.json</code></div>
              </div>
            </div>
          )}

          {activeTab === 'curl_docs' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-300">
                When deployed on Vercel, this server operates as a serverless JSON-RPC 2.0 MCP endpoint accessible at <code className="text-sky-400 bg-slate-950 px-1 py-0.5 rounded">/api/mcp</code>.
              </p>

              <div className="relative">
                <button
                  onClick={() => copyToClipboard(vercelHttpConfig, 'curl')}
                  className="absolute top-3 right-3 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 rounded-lg flex items-center gap-1.5 border border-slate-700 transition-colors"
                >
                  {copied === 'curl' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  Copy Curl
                </button>
                <pre className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs text-sky-300 overflow-x-auto whitespace-pre-wrap">
                  {vercelHttpConfig}
                </pre>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
          <div>Built-in Model Context Protocol Tool Suite</div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
