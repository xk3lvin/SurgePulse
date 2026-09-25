import React, { useState } from 'react';
import { 
  X, 
  Github, 
  Triangle, 
  Copy, 
  Check, 
  ArrowRight, 
  Terminal, 
  CheckCircle2, 
  ExternalLink,
  Sparkles,
  GitBranch,
  ShieldCheck
} from 'lucide-react';

interface DeployModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DeployModal: React.FC<DeployModalProps> = ({ isOpen, onClose }) => {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedSection(id);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const gitCommands = `# 1. Initialize git & commit files
git init
git add .
git commit -m "feat: SurgePulse PHV driver intelligence & MCP server"

# 2. Add your GitHub remote and push
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/surgepulse-phv-mcp.git
git push -u origin main`;

  const vercelCliCommands = `# Quick deployment via Vercel CLI (optional)
npm i -g vercel
vercel deploy --prod`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-slate-800 text-white border border-slate-700">
              <Github className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                Push to GitHub & Deploy on Vercel
              </h2>
              <p className="text-xs text-slate-400">
                Deployment checklist with pre-configured <code className="text-amber-400 bg-slate-950 px-1 py-0.5 rounded">vercel.json</code> & serverless MCP
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          
          {/* Status Box */}
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <div className="font-bold text-emerald-400 text-sm">
                Project is 100% Vercel & GitHub Ready
              </div>
              <p className="text-slate-300">
                We have generated <code className="text-emerald-300 bg-slate-950 px-1 py-0.5 rounded">vercel.json</code>, the serverless handler <code className="text-emerald-300 bg-slate-950 px-1 py-0.5 rounded">api/mcp.ts</code>, and the local stdio runner <code className="text-emerald-300 bg-slate-950 px-1 py-0.5 rounded">mcp-server.ts</code>.
              </p>
            </div>
          </div>

          {/* Step 1: Push to GitHub */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center text-xs font-black">1</span>
                Push Codebase to GitHub
              </h3>
              <button
                onClick={() => copyCode(gitCommands, 'git')}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
              >
                {copiedSection === 'git' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                Copy Commands
              </button>
            </div>

            <pre className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 font-mono text-xs text-amber-300 overflow-x-auto whitespace-pre-wrap">
              {gitCommands}
            </pre>
          </div>

          {/* Step 2: Connect to Vercel */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center text-xs font-black">2</span>
                Deploy on Vercel Dashboard
              </h3>
            </div>

            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-2.5 text-xs text-slate-300">
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-sky-400 mt-1.5 shrink-0" />
                <div>
                  Go to <a href="https://vercel.com/new" target="_blank" rel="noreferrer" className="text-sky-400 font-bold hover:underline inline-flex items-center gap-1">vercel.com/new <ExternalLink className="w-3 h-3" /></a> and select your GitHub repository.
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-sky-400 mt-1.5 shrink-0" />
                <div>
                  <strong>Framework Preset:</strong> Vite (Auto-detected). Build Command: <code className="text-white bg-slate-900 px-1 py-0.5 rounded">npm run build</code>, Output Directory: <code className="text-white bg-slate-900 px-1 py-0.5 rounded">dist</code>.
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-sky-400 mt-1.5 shrink-0" />
                <div>
                  <strong>Environment Variables (Optional):</strong> Set <code className="text-amber-400 bg-slate-900 px-1 py-0.5 rounded">GEMINI_API_KEY</code> if you want server-side Gemini AI responses. (Offline heuristics will still operate smoothly without it).
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-sky-400 mt-1.5 shrink-0" />
                <div>
                  Click <strong>Deploy</strong>. Once finished, your web app runs at <code className="text-emerald-400 bg-slate-900 px-1 py-0.5 rounded">https://your-project.vercel.app</code> and your MCP server endpoint is live at <code className="text-sky-400 bg-slate-900 px-1 py-0.5 rounded">https://your-project.vercel.app/api/mcp</code>!
                </div>
              </div>
            </div>
          </div>

          {/* Step 3: Local CLI alternative */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center text-xs font-black">3</span>
                Alternative: Deploy via Vercel CLI
              </h3>
              <button
                onClick={() => copyCode(vercelCliCommands, 'cli')}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
              >
                {copiedSection === 'cli' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                Copy CLI
              </button>
            </div>

            <pre className="bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-xs text-sky-300">
              {vercelCliCommands}
            </pre>
          </div>

        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-bold text-xs transition-colors cursor-pointer"
          >
            Got It
          </button>
        </div>

      </div>
    </div>
  );
};
