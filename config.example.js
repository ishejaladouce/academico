// Copy this file to config.js and replace the placeholder values
// with your own Firebase project credentials
// The config.js file is ignored by git to keep your secrets safe

window.__ACADEMICO_CONFIG = {
  firebase: {
    apiKey: "YOUR_API_KEY_HERE",
    authDomain: "academico-23423.firebaseapp.com",
    databaseURL: "https://academico-23423-default-rtdb.firebaseio.com",
    projectId: "academico-23423",
    storageBucket: "academico-23423.appspot.com",
    messagingSenderId: "103950801109",
    appId: "1:103950801109:web:1234567890abcdef123456",
    measurementId: "G-1234567890",
  },
  apis: {
    worldTime: "https://ipapi.co/json/",
    weather: "https://api.open-meteo.com/v1/forecast?latitude=-1.95&longitude=30.06&current=temperature_2m,weather_code&timezone=Africa%2FCairo",
    quotes: "https://api.adviceslip.com/advice",
    universities: "https://raw.githubusercontent.com/Hipo/university-domains-list/master/world_universities_and_domains.json",
    countries: "https://restcountries.com/v3.1/all?fields=name,cca2",
  },
};
