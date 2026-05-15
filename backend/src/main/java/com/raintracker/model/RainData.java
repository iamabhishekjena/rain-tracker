package com.raintracker.model;

public class RainData {
    private String city;
    private String country;
    private double temperature;
    private double rainMm;
    private int humidity;
    private String description;
    private boolean isRaining;

    public RainData(String city, String country, double temperature,
                    double rainMm, int humidity, String description) {
        this.city = city;
        this.country = country;
        this.temperature = temperature;
        this.rainMm = rainMm;
        this.humidity = humidity;
        this.description = description;
        this.isRaining = rainMm > 0 || description.toLowerCase().contains("rain");
    }

    public String getCity() { return city; }
    public String getCountry() { return country; }
    public double getTemperature() { return temperature; }
    public double getRainMm() { return rainMm; }
    public int getHumidity() { return humidity; }
    public String getDescription() { return description; }
    public boolean isRaining() { return isRaining; }
}
