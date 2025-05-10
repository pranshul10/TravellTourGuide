const fetch = require('node-fetch');

exports.getWeather = async (req, res) => {
  const { latitude, longitude } = req.query; 

  // --- Start of Parameter Validation ---
  if (!latitude || !longitude) {
    console.error("[WeatherController] PRE-VALIDATION: Missing latitude or longitude.");
    return res.status(400).json({ message: 'Latitude and longitude parameters are required' });
  }

  const latStr = String(latitude).trim(); // Trim any whitespace
  const lonStr = String(longitude).trim(); // Trim any whitespace

  const lat = parseFloat(latStr);
  const lon = parseFloat(lonStr);

  if (isNaN(lat) || isNaN(lon)) {
    console.error(`[WeatherController] PRE-VALIDATION: Invalid number format. Lat input: "${latStr}", Lon input: "${lonStr}"`);
    return res.status(400).json({ message: 'Latitude and longitude must be valid numbers' });
  }
  if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    console.error(`[WeatherController] PRE-VALIDATION: Lat/lon out of range. Parsed Lat: ${lat}, Parsed Lon: ${lon}`);
    return res.status(400).json({ message: 'Invalid latitude or longitude range.'});
  }
  // --- End of Parameter Validation ---

  // Construct the apiUrl
  const currentParams = "temperature_2m,weather_code,wind_speed_10m,relative_humidity_2m";
  const hourlyParams = "temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m";
  const dailyParams = "weather_code,temperature_2m_max,temperature_2m_min";
  
  // THIS IS THE MOST CRITICAL LINE - ENSURE NO TYPOS HERE
  const apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&t=${currentParams}&hourly=${hourlyParams}&daily=${dailyParams}&timezone=auto`;
  
  // --- LOGGING RIGHT BEFORE FETCH ---
  console.log("============================================================");
  console.log("[WeatherController] FINAL apiUrl SENT TO FETCH:", apiUrl);
  console.log("============================================================");
  // --- END LOGGING ---

  try {
    const weatherResponse = await fetch(apiUrl);
    const responseText = await weatherResponse.text(); 
    
    console.log("[WeatherController] Open-Meteo HTTP Status:", weatherResponse.status);
    // Only log a snippet of the text if it's very long to avoid flooding the console
    console.log("[WeatherController] Open-Meteo Response Text (first 300 chars):", responseText.substring(0, 300));

    let weatherData;
    try {
        weatherData = JSON.parse(responseText); 
    } catch (e) {
        console.error("[WeatherController] JSON PARSE ERROR on Open-Meteo response:", e.message);
        return res.status(500).json({ message: 'Received non-JSON or malformed JSON response from weather provider.' });
    }

    if (weatherData.error && weatherData.reason) {
        console.error('[WeatherController] Open-Meteo API LOGIC Error:', weatherData.reason);
        return res.status(400).json({ message: `Weather API Error: ${weatherData.reason}` });
    }
    
    if (!weatherResponse.ok) { // This implies HTTP status >= 400
         console.error('[WeatherController] Open-Meteo HTTP Error Status:', weatherResponse.status, "Parsed Data (if any):", weatherData);
         return res.status(weatherResponse.status || 500).json({ message: `Failed to fetch weather data. Provider returned HTTP status ${weatherResponse.status}.` });
    }

    // If we are here, it means weatherResponse.ok was true AND weatherData.error was false.
    // Process successful data (rest of the code remains the same as previous correct version)
    const hourlyForecasts = [];
    if (weatherData.hourly && weatherData.hourly.time) {
      for (let i = 0; i < weatherData.hourly.time.length; i++) {
        hourlyForecasts.push({
          time: weatherData.hourly.time[i],
          temperature: weatherData.hourly.temperature_2m ? weatherData.hourly.temperature_2m[i] : null,
          relative_humidity: weatherData.hourly.relative_humidity_2m ? weatherData.hourly.relative_humidity_2m[i] : null,
          wind_speed: weatherData.hourly.wind_speed_10m ? weatherData.hourly.wind_speed_10m[i] : null,
          weather_code: weatherData.hourly.weather_code ? weatherData.hourly.weather_code[i] : null,
        });
      }
    }
    
    const dailyForecasts = [];
    if (weatherData.daily && weatherData.daily.time) {
      for (let i = 0; i < weatherData.daily.time.length; i++) {
          dailyForecasts.push({
              time: weatherData.daily.time[i],
              temperature_max: weatherData.daily.temperature_2m_max ? weatherData.daily.temperature_2m_max[i] : null,
              temperature_min: weatherData.daily.temperature_2m_min ? weatherData.daily.temperature_2m_min[i] : null,
              weather_code: weatherData.daily.weather_code ? weatherData.daily.weather_code[i] : null,
          });
      }
    }

    console.log("[WeatherController] Successfully processed weather data.");
    res.json({
      latitude: weatherData.latitude,
      longitude: weatherData.longitude,
      timezone: weatherData.timezone,
      current_weather: weatherData.current ? {
          time: weatherData.current.time,
          temperature: weatherData.current.temperature_2m,
          wind_speed: weatherData.current.wind_speed_10m,
          weather_code: weatherData.current.weather_code,
          relative_humidity: weatherData.current.relative_humidity_2m,
      } : null,
      hourly: hourlyForecasts,
      daily: dailyForecasts,
      units: {
          temperature: weatherData.current_units?.temperature_2m || "°C",
          wind_speed: weatherData.current_units?.wind_speed_10m || "km/h",
          humidity: weatherData.current_units?.relative_humidity_2m || "%"
      }
    });

  } catch (err) { // Network errors or other unexpected issues with the fetch itself
    console.error('[WeatherController] CATCH BLOCK ERROR during fetch operation:', err);
    res.status(500).json({ message: 'Internal server error during the weather fetch operation.' });
  }
};