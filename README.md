# SurgePulse PHV — Driver Demand & Weather Surge Intelligence (MCP)

> **One-stop Web App for all PHV/Taxi Drivers to capture price-surge demand during bad weather and crowded events.**

Built with **React 19**, **Vite**, **Tailwind CSS**, and **Model Context Protocol (MCP)** specification. Ready for zero-config deployment to **GitHub** and **Vercel**.

---

## 🚀 Core Features (Aligned with Business Canvas)

1. **Weather Condition Radar**:
   - Live Doppler rainfall tracking across districts.
   - Real-time rain-surge multiplier correlation (heavy rain = +40% to +85% demand surge as commuters avoid walking/buses).

2. **Travel Incidents & Rail Breakdowns**:
   - Detects MRT signalling faults, bus disruptions, and highway accidents.
   - Highlights stranded commuters hailing private hire cabs.

3. **Travel Duration & ROI Optimizer**:
   - Evaluates deadhead driving duration vs. expected net fare vs. surge decay window.
   - Computes an island-wide **ROI Score (0–100)** to pinpoint the #1 destination for highest effective hourly rate ($/hr).

4. **Interactive Vector Surge Radar**:
   - Visual heatmap nodes with live platform comparisons (Grab, Gojek, ComfortDelGro, Tada).
   - Animated Doppler radar sweep and turn-by-turn positioning routes.

5. **Model Context Protocol (MCP) Server**:
   - Full JSON-RPC 2.0 tool suite (`get_surge_hotspots`, `get_weather_impact`, `get_travel_incidents`, `calculate_driver_roi`, `get_ai_dispatch_strategy`).
   - Serverless MCP HTTP endpoint at `/api/mcp` for Vercel.
   - Local stdio runner (`npx tsx mcp-server.ts`) for Claude Desktop, Cursor, and Windsurf.

---

## 🛠️ Deploying to GitHub & Vercel

### Step 1: Push to GitHub
```bash
git init
git add .
git commit -m "feat: SurgePulse PHV driver intelligence MCP with Vercel deployment"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/surgepulse-phv-mcp.git
git push -u origin main
```

### Step 2: Deploy to Vercel
1. Go to [vercel.com/new](https://vercel.com/new) and import your GitHub repository.
2. Vercel automatically detects the Vite framework and uses `vercel.json`:
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Serverless API**: `api/mcp.ts` deployed at `/api/mcp`
3. Optional Environment Variable:
   - `GEMINI_API_KEY`: For server-side AI dispatch recommendations (offline heuristic copilot works automatically without key).
4. Click **Deploy**!

---

## 🔌 Using with Claude Desktop (MCP Stdio)

Add this entry to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "surgepulse-phv": {
      "command": "npx",
      "args": ["-y", "tsx", "mcp-server.ts"]
    }
  }
}
```

Or test via curl against your deployed Vercel server:

```bash
curl -X POST https://your-deployment.vercel.app/api/mcp \
  -H "Content-Type: application/json" \
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
  }'
```
