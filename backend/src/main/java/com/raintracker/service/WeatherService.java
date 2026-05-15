package com.raintracker.service;

import com.raintracker.model.RainData;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.Map;

@Service
public class WeatherService {

    @Value("${weather.api.key}")
    private String apiKey;

    @Value("${weather.api.base-url}")
    private String baseUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    @SuppressWarnings("unchecked")
    public RainData getRainData(String city) {
        String url = UriComponentsBuilder.fromHttpUrl(baseUrl + "/weather")
                .queryParam("q", city)
                .queryParam("appid", apiKey)
                .queryParam("units", "metric")
                .toUriString();

        Map<String, Object> response = restTemplate.getForObject(url, Map.class);
        if (response == null) throw new RuntimeException("No response from weather API");

        Map<String, Object> main = (Map<String, Object>) response.get("main");
        Map<String, Object> rain = (Map<String, Object>) response.getOrDefault("rain", Map.of());
        Map<String, Object> sys = (Map<String, Object>) response.get("sys");
        Map<String, Object> weatherInfo = ((java.util.List<Map<String, Object>>) response.get("weather")).get(0);

        double temp = ((Number) main.get("temp")).doubleValue();
        int humidity = ((Number) main.get("humidity")).intValue();
        double rainMm = rain.containsKey("1h") ? ((Number) rain.get("1h")).doubleValue() : 0.0;
        String description = (String) weatherInfo.get("description");
        String country = (String) sys.get("country");

        return new RainData(city, country, temp, rainMm, humidity, description);
    }
}
