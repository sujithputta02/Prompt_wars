/**
 * Weather Service
 * Integrates with WeatherAPI.com for real-time weather data
 */

let warningLogged = false; // Only log warning once

export interface WeatherData {
  temperature: number;
  condition: string;
  severity: number; // 0-100
  visibility: number; // 0-100
  precipitation: number; // 0-100
}

/**
 * Fetch weather data for a location
 */
export const fetchWeatherData = async (
  lat: number,
  lng: number
): Promise<WeatherData> => {
  const apiKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;

  if (!apiKey) {
    if (!warningLogged) {
      console.log('[Velora] Using mock weather data (add WeatherAPI key for real data)');
      warningLogged = true;
    }
    return getMockWeather();
  }

  try {
    const response = await fetch(
      `https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${lat},${lng}&aqi=no`
    );

    if (!response.ok) {
      if (!warningLogged) {
        console.warn(`[Velora] WeatherAPI error (${response.status}). Using mock data.`);
        warningLogged = true;
      }
      return getMockWeather();
    }

    const data = await response.json();
    return parseWeatherResponse(data);
  } catch (err) {
    if (!warningLogged) {
      console.warn('[Velora] Weather API unavailable. Using mock data.');
      warningLogged = true;
    }
    return getMockWeather();
  }
};

/**
 * Parse WeatherAPI.com response
 */
const parseWeatherResponse = (data: Record<string, unknown>): WeatherData => {
  const current = (data.current as Record<string, unknown>) || {};
  const condition = (current.condition as Record<string, unknown>)?.text as string || 'Clear';
  
  // Calculate severity based on weather condition
  let severity = 20; // Base severity
  const conditionLower = condition.toLowerCase();

  if (conditionLower.includes('clear') || conditionLower.includes('sunny')) {
    severity = 10;
  } else if (conditionLower.includes('cloud') || conditionLower.includes('overcast')) {
    severity = 25;
  } else if (conditionLower.includes('rain') || conditionLower.includes('drizzle')) {
    severity = 60;
  } else if (conditionLower.includes('thunder') || conditionLower.includes('storm')) {
    severity = 90;
  } else if (conditionLower.includes('snow') || conditionLower.includes('blizzard')) {
    severity = 75;
  } else if (conditionLower.includes('mist') || conditionLower.includes('fog')) {
    severity = 50;
  } else {
    severity = 40;
  }

  // Adjust severity based on wind speed
  const windKph = (current.wind_kph as number) || 0;
  if (windKph > 40) severity += 15;
  else if (windKph > 25) severity += 10;

  return {
    temperature: Math.round((current.temp_c as number) || 20),
    condition,
    severity: Math.min(100, severity),
    visibility: Math.round(((current.vis_km as number) || 10) * 10), // Convert km to 0-100 scale
    precipitation: (current.precip_mm as number) || 0,
  };
};

/**
 * Mock weather data for demo
 */
const getMockWeather = (): WeatherData => {
  return {
    temperature: 22,
    condition: 'Partly Cloudy',
    severity: 25,
    visibility: 85,
    precipitation: 0,
  };
};

/**
 * Get weather severity description
 */
export const getWeatherDescription = (severity: number): string => {
  if (severity < 20) return 'Clear';
  if (severity < 40) return 'Partly Cloudy';
  if (severity < 60) return 'Cloudy';
  if (severity < 75) return 'Rainy';
  return 'Severe Weather';
};
