# AcademicO - Study Partner Matching Platform

## Overview
AcademicO is a web application that helps students find study partners based on their courses, availability, and learning preferences.

## Features
- User registration and authentication
- Search for study partners with filters (course, topic, availability, etc.)
- Real-time messaging
- Admin dashboard for platform management

## Local Development

### Prerequisites
- A modern web browser
- A Firebase project (for authentication and real-time database)

### Setup
1. Clone the repository
2. Create a `config.js` file from `config.example.js` and fill in your Firebase configuration and API keys.
3. Open `index.html` in a web browser.

### APIs Used
- Firebase (authentication and Firestore)
- [Countries API](https://restcountries.com/) for country list
- [Universities API](https://github.com/Hipo/university-domains-list) for university list
- [Advice Slip API](https://api.adviceslip.com/) for study break quotes
- [Open-Meteo](https://open-meteo.com/) for weather 

## Deployment

### Web Servers (Web01 and Web02)
1. Upload the project files to both web servers.
2. Ensure the web servers are configured to serve the files (e.g., using Apache or Nginx).
3. Test that the application runs on both servers individually.

### Load Balancer (Lb01)
1. Configure the load balancer to distribute traffic between Web01 and Web02.
2. Test the load balancer by accessing the application via the load balancer's address.

## Demo Video
[----] - The video demonstrates the application running locally and via the load balancer.

## License
----

## Acknowledgments
- [Firebase](https://firebase.google.com/)
- [Countries API](https://restcountries.com/)
- [Universities API](https://github.com/Hipo/university-domains-list)
- [Advice Slip API](https://api.adviceslip.com/)
- [Open-Meteo](https://open-meteo.com/)

# Deployment Instructions
## Server Setup
1. Upload files to Web01 and Web02
2. Configure web servers...
3. Set up load balancer...

## Local Development
1. Clone repo
2. Create config.js from config.example.js
3. Open index.html