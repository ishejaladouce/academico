// Copy this file to config.js and replace the placeholder values
// with your own Firebase project credentials
// The config.js file is ignored by git to keep your secrets safe

window.__ACADEMICO_CONFIG = {
  firebase: {
    apiKey: "YOUR_API_KEY_HERE",
    authDomain: "your-project.firebaseapp.com",
    databaseURL: "https://your-project-default-rtdb.firebaseio.com",
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID",
    measurementId: "YOUR_MEASUREMENT_ID",
  },
  apis: {
    worldTime: "https://ipapi.co/json/",
    weather: "https://api.open-meteo.com/v1/forecast?latitude=-1.95&longitude=30.06&current=temperature_2m,weather_code&timezone=Africa%2FCairo",
    quotes: "https://api.adviceslip.com/advice",
    universities: "https://raw.githubusercontent.com/Hipo/university-domains-list/master/world_universities_and_domains.json",
    countries: "https://restcountries.com/v3.1/all?fields=name,cca2",
  },
};
