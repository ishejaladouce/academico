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
