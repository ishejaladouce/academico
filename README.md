# AcademicO - Study Partner Matching Platform

## Project Overview

AcademicO is a web application designed to address the challenge of academic isolation by connecting students with compatible study partners based on their courses, availability, and learning preferences. The platform facilitates meaningful academic collaborations through an intelligent matching system.

## Production Deployment

**Live Application:** http://academico.isheja.tech
**Demo Video:** [To be added]

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
- Light and dark mode theme settings for user preference
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

This application integrates multiple external APIs to enhance functionality. All APIs are properly attributed and used in compliance with their terms of service.

### External APIs Used

1. **ipapi.co / WorldTimeAPI**
   - **URL:** https://ipapi.co/json/
   - **Purpose:** Timezone detection and compatibility scoring for study partner matching
   - **Attribution:** Data provided by ipapi.co - IP Geolocation API
   - **Usage:** Detects user timezone to match students with compatible study schedules

2. **Open-Meteo Weather API**
   - **URL:** https://api.open-meteo.com/v1/forecast
   - **Purpose:** Weather-based study recommendations and environmental context
   - **Attribution:** Weather data provided by Open-Meteo (https://open-meteo.com/)
   - **Usage:** Provides weather information to suggest optimal study conditions

3. **Advice Slip API**
   - **URL:** https://api.adviceslip.com/advice
   - **Purpose:** Motivational study quotes and encouragement
   - **Attribution:** Quotes provided by Advice Slip API (https://api.adviceslip.com/)
   - **Usage:** Displays motivational quotes during study breaks

4. **HipoLabs Universities API**
   - **URL:** https://raw.githubusercontent.com/Hipo/university-domains-list/master/world_universities_and_domains.json
   - **Purpose:** Global university database for user registration and filtering
   - **Attribution:** University data provided by HipoLabs (https://github.com/Hipo/university-domains-list)
   - **Usage:** Populates university dropdowns and enables university-based search filtering

5. **RestCountries API**
   - **URL:** https://restcountries.com/v3.1/all
   - **Purpose:** Country information and filtering capabilities
   - **Attribution:** Country data provided by RestCountries API (https://restcountries.com/)
   - **Usage:** Provides country list for registration and enables country-based partner search

### API Security and Error Handling

- **No API Keys Required:** All APIs used are free and do not require authentication keys
- **Secure Implementation:** All API calls are made client-side with proper error handling
- **Fallback Mechanisms:** Comprehensive error handling with fallback data ensures application reliability during external service unavailability
- **Rate Limiting:** API calls are optimized to minimize requests and respect API rate limits
- **Error Recovery:** Automatic retry logic and graceful degradation when APIs are unavailable

## Server Deployment Instructions

### Prerequisites for Deployment
- Access to web servers (Web01 and Web02)
- Access to load balancer server (Lb01)
- SSH access to all servers
- Git installed on all servers
- Nginx installed on all servers
- Domain DNS configured to point to load balancer IP

### Step-by-Step Deployment Process

#### Option 1: Clone Repository on Server (Recommended)

**On Each Web Server (Web01 and Web02):**

1. **Connect to the server:**
   ```bash
   ssh ubuntu@<server-ip>
   ```

2. **Update system packages:**
   ```bash
   sudo apt update
   sudo apt upgrade -y
   ```

3. **Install required software:**
   ```bash
   sudo apt install nginx git -y
   ```

4. **Create application directory:**
   ```bash
   sudo mkdir -p /var/www/academico
   sudo chown -R ubuntu:ubuntu /var/www/academico
   ```

5. **Clone the repository:**
   ```bash
   cd /var/www
   git clone https://github.com/ishejaladouce/academico.git academico
   cd academico
   ```

6. **Create config.js with production Firebase credentials:**
   ```bash
   sudo nano /var/www/academico/config.js
   ```
   Paste your Firebase configuration and save.

7. **Set proper permissions:**
   ```bash
   sudo chown -R www-data:www-data /var/www/academico
   sudo chown -R ubuntu:ubuntu /var/www/academico/.git
   ```

8. **Configure Nginx:**
   ```bash
   sudo nano /etc/nginx/sites-available/academico
   ```
   Add server configuration pointing to `/var/www/academico`

9. **Enable site and restart Nginx:**
   ```bash
   sudo ln -s /etc/nginx/sites-available/academico /etc/nginx/sites-enabled/
   sudo rm /etc/nginx/sites-enabled/default
   sudo nginx -t
   sudo systemctl restart nginx
   ```

#### Option 2: Transfer Files Using rsync

**From your local machine:**

1. **Transfer files to Web01:**
   ```bash
   rsync -avz --exclude 'config.js' --exclude '.git' --exclude 'node_modules' \
     ./ ubuntu@<web01-ip>:/var/www/academico/
   ```

2. **Transfer files to Web02:**
   ```bash
   rsync -avz --exclude 'config.js' --exclude '.git' --exclude 'node_modules' \
     ./ ubuntu@<web02-ip>:/var/www/academico/
   ```

3. **Create config.js on each server** (as shown in Option 1, step 6)

#### Load Balancer Configuration

**On Load Balancer (Lb01):**

1. **Connect and install Nginx:**
   ```bash
   ssh ubuntu@<lb01-ip>
   sudo apt update
   sudo apt install nginx -y
   ```

2. **Create load balancer configuration:**
   ```bash
   sudo nano /etc/nginx/sites-available/academico-lb
   ```
   Configure upstream servers pointing to Web01 and Web02

3. **Enable and restart:**
   ```bash
   sudo ln -s /etc/nginx/sites-available/academico-lb /etc/nginx/sites-enabled/
   sudo rm /etc/nginx/sites-enabled/default
   sudo nginx -t
   sudo systemctl restart nginx
   ```

4. **Configure firewall:**
   ```bash
   sudo ufw allow 'Nginx Full'
   sudo ufw allow OpenSSH
   sudo ufw enable
   ```

### Updating the Deployment

**To update the application after code changes:**

1. **Commit and push changes to repository:**
   ```bash
   git add .
   git commit -m "Your commit message"
   git push
   ```

2. **Pull updates on each web server:**
   ```bash
   ssh ubuntu@<server-ip>
   cd /var/www/academico
   sudo chown -R ubuntu:ubuntu /var/www/academico
   git pull
   sudo chown -R www-data:www-data /var/www/academico
   sudo chown -R ubuntu:ubuntu /var/www/academico/.git
   ```

### Deployment Architecture

**Infrastructure Components:**
- **Load Balancer (Lb01):** Distributes incoming traffic between web servers
- **Web Server 01 (Web01):** Primary application server
- **Web Server 02 (Web02):** Secondary application server for high availability
- **Domain:** academico.isheja.tech configured for public access

**Deployment Configuration:**
- Load distribution using least connections algorithm
- Health monitoring with automatic failover capabilities
- Persistent connections for optimized performance
- Security headers and proper proxy configuration
- DNS configured to route traffic through load balancer

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
