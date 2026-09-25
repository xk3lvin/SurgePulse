export type DemandCategory =
  | 'weather_surge'
  | 'event_crowd'
  | 'transit_breakdown'
  | 'airport'
  | 'nightlife'
  | 'commercial';

export type DemandLevel = 'critical' | 'high' | 'moderate' | 'normal';

export type WeatherType = 'heavy_rain' | 'thunderstorm' | 'drizzle' | 'cloudy' | 'clear';

export interface HotspotZone {
  id: string;
  name: string;
  shortCode: string;
  district: string;
  category: DemandCategory;
  demandLevel: DemandLevel;
  surgeMultiplier: number;
  baseFare: number;
  estimatedFare: number;
  passengerCount: number;
  driverCountNearby: number;
  passengerToDriverRatio: number;
  waitingTimeMin: number;
  reason: string;
  weatherCondition: WeatherType;
  rainfallMm: number;
  surgeDecayMinutes: number; // Duration surge is anticipated to sustain
  coordinates: {
    x: number; // percentage in canvas map (0-100)
    y: number; // percentage in canvas map (0-100)
    lat: number;
    lng: number;
  };
  platformSurges: {
    grab: number;
    gojek: number;
    comfort: number;
    tada: number;
  };
  activeEvents?: string[];
  transitAlerts?: string[];
}

export interface TravelIncident {
  id: string;
  title: string;
  type: 'mrt_breakdown' | 'expressway_accident' | 'road_closure' | 'heavy_flood' | 'concert_dispersal';
  location: string;
  district: string;
  severity: 'critical' | 'high' | 'medium';
  timestamp: string;
  affectedHotspotId: string;
  surgeImpact: string;
  description: string;
}

export interface WeatherZoneRadar {
  id: string;
  name: string;
  status: string;
  icon: string;
  rainfallRateMmPerHour: number;
  surgeMultiplierImpact: number;
  cloudCoverPercent: number;
  forecastNextHour: string;
}

export type VehicleType = 'standard_4' | 'xl_6' | 'premium' | 'taxi';

export interface DriverState {
  name: string;
  driverId: string;
  vehicleType: VehicleType;
  currentZoneId: string;
  status: 'idle' | 'navigating' | 'on_trip';
  targetZoneId: string | null;
  earningsToday: number;
  completedTrips: number;
  onlineHours: number;
  fuelCostPerKm: number;
  averageSpeedKmH: number;
}

export interface ROIAnalysis {
  hotspot: HotspotZone;
  distanceKm: number;
  travelDurationMins: number;
  fuelCost: number;
  expectedGrossFare: number;
  expectedNetProfit: number;
  effectiveHourlyRate: number;
  roiScore: number; // 0 to 100
  urgency: 'HIGH' | 'MEDIUM' | 'LOW';
  rationale: string;
}

// Model Context Protocol (MCP) Standard Types
export interface MCPToolParameterProperty {
  type: string;
  description: string;
  enum?: string[];
  default?: any;
}

export interface MCPToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, MCPToolParameterProperty>;
    required?: string[];
  };
}

export interface MCPRequest {
  jsonrpc: '2.0';
  id?: string | number;
  method: string;
  params?: any;
}

export interface MCPResponse {
  jsonrpc: '2.0';
  id?: string | number;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}
