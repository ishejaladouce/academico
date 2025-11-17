// SIMPLE API Service - Basic JavaScript with FREE APIs
const apiService = {
    // Free APIs - No payment required
    baseURLs: {
        timezone: 'https://worldtimeapi.org/api/ip',
        bored: 'https://boredapi.com/api/activity'
    },
    
    apiCallCount: 0,

    // Get user's timezone - SIMPLE VERSION
    async getUserTimezone() {
        try {
            console.log('🕐 Getting user timezone...');
            this.apiCallCount++;
            
            const response = await fetch(this.baseURLs.timezone);
            
            if (!response.ok) {
                throw new Error(`Timezone API error: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('✅ Timezone data:', data.timezone);
            
            return {
                timezone: data.timezone,
                datetime: data.datetime,
                success: true
            };
            
        } catch (error) {
            console.log('❌ Timezone API failed, using browser time');
            return {
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                datetime: new Date().toISOString(),
                success: false,
                error: error.message
            };
        }
    },

    // Get study break activity - SIMPLE VERSION
    async getStudyBreakActivity() {
        try {
            console.log('🎯 Getting study break activity...');
            this.apiCallCount++;
            
            const response = await fetch(this.baseURLs.bored);
            
            if (!response.ok) {
                throw new Error(`Bored API error: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('✅ Study break activity:', data.activity);
            
            return {
                activity: data.activity,
                type: data.type,
                participants: data.participants,
                success: true
            };
            
        } catch (error) {
            console.log('❌ Study break API failed');
            throw new Error(`Failed to get study break: ${error.message}`);
        }
    },

    // Get API usage stats
    getApiStats() {
        return {
            totalCalls: this.apiCallCount,
            apisUsed: ['World Time API', 'Bored API'],
            status: 'Active'
        };
    }
};