// SILENT API Service - No Console Errors
const apiService = {
  baseURLs: {
    timezone: "https://worldtimeapi.org/api/ip",
    bored: "https://boredapi.com/api/activity",
  },

  apiCallCount: 0,

  // Get user's timezone - SILENT version
  async getUserTimezone() {
    try {
      this.apiCallCount++;

      // Try primary API with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const response = await fetch(this.baseURLs.timezone, {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        return {
          timezone: data.timezone,
          datetime: data.datetime,
          success: true,
          source: "WorldTimeAPI",
        };
      }
    } catch (error) {
      // Silent fallback - no console errors
    }

    // Always successful fallback
    const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return {
      timezone: browserTimezone,
      datetime: new Date().toISOString(),
      success: true,
      source: "Browser",
      fallback: true,
    };
  },

  // Get study break activity
  async getStudyBreakActivity() {
    try {
      this.apiCallCount++;
      const response = await fetch(this.baseURLs.bored);

      if (response.ok) {
        const data = await response.json();
        return {
          activity: data.activity,
          type: data.type,
          participants: data.participants,
          success: true,
        };
      }
    } catch (error) {
      // Silent fallback
    }

    // Fallback study break
    return {
      activity: "Take a 5-minute walk and stretch",
      type: "relaxation",
      participants: 1,
      success: true,
      fallback: true,
    };
  },

  getApiStats() {
    return {
      totalCalls: this.apiCallCount,
      apisUsed: ["World Time API", "Bored API"],
      status: "Robust with Silent Fallbacks",
    };
  },
};

// Enhanced timezone functionality
const timezoneService = {
  // Get detailed timezone info
  getDetailedTimezone() {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const now = new Date();
    const offset = -now.getTimezoneOffset() / 60;

    return {
      timezone,
      offset,
      currentHour: now.getHours(),
      dayPeriod: this.getDayPeriod(now.getHours()),
      location: this.getTimezoneLocation(timezone),
    };
  },

  getDayPeriod(hour) {
    if (hour >= 5 && hour < 12) return "morning";
    if (hour >= 12 && hour < 17) return "afternoon";
    if (hour >= 17 && hour < 22) return "evening";
    return "night";
  },

  getTimezoneLocation(tz) {
    // Simple location extraction from timezone string
    const parts = tz.split("/");
    return parts.length > 1 ? parts[1].replace("_", " ") : "Unknown";
  },

  // Calculate compatibility between two timezones
  calculateCompatibility(userTz, partnerTz) {
    const diff = Math.abs(userTz.offset - partnerTz.offset);

    if (diff <= 2)
      return { score: 95, level: "excellent", label: "Same Region" };
    if (diff <= 4) return { score: 80, level: "good", label: "Nearby" };
    if (diff <= 6) return { score: 65, level: "fair", label: "Moderate" };
    return { score: 50, level: "challenging", label: "Distant" };
  },
};
