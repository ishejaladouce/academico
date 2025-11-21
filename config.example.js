/**
 * Copy this file to config.js and replace the placeholder values
 * with the credentials for your own Firebase project or API keys.
 * The file is ignored by git so secrets never leave your machine.
 */
window.__ACADEMICO_CONFIG = {
  firebase: {
    apiKey: "AIzaSyAuAmhkTWhWWUmJvdBYBydE8Wly0ZNHTBY",
    authDomain: "academico-chat.firebaseapp.com",
    databaseURL: "https://academico-chat-default-rtdb.firebaseio.com",
    projectId: "academico-chat",
    storageBucket: "academico-chat.firebasestorage.app",
    messagingSenderId: "786614809148",
    appId: "1:786614809148:web:31eada9340cb351f6b8939",
    measurementId: "G-6VVNVZK5C1",
  },
  apis: {
    worldTime: "https://ipapi.co/json/",
    weather:
      "https://api.open-meteo.com/v1/forecast?latitude=-1.95&longitude=30.06&current=temperature_2m,weather_code&timezone=Africa%2FCairo",
    quotes: "https://api.adviceslip.com/advice",
    universities:
      "https://raw.githubusercontent.com/Hipo/university-domains-list/master/world_universities_and_domains.json",
    countries: "https://restcountries.com/v3.1/all?fields=name,cca2",
  },
};

