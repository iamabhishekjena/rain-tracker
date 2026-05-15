package com.raintracker.service;

import com.raintracker.model.RainData;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.List;
import java.util.Map;

@Service
public class WeatherService {

    private final RestTemplate restTemplate = new RestTemplate();

    private static final String GEO_URL = "https://geocoding-api.open-meteo.com/v1/search";
    private static final String WEATHER_URL = "https://api.open-meteo.com/v1/forecast";

    @SuppressWarnings("unchecked")
    public RainData getRainData(String city) {
        String geoUrl = UriComponentsBuilder.fromHttpUrl(GEO_URL)
                .queryParam("name", city)
                .queryParam("count", 1)
                .queryParam("language", "en")
                .queryParam("format", "json")
                .toUriString();

        Map<String, Object> geoResponse = restTemplate.getForObject(geoUrl, Map.class);
        if (geoResponse == null || !geoResponse.containsKey("results")) {
            throw new RuntimeException("City not found: " + city);
        }

        List<Map<String, Object>> results = (List<Map<String, Object>>) geoResponse.get("results");
        if (results.isEmpty()) throw new RuntimeException("City not found: " + city);

        Map<String, Object> location = results.get(0);
        double lat = ((Number) location.get("latitude")).doubleValue();
        double lon = ((Number) location.get("longitude")).doubleValue();
        String country = (String) location.getOrDefault("country_code", "");

        String weatherUrl = UriComponentsBuilder.fromHttpUrl(WEATHER_URL)
                .queryParam("latitude", lat)
                .queryParam("longitude", lon)
                .queryParam("current", "temperature_2m,relative_humidity_2m,precipitation,weather_code")
                .queryParam("timezone", "auto")
                .toUriString();

        Map<String, Object> weatherResponse = restTemplate.getForObject(weatherUrl, Map.class);
        if (weatherResponse == null) throw new RuntimeException("No weather data returned");

        Map<String, Object> current = (Map<String, Object>) weatherResponse.get("current");
        double temp = ((Number) current.get("temperature_2m")).doubleValue();
        int humidity = ((Number) current.get("relative_humidity_2m")).intValue();
        double rainMm = ((Number) current.get("precipitation")).doubleValue();
        int weatherCode = ((Number) current.get("weather_code")).intValue();
        String description = describeWeatherCode(weatherCode);

        return new RainData(city, country.toUpperCase(), temp, rainMm, humidity, description);
    }

    private String describeWeatherCode(int code) {
        if (code == 0) return "clear sky";
        if (code <= 3) return "partly cloudy";
        if (code <= 48) return "foggy";
        if (code <= 55) return "drizzle";
        if (code <= 65) return "rain";
        if (code <= 75) return "snow";
        if (code <= 82) return "rain showers";
        if (code <= 86) return "snow showers";
        return "thunderstorm";
    }
}
