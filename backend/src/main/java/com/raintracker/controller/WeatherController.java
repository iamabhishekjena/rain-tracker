package com.raintracker.controller;

import com.raintracker.model.RainData;
import com.raintracker.service.WeatherService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/weather")
@CrossOrigin(origins = "http://localhost:3000")
public class WeatherController {

    private final WeatherService weatherService;

    public WeatherController(WeatherService weatherService) {
        this.weatherService = weatherService;
    }

    @GetMapping("/rain")
    public ResponseEntity<RainData> getRainData(@RequestParam String city) {
        RainData data = weatherService.getRainData(city);
        return ResponseEntity.ok(data);
    }
}
