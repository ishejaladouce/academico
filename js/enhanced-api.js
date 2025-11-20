// Enhanced API Service for AcademicO - Fixed APIs
class EnhancedAPIService {
  constructor() {
    this.apiCallCount = 0;
    this.apiStatus = {
      worldTime: "unknown",
      weather: "unknown",
      quotes: "unknown",
      countries: "unknown",
    };
  }

  // ==================== FIXED & WORKING APIS ====================

  // 1. WorldTimeAPI for timezone compatibility (RELIABLE API)
  async getEnhancedTimezoneData() {
    this.apiCallCount++;
    try {
      const response = await fetch("https://worldtimeapi.org/api/ip");
      if (!response.ok) throw new Error("Timezone API failed");

      const data = await response.json();
      this.apiStatus.worldTime = "active";

      return {
        timezone: data.timezone,
        datetime: data.datetime,
        dayOfWeek: data.day_of_week,
        weekNumber: data.week_number,
        success: true,
        source: "WorldTimeAPI",
      };
    } catch (error) {
      this.apiStatus.worldTime = "inactive";
      // Fallback to browser timezone
      const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      return {
        timezone: browserTimezone,
        datetime: new Date().toISOString(),
        dayOfWeek: new Date().getDay(),
        weekNumber: this.getWeekNumber(new Date()),
        success: true,
        source: "Browser Fallback",
        fallback: true,
      };
    }
  }

  // 2. FREE Weather API that doesn't require key (RELIABLE API)
  async getStudyWeather(city = "Kigali") {
    this.apiCallCount++;
    try {
      // Using free weather API that doesn't require authentication
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=-1.95&longitude=30.06&current=temperature_2m,weather_code&timezone=Africa%2FCairo`
      );

      if (!response.ok) throw new Error("Weather API failed");

      const data = await response.json();
      this.apiStatus.weather = "active";

      // Convert weather code to description
      const weatherDescription = this.getWeatherDescription(
        data.current.weather_code
      );

      return {
        temperature: Math.round(data.current.temperature_2m),
        conditions: weatherDescription,
        studySuggestion: this.generateStudySuggestion(
          data.current.temperature_2m,
          weatherDescription
        ),
        city: city,
        success: true,
        source: "Open-Meteo API",
      };
    } catch (error) {
      this.apiStatus.weather = "inactive";
      // Fallback weather data
      return {
        temperature: 22,
        conditions: "Clear sky",
        studySuggestion: "Perfect weather for focused studying!",
        city: city,
        success: true,
        source: "Fallback Data",
        fallback: true,
      };
    }
  }

  // 3. FREE Quotes API that actually works (RELIABLE API)
  async getStudyQuote() {
    this.apiCallCount++;
    try {
      // Using a different quotes API that's more reliable
      const response = await fetch("https://api.adviceslip.com/advice");
      if (!response.ok) throw new Error("Quotes API failed");

      const data = await response.json();
      this.apiStatus.quotes = "active";

      return {
        quote: data.slip.advice,
        author: "Study Wisdom",
        tags: ["education", "learning"],
        success: true,
        source: "Advice Slip API",
      };
    } catch (error) {
      this.apiStatus.quotes = "inactive";
      // Fallback quotes
      const fallbackQuotes = [
        {
          quote:
            "The beautiful thing about learning is that no one can take it away from you.",
          author: "B.B. King",
          tags: ["education", "learning"],
        },
        {
          quote:
            "Education is the most powerful weapon which you can use to change the world.",
          author: "Nelson Mandela",
          tags: ["education", "change"],
        },
        {
          quote:
            "The mind is not a vessel to be filled, but a fire to be kindled.",
          author: "Plutarch",
          tags: ["knowledge", "learning"],
        },
      ];
      const randomQuote =
        fallbackQuotes[Math.floor(Math.random() * fallbackQuotes.length)];
      return {
        ...randomQuote,
        success: true,
        source: "Fallback Quotes",
        fallback: true,
      };
    }
  }

  // 4. Enhanced Countries API with universities
  async getCountryUniversities(country) {
    this.apiCallCount++;
    try {
      const response = await fetch(
        `http://universities.hipolabs.com/search?country=${encodeURIComponent(
          country
        )}`
      );
      if (!response.ok) throw new Error("Universities API failed");

      const data = await response.json();
      this.apiStatus.countries = "active";

      return {
        universities: data.slice(0, 50).map((uni) => ({
          // Get top 50 universities
          name: uni.name,
          website: uni.web_pages[0],
          country: uni.country,
        })),
        count: data.length,
        success: true,
        source: "HipoLabs Universities API",
      };
    } catch (error) {
      this.apiStatus.countries = "inactive";
      // Fallback universities data
      return {
        universities: this.getFallbackUniversities(country),
        count: 10,
        success: true,
        source: "Fallback Universities",
        fallback: true,
      };
    }
  }

  // ==================== UTILITY METHODS ====================

  getWeatherDescription(weatherCode) {
    const weatherMap = {
      0: "Clear sky",
      1: "Mainly clear",
      2: "Partly cloudy",
      3: "Overcast",
      45: "Foggy",
      48: "Foggy",
      51: "Light drizzle",
      53: "Moderate drizzle",
      55: "Dense drizzle",
      61: "Slight rain",
      63: "Moderate rain",
      65: "Heavy rain",
      80: "Rain showers",
      81: "Rain showers",
      82: "Violent rain showers",
      95: "Thunderstorm",
    };
    return weatherMap[weatherCode] || "Clear sky";
  }

  generateStudySuggestion(temperature, conditions) {
    if (temperature > 30)
      return "Stay hydrated! Consider studying in a cool, air-conditioned space.";
    if (temperature < 15)
      return "Perfect weather for cozy indoor studying with a warm drink.";
    if (
      conditions.toLowerCase().includes("rain") ||
      conditions.toLowerCase().includes("drizzle")
    )
      return "Rainy day - great for focused, uninterrupted study sessions!";
    if (
      conditions.toLowerCase().includes("clear") ||
      conditions.toLowerCase().includes("sunny")
    )
      return "Beautiful clear weather - consider studying outdoors if possible!";
    return "Good conditions for productive studying!";
  }

  getFallbackUniversities(country) {
    const fallbackData = {
      Rwanda: [
        { name: "University of Rwanda", website: "https://www.ur.ac.rw" },
        {
          name: "Kigali Independent University",
          website: "https://www.ulk.ac.rw",
        },
        {
          name: "Adventist University of Central Africa",
          website: "https://www.auca.ac.rw",
        },
      ],
      Kenya: [
        { name: "University of Nairobi", website: "https://www.uonbi.ac.ke" },
        { name: "Kenyatta University", website: "https://www.ku.ac.ke" },
        {
          name: "Strathmore University",
          website: "https://www.strathmore.edu",
        },
      ],
      Uganda: [
        { name: "Makerere University", website: "https://www.mak.ac.ug" },
        { name: "Kyambogo University", website: "https://www.kyu.ac.ug" },
        {
          name: "Uganda Christian University",
          website: "https://www.ucu.ac.ug",
        },
      ],
    };

    return (
      fallbackData[country] || [
        { name: "Local University", website: "#" },
        { name: "Community College", website: "#" },
      ]
    );
  }

  getWeekNumber(date) {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  }

  getAPIStats() {
    return {
      totalCalls: this.apiCallCount,
      apisUsed: [
        "WorldTimeAPI",
        "Open-Meteo",
        "Advice Slip API",
        "HipoLabs Universities API",
      ],
      status: this.apiStatus,
      activeAPIs: Object.values(this.apiStatus).filter(
        (status) => status === "active"
      ).length,
      totalAPIs: Object.keys(this.apiStatus).length,
    };
  }

  // Study session recommendation based on multiple APIs
  async getStudySessionRecommendation() {
    const [timezoneData, weatherData, quoteData] = await Promise.all([
      this.getEnhancedTimezoneData(),
      this.getStudyWeather(),
      this.getStudyQuote(),
    ]);

    return {
      recommendation: this.generateSessionRecommendation(
        timezoneData,
        weatherData
      ),
      timezone: timezoneData,
      weather: weatherData,
      motivation: quoteData,
      generatedAt: new Date().toISOString(),
    };
  }

  generateSessionRecommendation(timezone, weather) {
    const hour = new Date(timezone.datetime).getHours();
    const isWeekend = [0, 6].includes(timezone.dayOfWeek);

    let recommendation = "";

    // Time-based recommendations
    if (hour >= 5 && hour < 12) {
      recommendation += "Morning hours are perfect for learning new concepts. ";
    } else if (hour >= 12 && hour < 18) {
      recommendation += "Afternoon is great for practice and group study. ";
    } else {
      recommendation += "Evening is ideal for review and reflection. ";
    }

    // Weather-based recommendations
    recommendation += weather.studySuggestion;

    // Weekend vs weekday
    if (isWeekend) {
      recommendation +=
        " Since it's the weekend, consider longer study sessions with breaks.";
    } else {
      recommendation += " Plan shorter, focused sessions during weekdays.";
    }

    return recommendation;
  }
}

// Global instance
const enhancedAPI = new EnhancedAPIService();
