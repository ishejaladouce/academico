# AcademicO - Study Partner Matching Platform

A modern web application that connects students with compatible study partners based on their courses, availability, and learning preferences. Built entirely with vanilla JavaScript and Firebase, providing a seamless experience for students to find study buddies, form groups, and collaborate effectively.

## Overview

AcademicO is a full-featured study partner matching platform that helps students:
- Find study partners who share similar courses and interests
- Connect with students from their university or around the world
- Create and manage study groups
- Chat in real-time with connections and group members
- Access their dashboard with personalized statistics and activities

The platform includes a comprehensive admin dashboard for managing users, monitoring platform activity, and viewing real-time statistics.

## Features

### Core Functionality

**User Authentication**
- Secure email and password registration
- Password hashing using SHA-256
- Password reset functionality with temporary passwords
- Session management with localStorage

**Partner Search & Matching**
- Advanced search filters by course, topic, availability, country, and university
- Dynamic suggestions based on course similarity and common interests
- Real-time search results with user profiles
- Custom university input for unlisted institutions

**Connections Management**
- Send and receive connection requests
- Accept or reject incoming requests
- View all active connections
- Connection status tracking

**Real-time Messaging**
- One-on-one chat with study partners
- Group chat functionality for study groups
- Real-time message updates using Firestore listeners
- Message history and conversation management

**Study Groups**
- Create study groups with name and purpose
- Invite connections to join groups
- View group members and details
- Group chat for collaborative discussions
- Track active study groups

**Admin Dashboard**
- Real-time platform statistics
- User management (view, suspend, activate, delete)
- Recent activities monitoring
- Data export functionality
- API status monitoring
- Settings and configuration management

### Additional Features

- **Dark/Light Mode**: Toggle between themes with persistent preference
- **Weather Widget**: Real-time weather information on homepage
- **Study Break Quotes**: Motivational quotes to keep students inspired
- **Real-time Statistics**: Live updates of users, courses, and study groups
- **Responsive Design**: Fully responsive layout for desktop, tablet, and mobile devices
- **Error Handling**: Comprehensive error handling and user feedback

## Tech Stack

### Frontend
- **HTML5**: Semantic markup and structure
- **CSS3**: Modern styling with flexbox, grid, and animations
- **Vanilla JavaScript**: No frameworks - pure JavaScript for all functionality
- **Font Awesome**: Icons and visual elements

### Backend & Services
- **Firebase Authentication**: User authentication and session management
- **Firebase Firestore**: Real-time database for all application data
- **Firebase Security Rules**: Data access control and security

### External APIs
- **RestCountries API**: Country data, flags, and information
- **HipoLabs Universities API**: University listings by country
- **Advice Slip API**: Motivational quotes for study breaks
- **Open-Meteo API**: Weather information and forecasts
- **WorldTimeAPI**: Timezone information and data

All API calls are made client-side. No backend server required.

## Getting Started

### Prerequisites

Before you begin, ensure you have:
- A modern web browser (Chrome, Firefox, Safari, or Edge)
- A Firebase project with Firestore enabled
- Basic knowledge of HTML, CSS, and JavaScript
- A web server for local development (optional, but recommended)

### Installation Steps

1. **Clone the Repository**
   ```bash
   git clone https://github.com/ishejaladouce/academico.git
   cd academico
   ```

2. **Set Up Firebase**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project or use an existing one
   - Enable Authentication with Email/Password provider
   - Enable Firestore Database
   - Get your Firebase configuration credentials

3. **Configure the Application**
   - Copy `config.example.js` to `config.js`
   - Open `config.js` and add your Firebase configuration:
   ```javascript
   window.__ACADEMICO_CONFIG = {
     firebase: {
       apiKey: "your-api-key-here",
       authDomain: "your-project.firebaseapp.com",
       projectId: "your-project-id",
       storageBucket: "your-project.appspot.com",
       messagingSenderId: "your-sender-id",
       appId: "your-app-id"
     }
   };
   ```

4. **Set Up Firestore Security Rules**
   - Go to Firestore Database in Firebase Console
   - Navigate to Rules tab
   - Configure appropriate security rules for your collections
   - Ensure users can only access their own data

5. **Run the Application**
   
   **Option 1: Direct File Opening**
   - Simply open `index.html` in your web browser
   - Note: Some features may not work due to CORS restrictions
   
   **Option 2: Local Server (Recommended)**
   ```bash
   # Using Python 3
   python -m http.server 8000
   
   # Using Node.js (with http-server installed)
   npx http-server
   
   # Using PHP
   php -S localhost:8000
   ```
   - Navigate to `http://localhost:8000` in your browser

## Project Structure

```
academico/
│
├── index.html                 # Landing page with login/registration
├── dashboard.html             # User dashboard (main application)
├── admin-login.html           # Admin authentication page
├── admin-dashboard.html       # Admin dashboard interface
│
├── config.example.js          # Configuration template (safe to commit)
├── config.js                  # Your Firebase config (DO NOT COMMIT)
├── .gitignore                 # Git ignore rules
├── README.md                  # This file
│
├── css/
│   ├── style.css              # Main application styles
│   ├── dashboard.css          # Dashboard-specific styles
│   └── admin.css              # Admin dashboard styles
│
├── js/
│   ├── app.js                 # Main application logic and initialization
│   ├── auth.js                # User authentication (login, register, password reset)
│   ├── dashboard.js           # User dashboard functionality
│   ├── messages.js            # Messaging system and chat functionality
│   ├── connections.js         # Connection management
│   ├── study-groups.js        # Study groups creation and management
│   │
│   ├── admin-auth.js          # Admin authentication
│   ├── admin-dashboard.js     # Admin dashboard logic
│   ├── admin-users.js         # User management in admin panel
│   ├── admin-login.js         # Admin login page logic
│   │
│   ├── api.js                 # External API integration
│   ├── enhanced-api.js        # Enhanced API wrapper with error handling
│   ├── countries.js           # Country data management
│   ├── universities.js         # University data management
│   ├── errorHandler.js        # Global error handling
│   └── index.js               # Index page specific functionality
│
└── assets/                    # Static assets (if any)
    ├── images/                # Image files
    └── icons/                 # Icon files
```

### File Descriptions

**HTML Files**
- `index.html`: Landing page with user registration, login, and forgot password functionality
- `dashboard.html`: Main user interface with navigation, search, connections, messages, and groups
- `admin-login.html`: Admin authentication page
- `admin-dashboard.html`: Admin interface for platform management

**JavaScript Files**
- `app.js`: Main application controller, handles page initialization and routing
- `auth.js`: User authentication logic including password hashing and Firebase integration
- `dashboard.js`: User dashboard functionality including search, connections, and navigation
- `messages.js`: Real-time messaging system with Firestore integration
- `connections.js`: Connection request management and status tracking
- `study-groups.js`: Study group creation, invitations, and management
- `admin-*.js`: Admin panel functionality for user and platform management
- `api.js` / `enhanced-api.js`: External API integrations with error handling
- `countries.js` / `universities.js`: Data management for countries and universities
- `errorHandler.js`: Global error handling and user notifications

**CSS Files**
- `style.css`: Main stylesheet with global styles, components, and responsive design
- `dashboard.css`: Dashboard-specific styles including cards, tables, and navigation
- `admin.css`: Admin dashboard styling

## Usage Guide

### For Students

1. **Registration**
   - Click "Sign Up" on the landing page
   - Enter your email and create a password
   - Complete your profile with course, university, and preferences

2. **Finding Study Partners**
   - Navigate to "Find Partners" in the dashboard
   - Use search filters to find compatible partners
   - View suggestions based on your course and interests

3. **Making Connections**
   - Click "Connect" on a potential partner's profile
   - Wait for them to accept your request
   - Accept or reject incoming connection requests

4. **Chatting**
   - Go to "Messages" section
   - Select a connection to start chatting
   - Send and receive messages in real-time

5. **Creating Study Groups**
   - Navigate to "Groups" section
   - Click "Create Group"
   - Add group name and purpose
   - Invite connections to join
   - Start group chat when members join

6. **Managing Profile**
   - Access settings from the user menu
   - Toggle dark/light mode
   - View your connections and activity

### For Administrators

1. **Login**
   - Navigate to admin login page
   - Enter admin credentials
   - Access admin dashboard

2. **View Statistics**
   - Dashboard shows real-time platform statistics
   - View total users, active users, messages, connections, and groups
   - Monitor API status and usage

3. **Manage Users**
   - Go to "Users" section
   - View all registered users in a table
   - Search and filter users
   - Suspend, activate, or delete user accounts

4. **Monitor Activity**
   - View recent activities on the dashboard
   - Track user signups, connections, and messages
   - Export data for analysis

5. **Settings**
   - Access platform settings
   - View database information
   - Manage admin account
   - Export platform data

## Firebase Configuration

### Firestore Collections

The application uses the following Firestore collections:

- **users**: User profiles, authentication data, and preferences
- **connections**: Connection requests and relationship status
- **conversations**: Chat conversation metadata
- **messages**: Individual messages (subcollection under conversations)
- **studyGroups**: Study group information and members
- **groupMessages**: Group chat messages
- **groupInvitations**: Group invitation records and status

### Security Rules

Configure Firestore security rules to protect user data. Example rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Connections - users can read their own connections
    match /connections/{connectionId} {
      allow read: if request.auth != null && 
        (resource.data.userId == request.auth.uid || 
         resource.data.partnerId == request.auth.uid);
      allow create: if request.auth != null;
      allow update: if request.auth != null && 
        (resource.data.userId == request.auth.uid || 
         resource.data.partnerId == request.auth.uid);
    }
    
    // Add more rules for other collections as needed
  }
}
```

### Firebase Setup Checklist

- [ ] Firebase project created
- [ ] Authentication enabled (Email/Password)
- [ ] Firestore Database enabled
- [ ] Security rules configured
- [ ] Firebase config added to `config.js`
- [ ] Firestore indexes created (if needed for queries)

## API Integration

The application integrates with several external APIs:

- **RestCountries API**: Provides country data, flags, and information
- **HipoLabs Universities API**: University listings organized by country
- **Advice Slip API**: Motivational quotes displayed on the homepage
- **Open-Meteo API**: Weather information and forecasts
- **WorldTimeAPI**: Timezone data and information

All API calls are made directly from the client-side JavaScript. No backend server is required. The `enhanced-api.js` module handles API calls with proper error handling and fallback mechanisms.

## Deployment

### Production Deployment

1. **Prepare Files**
   - Ensure `config.js` contains production Firebase credentials
   - Verify all features work correctly
   - Test on a staging environment first

2. **Upload Files**
   - Transfer all files to your web server
   - Ensure `config.js` is properly configured (or use environment variables)
   - Set correct file permissions

3. **Configure Server**
   - Set up Nginx or Apache to serve static files
   - Configure proper MIME types
   - Enable HTTPS for security

4. **Set Up Load Balancer** (if using multiple servers)
   - Configure load balancing between web servers
   - Set up health checks
   - Configure session persistence if needed

5. **Test Production**
   - Verify all features work correctly
   - Test authentication and data persistence
   - Check API integrations
   - Verify responsive design on different devices

### Environment Variables

For production, consider using environment variables instead of `config.js`:
- Set Firebase config via server-side environment variables
- Use a build process to inject configuration at build time
- Keep sensitive credentials out of the codebase

## Browser Support

The application is tested and works on:
- Chrome (latest version)
- Firefox (latest version)
- Safari (latest version)
- Edge (latest version)

## Development Notes

### Code Style
- Pure vanilla JavaScript - no frameworks or libraries
- Modular code organization with separate files for different features
- Consistent naming conventions
- Comments for complex logic

### Error Handling
- Global error handler in `errorHandler.js`
- Try-catch blocks for async operations
- User-friendly error messages
- Console logging for debugging

### Performance
- Lazy loading of data where possible
- Efficient Firestore queries
- Optimized API calls
- Responsive images and assets

## Troubleshooting

### Common Issues

**Firebase not initializing**
- Check that `config.js` is properly configured
- Verify Firebase project settings
- Check browser console for errors

**Messages not loading**
- Verify Firestore security rules
- Check that Firestore indexes are created
- Ensure user is authenticated

**API calls failing**
- Check network connectivity
- Verify API endpoints are accessible
- Check browser console for CORS errors

**Password reset not working**
- Verify Firebase Authentication is enabled
- Check that email provider is configured
- Review browser console for errors

## Security Considerations

- Passwords are hashed using SHA-256 before storage
- Firebase security rules protect database access
- Sensitive configuration in `config.js` is excluded from git
- HTTPS should be used in production
- Input validation on all user inputs

## License

This project is licensed under the MIT License.

## Acknowledgments

- [Firebase](https://firebase.google.com/) - Backend services and authentication
- [RestCountries API](https://restcountries.com/) - Country data and flags
- [HipoLabs Universities API](https://github.com/Hipo/university-domains-list) - University listings
- [Advice Slip API](https://api.adviceslip.com/) - Motivational quotes
- [Open-Meteo](https://open-meteo.com/) - Weather data
- [WorldTimeAPI](http://worldtimeapi.org/) - Timezone information
- [Font Awesome](https://fontawesome.com/) - Icons

## Support

For issues, questions, or contributions:
- Open an issue on the repository
- Check existing documentation
- Review code comments for implementation details

---

**Note**: Remember to never commit `config.js` to version control. Always use `config.example.js` as a template and keep your actual configuration local.
