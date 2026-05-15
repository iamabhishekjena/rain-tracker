# Rain Tracker

A weather rain tracking app built with Spring Boot (Java) and React.

## Features
- Search any city worldwide
- Shows current rain (mm/h), temperature, humidity, and weather condition
- Live data from OpenWeatherMap API

## Setup

### 1. Get an API key
Sign up at [openweathermap.org](https://openweathermap.org/api) and get a free API key.

### 2. Backend
```bash
cd backend
# Set your API key in src/main/resources/application.properties
./mvnw spring-boot:run
```

### 3. Frontend
```bash
cd frontend
npm install
npm start
```

App runs at `http://localhost:3000`, backend at `http://localhost:8080`.
