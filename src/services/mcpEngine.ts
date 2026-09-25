import { HotspotZone, TravelIncident, WeatherZoneRadar, ROIAnalysis, VehicleType, MCPToolDefinition, MCPRequest, MCPResponse } from '../types';
import { INITIAL_HOTSPOTS, INITIAL_INCIDENTS, INITIAL_WEATHER_ZONES } from '../data/mockData';

export const MCP_TOOLS: MCPToolDefinition[] = [
  {
    name: 'get_surge_hotspots',
    description: 'Retrieves current private-hire and taxi price-surge hotspots filtered by surge multiplier, category, or weather conditions.',
    inputSchema: {
      type: 'object',
      properties: {
        minSurge: {
          type: 'number',
          description: 'Minimum surge multiplier to filter by (e.g. 1.8 for 1.8x)',
          default: 1.0,
        },
        category: {
          type: 'string',
          description: 'Filter by category: weather_surge, event_crowd, transit_breakdown, airport, nightlife, commercial, or all',
          enum: ['all', 'weather_surge', 'event_crowd', 'transit_breakdown', 'airport', 'nightlife', 'commercial'],
        },
      },
    },
  },
  {
    name: 'get_weather_impact',
    description: 'Inspects real-time rainfall radar, storm cells, and rain-induced ride-hail surge multipliers by district.',
    inputSchema: {
      type: 'object',
      properties: {
        districtFilter: {
          type: 'string',
          description: 'Optional district name filter (e.g. "Central", "Kallang", "East")',
        },
      },
    },
  },
  {
    name: 'get_travel_incidents',
    description: 'Lists live transit breakdowns, MRT delays, expressway bottlenecks, and concert stadium dispersals driving cab demand.',
    inputSchema: {
      type: 'object',
      properties: {
        minSeverity: {
          type: 'string',
          description: 'Filter by severity: critical, high, or medium',
          enum: ['medium', 'high', 'critical'],
        },
      },
    },
  },
  {
    name: 'calculate_driver_roi',
    description: 'Calculates expected net earnings, travel duration, fuel/deadhead expense, and ROI score for a driver to position to any hotspot.',
    inputSchema: {
      type: 'object',
      properties: {
        originHotspotId: {
          type: 'string',
          description: 'Current driver position zone ID (e.g. "orchard-somerset", "jurong-gateway")',
        },
        vehicleType: {
          type: 'string',
          description: 'Vehicle classification: standard_4, xl_6, premium, or taxi',
          enum: ['standard_4', 'xl_6', 'premium', 'taxi'],
          default: 'standard_4',
        },
      },
      required: ['originHotspotId'],
    },
  },
  {
    name: 'get_ai_dispatch_strategy',
    description: 'Generates real-time strategic dispatch guidance for PHV/taxi drivers to maximize hourly rate during rain storms or peak events.',
    inputSchema: {
      type: 'object',
      properties: {
        driverCurrentZone: {
          type: 'string',
          description: 'Current driver location zone ID',
        },
        timeRemainingMins: {
          type: 'number',
          description: 'Remaining shift duration in minutes (e.g. 60 or 120)',
          default: 90,
        },
      },
      required: ['driverCurrentZone'],
    },
  },
];

// Helper to calculate travel distance and duration
export function calculateDistanceAndDuration(
  origin: { x: number; y: number; lat: number; lng: number },
  destination: { x: number; y: number; lat: number; lng: number },
  averageSpeedKmH = 34
) {
  // Approximate distance in km using euclidean map coordinate distance for the city
  const dx = (origin.x - destination.x) * 0.42;
  const dy = (origin.y - destination.y) * 0.38;
  const rawDist = Math.sqrt(dx * dx + dy * dy);
  const distanceKm = Math.max(1.2, Number((rawDist * 1.35).toFixed(1))); // road network factor
  const durationMins = Math.max(4, Math.round((distanceKm / averageSpeedKmH) * 60));
  return { distanceKm, durationMins };
}

// Compute ROI for driver repositioning
export function computeDriverRoiList(
  currentZoneId: string,
  vehicleType: VehicleType = 'standard_4',
  hotspots: HotspotZone[] = INITIAL_HOTSPOTS,
  fuelCostPerKm = 0.16
): ROIAnalysis[] {
  const origin = hotspots.find((h) => h.id === currentZoneId) || hotspots[0];
  const vehicleMultiplier =
    vehicleType === 'xl_6' ? 1.35 : vehicleType === 'premium' ? 1.6 : vehicleType === 'taxi' ? 1.05 : 1.0;

  const results: ROIAnalysis[] = hotspots.map((dest) => {
    const isSameZone = dest.id === origin.id;
    const { distanceKm, durationMins } = isSameZone
      ? { distanceKm: 0.5, durationMins: 2 }
      : calculateDistanceAndDuration(origin.coordinates, dest.coordinates);

    const deadheadFuel = isSameZone ? 0.2 : Number((distanceKm * fuelCostPerKm).toFixed(2));
    const grossFare = Number((dest.estimatedFare * vehicleMultiplier).toFixed(2));
    const netProfit = Number((grossFare - deadheadFuel).toFixed(2));

    // Assume average passenger trip takes 22 minutes + deadhead duration
    const totalCycleTimeHours = (durationMins + 22) / 60;
    const effectiveHourlyRate = Number((netProfit / totalCycleTimeHours).toFixed(1));

    // Surge Decay factor: if travel time exceeds surge duration, penalty
    const decaySafetyFactor = durationMins > dest.surgeDecayMinutes ? 0.4 : 1.0;
    const demandWeight = dest.passengerToDriverRatio * 1.2;

    // ROI formula out of 100
    let roiScore = Math.round(
      Math.min(
        99,
        Math.max(
          15,
          dest.surgeMultiplier * 20 +
            demandWeight * 0.4 -
            durationMins * 1.1 +
            (dest.weatherCondition === 'heavy_rain' || dest.weatherCondition === 'thunderstorm' ? 12 : 0) *
              decaySafetyFactor
        )
      )
    );

    let urgency: 'HIGH' | 'MEDIUM' | 'LOW' = 'MEDIUM';
    if (roiScore >= 80) urgency = 'HIGH';
    else if (roiScore < 50) urgency = 'LOW';

    let rationale = '';
    if (isSameZone) {
      rationale = `Already positioned here! Catch local surging bookings with zero deadhead travel.`;
    } else if (dest.category === 'weather_surge') {
      rationale = `Torrential rainfall spiking booking requests. ${durationMins}m drive fits comfortably inside ${dest.surgeDecayMinutes}m storm surge window.`;
    } else if (dest.category === 'event_crowd') {
      rationale = `Huge stadium/venue crowd exit (${dest.passengerCount.toLocaleString()} pax) with critical driver deficit. Immediate high-fare trip guaranteed.`;
    } else if (dest.category === 'transit_breakdown') {
      rationale = `Urgent commuter emergency! Commuters stranded by rail signaling fault. Very high willingness to pay surge fare.`;
    } else {
      rationale = `Solid commercial demand. ${durationMins}m travel time delivers estimated $${effectiveHourlyRate}/hr rate.`;
    }

    return {
      hotspot: dest,
      distanceKm,
      travelDurationMins: durationMins,
      fuelCost: deadheadFuel,
      expectedGrossFare: grossFare,
      expectedNetProfit: netProfit,
      effectiveHourlyRate,
      roiScore,
      urgency,
      rationale,
    };
  });

  // Sort descending by ROI score
  return results.sort((a, b) => b.roiScore - a.roiScore);
}

// Executes an MCP tool call
export async function executeMcpTool(
  toolName: string,
  args: Record<string, any> = {},
  liveHotspots: HotspotZone[] = INITIAL_HOTSPOTS,
  liveIncidents: TravelIncident[] = INITIAL_INCIDENTS,
  liveWeather: WeatherZoneRadar[] = INITIAL_WEATHER_ZONES
): Promise<{ content: Array<{ type: 'text'; text: string }>; isError?: boolean }> {
  switch (toolName) {
    case 'get_surge_hotspots': {
      const minSurge = Number(args.minSurge ?? 1.0);
      const category = args.category || 'all';

      let filtered = liveHotspots.filter((h) => h.surgeMultiplier >= minSurge);
      if (category && category !== 'all') {
        filtered = filtered.filter((h) => h.category === category);
      }

      const summary = filtered.map((h) => ({
        id: h.id,
        name: h.name,
        district: h.district,
        surge: `${h.surgeMultiplier}x`,
        category: h.category,
        estimatedFare: `$${h.estimatedFare}`,
        passengersWaiting: h.passengerCount,
        driversNearby: h.driverCountNearby,
        paxToDriverRatio: `${h.passengerToDriverRatio}:1`,
        weather: `${h.weatherCondition} (${h.rainfallMm}mm)`,
        reason: h.reason,
        surgeDecayMinutes: h.surgeDecayMinutes,
      }));

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                status: 'success',
                matchedZonesCount: filtered.length,
                zones: summary,
                timestamp: new Date().toISOString(),
              },
              null,
              2
            ),
          },
        ],
      };
    }

    case 'get_weather_impact': {
      const filter = (args.districtFilter || '').toLowerCase();
      let zones = liveWeather;
      if (filter) {
        zones = zones.filter((z) => z.name.toLowerCase().includes(filter));
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                status: 'success',
                radarSummary: 'Tropical rainbands creating acute passenger pickup surges across Central and Southern corridors.',
                weatherZones: zones,
                surgeMultiplierImpactMax: Math.max(...zones.map((z) => z.surgeMultiplierImpact)),
                timestamp: new Date().toISOString(),
              },
              null,
              2
            ),
          },
        ],
      };
    }

    case 'get_travel_incidents': {
      const minSeverity = args.minSeverity || 'medium';
      let incidents = liveIncidents;
      if (minSeverity === 'critical') {
        incidents = incidents.filter((i) => i.severity === 'critical');
      } else if (minSeverity === 'high') {
        incidents = incidents.filter((i) => i.severity === 'critical' || i.severity === 'high');
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                status: 'success',
                incidentCount: incidents.length,
                incidents,
                timestamp: new Date().toISOString(),
              },
              null,
              2
            ),
          },
        ],
      };
    }

    case 'calculate_driver_roi': {
      const originId = args.originHotspotId || 'orchard-somerset';
      const vehicleType = (args.vehicleType as VehicleType) || 'standard_4';
      const roiResults = computeDriverRoiList(originId, vehicleType, liveHotspots);

      const topPicks = roiResults.slice(0, 5).map((r, index) => ({
        rank: index + 1,
        destination: r.hotspot.name,
        surge: `${r.hotspot.surgeMultiplier}x`,
        travelDurationMinutes: r.travelDurationMins,
        travelDistanceKm: `${r.distanceKm} km`,
        expectedGrossFare: `$${r.expectedGrossFare}`,
        deadheadFuelCost: `$${r.fuelCost}`,
        netProfit: `$${r.expectedNetProfit}`,
        effectiveHourlyRate: `$${r.effectiveHourlyRate}/hr`,
        roiScore: `${r.roiScore}/100`,
        urgency: r.urgency,
        strategyRationale: r.rationale,
      }));

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                status: 'success',
                originZoneId: originId,
                vehicleType,
                topRecommendedHotspots: topPicks,
                timestamp: new Date().toISOString(),
              },
              null,
              2
            ),
          },
        ],
      };
    }

    case 'get_ai_dispatch_strategy': {
      const zoneId = args.driverCurrentZone || 'orchard-somerset';
      const roiResults = computeDriverRoiList(zoneId, 'standard_4', liveHotspots);
      const topPick = roiResults[0];

      const strategyText = `RECOMMENDED STRATEGY FOR NEXT 60-90 MINS:
1. TARGET ZONE: ${topPick.hotspot.name} (${topPick.hotspot.surgeMultiplier}x Surge).
2. TRAVEL ROI: Drive is ${topPick.travelDurationMins} minutes (${topPick.distanceKm} km). Estimated net fare: $${topPick.expectedNetProfit}, yielding ~$${topPick.effectiveHourlyRate}/hr.
3. CATALYST: ${topPick.hotspot.reason} (Rainfall: ${topPick.hotspot.rainfallMm}mm).
4. CRITICAL WINDOW: Surge will remain elevated for approx ${topPick.hotspot.surgeDecayMinutes} minutes. Depart immediately via fastest expressway link.`;

      return {
        content: [
          {
            type: 'text',
            text: strategyText,
          },
        ],
      };
    }

    default:
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: `Error: Unknown tool "${toolName}". Available tools: ${MCP_TOOLS.map((t) => t.name).join(', ')}`,
          },
        ],
      };
  }
}

// Process raw JSON-RPC 2.0 requests
export async function processMcpJsonRpc(
  request: MCPRequest,
  liveHotspots = INITIAL_HOTSPOTS,
  liveIncidents = INITIAL_INCIDENTS,
  liveWeather = INITIAL_WEATHER_ZONES
): Promise<MCPResponse> {
  const { id = 1, method, params = {} } = request;

  try {
    switch (method) {
      case 'ping':
        return { jsonrpc: '2.0', id, result: {} };

      case 'initialize':
        return {
          jsonrpc: '2.0',
          id,
          result: {
            protocolVersion: '2024-11-05',
            capabilities: {
              tools: { listChanged: false },
              resources: {},
              prompts: {},
            },
            serverInfo: {
              name: 'surgepulse-phv-mcp',
              version: '1.0.0',
              description: 'SurgePulse Model Context Protocol server for PHV & Taxi driver demand, bad weather hotspots, and travel ROI optimization',
            },
          },
        };

      case 'tools/list':
        return {
          jsonrpc: '2.0',
          id,
          result: {
            tools: MCP_TOOLS,
          },
        };

      case 'tools/call': {
        const { name, arguments: toolArgs } = params;
        if (!name) {
          return {
            jsonrpc: '2.0',
            id,
            error: { code: -32602, message: 'Invalid params: tool name is required' },
          };
        }
        const execution = await executeMcpTool(name, toolArgs || {}, liveHotspots, liveIncidents, liveWeather);
        return {
          jsonrpc: '2.0',
          id,
          result: execution,
        };
      }

      case 'prompts/list':
        return {
          jsonrpc: '2.0',
          id,
          result: {
            prompts: [
              {
                name: 'driver_shift_optimizer',
                description: 'Analyzes live weather radar and transit incidents to draft driver dispatch plan',
              },
            ],
          },
        };

      default:
        return {
          jsonrpc: '2.0',
          id,
          error: {
            code: -32601,
            message: `Method "${method}" not found. Supported methods: initialize, tools/list, tools/call, ping`,
          },
        };
    }
  } catch (err: any) {
    return {
      jsonrpc: '2.0',
      id,
      error: {
        code: -32603,
        message: err.message || 'Internal error in MCP server',
      },
    };
  }
}
