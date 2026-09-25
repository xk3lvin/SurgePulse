import { GoogleGenAI } from '@google/genai';
import { HotspotZone, TravelIncident, WeatherZoneRadar, ROIAnalysis } from '../types';

export async function generateDriverAdvice(
  question: string,
  context: {
    currentZone: string;
    hotspots: HotspotZone[];
    incidents: TravelIncident[];
    weather: WeatherZoneRadar[];
    topRoiList: ROIAnalysis[];
  }
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY || (typeof window !== 'undefined' ? (window as any).GEMINI_API_KEY : '');

  // Formulate context summary
  const topPick = context.topRoiList[0];
  const highSurgeZones = context.hotspots
    .filter((h) => h.surgeMultiplier >= 2.0)
    .map((h) => `${h.name} (${h.surgeMultiplier}x - ${h.category} - ${h.weatherCondition}, rain: ${h.rainfallMm}mm)`)
    .join('; ');

  const activeIncidents = context.incidents
    .slice(0, 3)
    .map((i) => `[${i.severity.toUpperCase()}] ${i.title} (${i.location})`)
    .join('; ');

  const systemPrompt = `You are SurgePulse AI Copilot, a sharp, veteran private-hire & taxi driver strategist in Singapore.
Your goal is to help PHV/taxi drivers maximize their hourly take-home earnings ($/hr) by capitalizing on bad weather (tropical squalls, rain surges), massive event crowds (concerts, stadiums), and transit breakdowns (MRT delays).
Always give punchy, actionable advice with:
- #1 Destination & exact surge multiplier
- Estimated travel time vs decay window
- Weather & road condition warning (avoiding jam bottlenecks)
- Projected net fare.
Keep responses concise, formatted with bullet points, and highly encouraging for the driver.`;

  const userPrompt = `Driver current location: ${context.currentZone}
Top ROI Destination: ${topPick ? `${topPick.hotspot.name} (${topPick.hotspot.surgeMultiplier}x surge, ${topPick.travelDurationMins} min drive, net profit $${topPick.expectedNetProfit}, rate $${topPick.effectiveHourlyRate}/hr)` : 'None'}
Active High-Surge Areas: ${highSurgeZones}
Active Travel Incidents: ${activeIncidents}

Driver Query: "${question}"`;

  if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `${systemPrompt}\n\n${userPrompt}`,
      });
      if (response.text) {
        return response.text;
      }
    } catch (err) {
      console.warn('Gemini API call failed, falling back to smart heuristic copilot:', err);
    }
  }

  // Smart heuristic response
  return generateHeuristicDriverAdvice(question, context);
}

function generateHeuristicDriverAdvice(
  question: string,
  context: {
    currentZone: string;
    hotspots: HotspotZone[];
    incidents: TravelIncident[];
    weather: WeatherZoneRadar[];
    topRoiList: ROIAnalysis[];
  }
): string {
  const topPick = context.topRoiList[0];
  const weatherZone = context.hotspots.find((h) => h.category === 'weather_surge') || context.hotspots[0];
  const stadiumZone = context.hotspots.find((h) => h.category === 'event_crowd');
  const transitZone = context.hotspots.find((h) => h.category === 'transit_breakdown');

  const qLower = question.toLowerCase();

  if (qLower.includes('rain') || qLower.includes('weather') || qLower.includes('storm')) {
    return `🌧️ **WEATHER DISPATCH ADVICE**:
• **Primary Target**: ${weatherZone.name} is experiencing ${weatherZone.rainfallMm}mm/hr torrential rain with a **${weatherZone.surgeMultiplier}x price surge**.
• **Driver Shortage**: Commuters fleeing unsheltered walkways are swamping pick-up points. Passenger-to-driver ratio is currently ${weatherZone.passengerToDriverRatio}:1.
• **Action**: Move immediately via sheltered arterial roads. Expected surge window will last another **${weatherZone.surgeDecayMinutes} minutes**.
• **Projected Take**: ~$${weatherZone.estimatedFare} per 20-min trip.`;
  }

  if (qLower.includes('concert') || qLower.includes('stadium') || qLower.includes('event')) {
    if (stadiumZone) {
      return `🏟️ **STADIUM MEGA-DISPERSAL STRATEGY**:
• **Target**: ${stadiumZone.name} with **${stadiumZone.surgeMultiplier}x multiplier** (Highest on island).
• **Crowd Scale**: Over ${stadiumZone.passengerCount.toLocaleString()} attendees leaving. MRT Circle Line is congested.
• **Driver Tactic**: Approach via Nicoll Highway or Stadium Crescent pick-up bays. Avoid Guillemard Road jam.
• **Urgency**: Critical. Grab and CDG Zig surge rates are pinned at maximum tier.`;
    }
  }

  if (qLower.includes('breakdown') || qLower.includes('mrt') || qLower.includes('train')) {
    if (transitZone) {
      return `🚆 **TRANSIT BREAKDOWN RESPONSE**:
• **Disruption Spot**: ${transitZone.name} (${transitZone.reason}).
• **Surge Rate**: **${transitZone.surgeMultiplier}x** with ${transitZone.waitingTimeMin} min passenger wait times.
• ** commuter State**: Commuters are frustrated by stalled trains and bidding aggressively on ride-hail apps.
• **Action**: High conversion rate—pickups are immediate within 30 seconds of arrival.`;
    }
  }

  // General recommendation
  return `⚡ **OPTIMAL DISPATCH BRIEFING**:
• **#1 Recommendation**: Head to **${topPick.hotspot.name}** (${topPick.hotspot.surgeMultiplier}x Surge).
• **Travel Equation**: Only a **${topPick.travelDurationMins} min drive** (${topPick.distanceKm} km). Fuel deadhead is low ($${topPick.fuelCost}), yielding **$${topPick.effectiveHourlyRate}/hr** net pace.
• **Key Catalyst**: ${topPick.hotspot.reason}.
• **Surge Longevity**: Projected to stay high for the next **${topPick.hotspot.surgeDecayMinutes} minutes**—depart right now to lock in high fares before decay!`;
}
