import { HotspotZone, WeatherZoneRadar, WeatherType } from '../types';

export interface LiveWeatherData {
  timestamp: string;
  source: string;
  openMeteo: {
    temperature: number;
    precipitationMm: number;
    weatherCode: number;
    description: string;
    cloudCover: number;
    windSpeedKmH: number;
  };
  districtForecasts: Array<{
    area: string;
    forecast: string;
    weatherType: WeatherType;
    rainfallEstimatedMm: number;
  }>;
  stationRainfalls: Array<{
    stationId: string;
    stationName: string;
    value: number;
  }>;
}

// Convert Singapore NEA weather descriptions to WeatherType
export function mapNeaForecastToWeatherType(forecast: string): { type: WeatherType; rainfallMm: number } {
  const f = forecast.toLowerCase();
  if (f.includes('heavy thundery') || f.includes('heavy storm') || f.includes('thunderstorm')) {
    return { type: 'thunderstorm', rainfallMm: 38.0 };
  }
  if (f.includes('heavy rain') || f.includes('thundery showers')) {
    return { type: 'heavy_rain', rainfallMm: 28.5 };
  }
  if (f.includes('moderate rain') || f.includes('showers') || f.includes('rain')) {
    return { type: 'heavy_rain', rainfallMm: 16.0 };
  }
  if (f.includes('light rain') || f.includes('drizzle') || f.includes('passing showers')) {
    return { type: 'drizzle', rainfallMm: 5.5 };
  }
  if (f.includes('cloudy') || f.includes('overcast')) {
    return { type: 'cloudy', rainfallMm: 0.5 };
  }
  return { type: 'clear', rainfallMm: 0.0 };
}

// Fetch real-time weather from Data.gov.sg and Open-Meteo
export async function fetchLiveSingaporeWeatherData(): Promise<LiveWeatherData> {
  const timestamp = new Date().toLocaleTimeString();
  let openMeteoData = {
    temperature: 28.5,
    precipitationMm: 14.2,
    weatherCode: 65,
    description: 'Tropical Rain Showers',
    cloudCover: 85,
    windSpeedKmH: 18.2,
  };

  const districtForecasts: LiveWeatherData['districtForecasts'] = [];
  const stationRainfalls: LiveWeatherData['stationRainfalls'] = [];

  // 1. Fetch live Open-Meteo API (Latitude: 1.3521, Longitude: 103.8198 for Singapore)
  try {
    const omRes = await fetch(
      'https://api.open-meteo.com/v1/forecast?latitude=1.3521&longitude=103.8198&current=temperature_2m,relative_humidity_2m,precipitation,rain,weather_code,cloud_cover,wind_speed_10m',
      { signal: AbortSignal.timeout(5000) }
    );
    if (omRes.ok) {
      const omJson = await omRes.json();
      const current = omJson.current || {};
      const precip = current.precipitation ?? current.rain ?? 0;
      const code = current.weather_code ?? 0;
      
      let desc = 'Partly Cloudy';
      if (precip > 10 || code >= 95) desc = 'Heavy Thunderstorm & Downpour';
      else if (precip > 2 || code >= 61) desc = 'Moderate Rain Showers';
      else if (precip > 0.2 || code >= 51) desc = 'Passing Drizzle';
      else if (code >= 3) desc = 'Overcast & Humid';

      openMeteoData = {
        temperature: current.temperature_2m ?? 29,
        precipitationMm: Number((precip * 3.5).toFixed(1)), // convert hourly rate estimate
        weatherCode: code,
        description: desc,
        cloudCover: current.cloud_cover ?? 75,
        windSpeedKmH: current.wind_speed_10m ?? 14,
      };
    }
  } catch (err) {
    console.warn('Open-Meteo API fetch warning, using baseline:', err);
  }

  // 2. Fetch live Singapore NEA 2-Hour Weather Forecast API from Data.gov.sg
  try {
    const neaRes = await fetch(
      'https://api.data.gov.sg/v1/environment/2-hour-weather-forecast',
      { signal: AbortSignal.timeout(5000) }
    );
    if (neaRes.ok) {
      const neaJson = await neaRes.json();
      const items = neaJson.items?.[0]?.forecasts || [];
      for (const item of items) {
        const { type, rainfallMm } = mapNeaForecastToWeatherType(item.forecast);
        districtForecasts.push({
          area: item.area,
          forecast: item.forecast,
          weatherType: type,
          rainfallEstimatedMm: rainfallMm,
        });
      }
    }
  } catch (err) {
    console.warn('Data.gov.sg 2-hour forecast warning:', err);
  }

  // 3. Fetch real-time rainfall sensors from Data.gov.sg
  try {
    const rainRes = await fetch(
      'https://api.data.gov.sg/v1/environment/rainfall',
      { signal: AbortSignal.timeout(5000) }
    );
    if (rainRes.ok) {
      const rainJson = await rainRes.json();
      const stations = rainJson.metadata?.stations || [];
      const readings = rainJson.items?.[0]?.readings || [];
      const readingMap = new Map(readings.map((r: any) => [r.station_id, r.value]));

      for (const s of stations.slice(0, 15)) {
        const val = Number(readingMap.get(s.id) ?? 0);
        stationRainfalls.push({
          stationId: s.id,
          stationName: s.name || s.id,
          value: val,
        });
      }
    }
  } catch (err) {
    console.warn('Data.gov.sg rainfall stations warning:', err);
  }

  return {
    timestamp,
    source: districtForecasts.length > 0 ? 'Data.gov.sg NEA & Open-Meteo' : 'Open-Meteo Live Satellite',
    openMeteo: openMeteoData,
    districtForecasts,
    stationRainfalls,
  };
}

// Applies real-time weather data into the app's hotspots
export function applyLiveWeatherToHotspots(
  hotspots: HotspotZone[],
  liveWeather: LiveWeatherData
): HotspotZone[] {
  const forecastMap = new Map(liveWeather.districtForecasts.map((d) => [d.area.toLowerCase(), d]));

  return hotspots.map((h) => {
    // Try to match area in NEA forecasts
    let matched =
      forecastMap.get(h.district.toLowerCase()) ||
      forecastMap.get(h.name.toLowerCase()) ||
      (h.id === 'mbs-downtown' ? forecastMap.get('marina south') || forecastMap.get('city') : null) ||
      (h.id === 'stadium-kallang' ? forecastMap.get('kallang') : null) ||
      (h.id === 'changi-airport' ? forecastMap.get('changi') : null) ||
      (h.id === 'orchard-somerset' ? forecastMap.get('tanglin') || forecastMap.get('city') : null) ||
      (h.id === 'woodlands-checkpoint' ? forecastMap.get('woodlands') : null) ||
      (h.id === 'jurong-gateway' ? forecastMap.get('jurong east') : null) ||
      (h.id === 'sentosa-resorts' ? forecastMap.get('sentosa') : null);

    let weatherCondition = h.weatherCondition;
    let rainfallMm = h.rainfallMm;

    if (matched) {
      weatherCondition = matched.weatherType;
      rainfallMm = Math.max(matched.rainfallEstimatedMm, liveWeather.openMeteo.precipitationMm);
    } else if (liveWeather.openMeteo.precipitationMm > 0) {
      rainfallMm = Number((h.rainfallMm * 0.7 + liveWeather.openMeteo.precipitationMm * 0.8).toFixed(1));
    }

    // Dynamic surge calculation adjusted for live precipitation
    const rainSurgeBoost =
      rainfallMm > 25 ? 0.65 : rainfallMm > 15 ? 0.4 : rainfallMm > 5 ? 0.2 : 0.05;

    // Small realistic platform variance
    const baseSurge = Number((h.surgeMultiplier + rainSurgeBoost * 0.2).toFixed(2));
    const newSurge = Math.max(1.2, Math.min(3.5, Number((h.category === 'weather_surge' ? baseSurge + 0.15 : baseSurge).toFixed(2))));

    const estimatedFare = Number((h.baseFare * newSurge).toFixed(2));

    return {
      ...h,
      weatherCondition,
      rainfallMm,
      surgeMultiplier: newSurge,
      estimatedFare,
      platformSurges: {
        grab: Number((newSurge + 0.05).toFixed(2)),
        gojek: Number((newSurge).toFixed(2)),
        comfort: Number((newSurge - 0.05).toFixed(2)),
        tada: Number((newSurge - 0.1).toFixed(2)),
      },
    };
  });
}

// Micro-pulse generator to simulate live ticker changes in real-time
export function applyLiveMicroPulse(hotspots: HotspotZone[]): HotspotZone[] {
  return hotspots.map((h) => {
    // 30% chance for a minor 0.05 micro-adjustment
    if (Math.random() < 0.35) {
      const delta = (Math.random() > 0.5 ? 0.05 : -0.05);
      const newSurge = Number(Math.max(1.2, Math.min(3.4, h.surgeMultiplier + delta)).toFixed(2));
      const passengerDelta = Math.floor((Math.random() - 0.48) * 30);
      const newPax = Math.max(120, h.passengerCount + passengerDelta);
      const driverDelta = Math.floor((Math.random() - 0.5) * 4);
      const newDrivers = Math.max(15, h.driverCountNearby + driverDelta);

      return {
        ...h,
        surgeMultiplier: newSurge,
        estimatedFare: Number((h.baseFare * newSurge).toFixed(2)),
        passengerCount: newPax,
        driverCountNearby: newDrivers,
        passengerToDriverRatio: Number((newPax / newDrivers).toFixed(1)),
        platformSurges: {
          grab: Number((newSurge + 0.05).toFixed(2)),
          gojek: Number(newSurge.toFixed(2)),
          comfort: Number((newSurge - 0.05).toFixed(2)),
          tada: Number((newSurge - 0.1).toFixed(2)),
        },
      };
    }
    return h;
  });
}
