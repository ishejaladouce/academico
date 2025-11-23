# AcademicO - Study Partner Matching Platform

## Project Overview

AcademicO is a web application designed to address the challenge of academic isolation by connecting students with compatible study partners based on their courses, availability, and learning preferences. The platform facilitates meaningful academic collaborations through an intelligent matching system.

## Production Deployment

**Application URL:** http://academico.isheja.tech  
**Demo Video:** [------]

## Features and Functionality

### Core Application Features
- User registration and authentication system
- Advanced search functionality with filtering by course, topic, availability, country, and university
- Connection request management (send, accept, decline requests)
- Real-time messaging between connected users
- study group with group chats
- Timezone compatibility assessment
- Administrative dashboard for platform management

### User Experience
- Responsive design optimized for desktop and mobile devices
- Intuitive navigation and user interface
- Comprehensive error handling with user-friendly feedback
- Data presentation with sorting and filtering capabilities

## Technology Stack

- **Frontend:** HTML5, CSS3, Vanilla JavaScript
- **Backend Services:** Firebase Authentication, Firestore Database
- **External APIs:** WorldTimeAPI, Open-Meteo, Advice Slip, HipoLabs Universities, RestCountries
- **Deployment:** Nginx web servers with load balancer configuration

## Project Structure

```
academico/
├── index.html                 # Landing page with user registration, login, and password reset
├── dashboard.html             # Main user dashboard with navigation, search, connections, messages, and groups
├── admin-login.html           # Admin authentication page
├── admin-dashboard.html       # Admin panel for platform management and user administration
├── config.example.js          # Configuration template with placeholder Firebase credentials
├── config.js                  # Production Firebase configuration (excluded from git for security)
├── .gitignore                 # Git ignore rules to exclude sensitive files and directories
├── README.md                  # Project documentation and deployment instructions
│
├── css/
│   ├── style.css             # Main application styles including landing page, forms, and global components
│   ├── dashboard.css          # User dashboard specific styles (cards, tables, navigation, dark mode)
│   └── admin.css             # Admin dashboard styling and layout
│
└── js/
    ├── app.js                # Main application controller - handles page initialization, routing, and global functionality
    ├── auth.js               # User authentication logic - registration, login, password hashing, password reset
    ├── dashboard.js          # User dashboard functionality - search partners, connections, messages, groups, navigation
    ├── messages.js           # Real-time messaging system - chat functionality with Firestore integration
    ├── connections.js        # Connection management - send/receive requests, accept/decline connections
    ├── study-groups.js       # Study groups feature - create groups, send invitations, manage members, group chat
    │
    ├── admin-auth.js         # Admin authentication and session management
    ├── admin-dashboard.js    # Admin dashboard logic - statistics, recent activities, API monitoring
    ├── admin-users.js        # User management in admin panel - view, suspend, activate, delete users
    ├── admin-login.js        # Admin login page functionality
    │
    ├── api.js                # External API integration - RestCountries, Universities, Weather, Quotes, Timezone
    ├── enhanced-api.js       # Enhanced API wrapper with error handling, retry logic, and fallback mechanisms
    ├── countries.js          # Country data management and filtering
    ├── universities.js       # University data management and search functionality
    ├── errorHandler.js       # Global error handling and user-friendly error notifications
    └── index.js              # Index page specific functionality - statistics, weather widget, quotes
```

## Local Development Setup

### Prerequisites
- Modern web browser with JavaScript enabled
- Firebase project with Authentication and Firestore Database enabled

### Installation and Configuration

1. Clone the repository:
```bash
git clone https://github.com/ishejaladouce/academico.git
cd academico
```

2. Create configuration file:
```bash
cp config.example.js config.js
```

3. Configure Firebase integration:
   - Create a new project at Firebase Console
   - Enable Email/Password Authentication
   - Enable Firestore Database
   - Update config.js with your Firebase project credentials

4. Launch the application using any local web server and access via http://localhost

## API Integration and Attribution

This application integrates multiple external APIs to enhance functionality:

- **WorldTimeAPI** (https://worldtimeapi.org/) - Timezone detection and compatibility scoring
- **Open-Meteo** (https://open-meteo.com/) - Weather-based study recommendations
- **Advice Slip API** (https://api.adviceslip.com/) - Motivational study quotes
- **HipoLabs Universities API** (http://universities.hipolabs.com/) - Global university database
- **RestCountries API** (https://restcountries.com/) - Country information and filtering

All API integrations include comprehensive error handling with fallback data mechanisms to ensure application reliability during external service unavailability.

## Deployment Architecture

### Infrastructure Components
- **Load Balancer:** Distributes incoming traffic between web servers
- **Web Servers:** Multiple application servers for high availability
- **Domain:** academico.isheja.tech configured for public access

### Deployment Configuration
The application is deployed across a load-balanced infrastructure with the following characteristics:

- Load distribution using least connections algorithm
- Health monitoring with automatic failover capabilities
- Persistent connections for optimized performance
- Security headers and proper proxy configuration

## Verification and Testing

### Load Balancer Validation
- Request distribution confirmed between multiple servers
- Health monitoring actively verifies server status
- Failover functionality tested and operational
- Session persistence maintained across requests

### Application Testing
- User registration and authentication workflows verified
- Search functionality with all filter combinations tested
- Real-time messaging system operational
- Connection request management functioning correctly
- Administrative dashboard operations validated
- Cross-browser compatibility confirmed
- Mobile responsiveness verified across devices

## Security Implementation

- Firebase credentials secured and excluded from version control
- Comprehensive input validation throughout the application
- Error handling with appropriate user feedback
- Nginx security headers configured on all servers
- API keys properly managed and secured

## Usage Instructions

### Student Usage
1. Register account using email and password
2. Complete profile information including course, university, and availability preferences
3. Utilize search functionality with advanced filters to locate compatible study partners
4. Send connection requests to identified matches
5. Engage in real-time communication with connected partners
6. Manage academic connections and study collaborations

### Administrator Usage
1. Access administrative login portal
2. Review platform statistics and user analytics
3. Manage user accounts and platform content
4. Monitor system health and performance metrics

## Support and Maintenance

For technical support or platform issues, contact the development team. Regular server monitoring and maintenance procedures ensure platform reliability and consistent performance.

**Note**: Remember to never commit `config.js` to version control. Always use `config.example.js` as a template and keep your actual configuration local.

*AcademicO - Enhancing collaborative learning through technology*
