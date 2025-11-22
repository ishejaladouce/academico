# AcademicO Deployment Guide - Step by Step

## Your Server Configuration

### Servers
- **Web01**: `ubuntu@3.84.27.55` (6869-web-01)
- **Web02**: `ubuntu@54.166.161.27` (6869-web-02)
- **Lb01**: `ubuntu@54.91.114.171` (6869-lb-01)

### Domain
- **Main Domain**: `isheja.tech`
- **Web01**: `web-01.isheja.tech`
- **Web02**: `web-02.isheja.tech`
- **Load Balancer**: `lb-01.isheja.tech`
- **WWW**: `www.isheja.tech`

---

## ⚠️ STEP 0: Update DNS Records (CRITICAL)

Your DNS records need to point to the correct server IPs. Update these in your DNS management panel:

1. **web-01.isheja.tech** → Update to: `3.84.27.55` (currently: 18.208.149.224)
2. **web-02.isheja.tech** → Update to: `54.166.161.27` (currently: 98.93.251.113)
3. **lb-01.isheja.tech** → Update to: `54.91.114.171` (currently: 44.202.71.242)
4. **www.isheja.tech** → Update to: `54.91.114.171` (point to load balancer)

**Wait 5-10 minutes for DNS propagation after updating.**

---

## STEP 1: Prepare Files Locally

### 1.1 Create Deployment Package
On your local machine, ensure you have:
- All project files ready
- `config.js` configured with your Firebase credentials
- Tested the application locally

### 1.2 Files to Deploy
```
academico/
├── index.html
├── dashboard.html
├── admin-dashboard.html
├── admin-login.html
├── config.js (IMPORTANT: Must have Firebase config)
├── css/
│   ├── style.css
│   ├── dashboard.css
│   └── admin.css
├── js/
│   ├── app.js
│   ├── auth.js
│   ├── dashboard.js
│   ├── messages.js
│   ├── connections.js
│   ├── admin-dashboard.js
│   ├── admin-users.js
│   ├── admin-auth.js
│   ├── countries.js
│   ├── universities.js
│   ├── enhanced-api.js
│   ├── errorHandler.js
│   └── ... (all JS files)
└── assets/
    ├── images/
    └── icons/
```

---

## STEP 2: Deploy to Web01 (3.84.27.55)

### 2.1 Connect to Web01
```bash
ssh ubuntu@3.84.27.55
```

### 2.2 Install Nginx
```bash
sudo apt-get update
sudo apt-get install nginx -y
```

### 2.3 Create Application Directory
```bash
sudo mkdir -p /var/www/academico
sudo chown -R ubuntu:ubuntu /var/www/academico
```

### 2.4 Upload Files to Web01
**From your local machine:**
```bash
# Navigate to your project directory
cd /path/to/your/academico/project

# Upload all files to Web01
scp -r * ubuntu@3.84.27.55:/var/www/academico/
```

**Or use rsync (better for updates):**
```bash
rsync -avz --exclude 'node_modules' --exclude '.git' \
  ./ ubuntu@3.84.27.55:/var/www/academico/
```

### 2.5 Configure Nginx for Web01
```bash
sudo nano /etc/nginx/sites-available/academico
```

**Add this configuration:**
```nginx
server {
    listen 80;
    server_name web-01.isheja.tech 3.84.27.55;

    root /var/www/academico;
    index index.html;

    # Logging
    access_log /var/log/nginx/academico-access.log;
    error_log /var/log/nginx/academico-error.log;

    # Main location
    location / {
        try_files $uri $uri/ =404;
    }

    # Enable CORS for API calls
    add_header Access-Control-Allow-Origin *;
    add_header Access-Control-Allow-Methods "GET, POST, OPTIONS";
    add_header Access-Control-Allow-Headers "Content-Type, Authorization";

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Cache static assets
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
```

### 2.6 Enable the Site
```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/academico /etc/nginx/sites-enabled/

# Remove default site (optional)
sudo rm /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# If test passes, reload Nginx
sudo systemctl reload nginx

# Enable Nginx to start on boot
sudo systemctl enable nginx
```

### 2.7 Set Proper Permissions
```bash
sudo chown -R www-data:www-data /var/www/academico
sudo chmod -R 755 /var/www/academico
```

### 2.8 Test Web01
```bash
# Test from server
curl http://localhost

# Test from your local machine
curl http://3.84.27.55
# Or visit in browser: http://web-01.isheja.tech
```

**✅ Verify:**
- Application loads correctly
- All CSS and JS files load
- Firebase connection works
- Can register/login

---

## STEP 3: Deploy to Web02 (54.166.161.27)

### 3.1 Connect to Web02
```bash
ssh ubuntu@54.166.161.27
```

### 3.2 Install Nginx
```bash
sudo apt-get update
sudo apt-get install nginx -y
```

### 3.3 Create Application Directory
```bash
sudo mkdir -p /var/www/academico
sudo chown -R ubuntu:ubuntu /var/www/academico
```

### 3.4 Upload Files to Web02
**From your local machine:**
```bash
# Upload all files to Web02
scp -r * ubuntu@54.166.161.27:/var/www/academico/

# Or use rsync
rsync -avz --exclude 'node_modules' --exclude '.git' \
  ./ ubuntu@54.166.161.27:/var/www/academico/
```

**⚠️ IMPORTANT:** Make sure `config.js` has the SAME Firebase configuration as Web01!

### 3.5 Configure Nginx for Web02
```bash
sudo nano /etc/nginx/sites-available/academico
```

**Add this configuration:**
```nginx
server {
    listen 80;
    server_name web-02.isheja.tech 54.166.161.27;

    root /var/www/academico;
    index index.html;

    # Logging
    access_log /var/log/nginx/academico-access.log;
    error_log /var/log/nginx/academico-error.log;

    # Main location
    location / {
        try_files $uri $uri/ =404;
    }

    # Enable CORS for API calls
    add_header Access-Control-Allow-Origin *;
    add_header Access-Control-Allow-Methods "GET, POST, OPTIONS";
    add_header Access-Control-Allow-Headers "Content-Type, Authorization";

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Cache static assets
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
```

### 3.6 Enable the Site
```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/academico /etc/nginx/sites-enabled/

# Remove default site (optional)
sudo rm /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# If test passes, reload Nginx
sudo systemctl reload nginx

# Enable Nginx to start on boot
sudo systemctl enable nginx
```

### 3.7 Set Proper Permissions
```bash
sudo chown -R www-data:www-data /var/www/academico
sudo chmod -R 755 /var/www/academico
```

### 3.8 Test Web02
```bash
# Test from server
curl http://localhost

# Test from your local machine
curl http://54.166.161.27
# Or visit in browser: http://web-02.isheja.tech
```

**✅ Verify:**
- Application loads correctly
- Both Web01 and Web02 serve identical content
- Both can access Firebase

---

## STEP 4: Configure Load Balancer (Lb01 - 54.91.114.171)

### 4.1 Connect to Lb01
```bash
ssh ubuntu@54.91.114.171
```

### 4.2 Install Nginx
```bash
sudo apt-get update
sudo apt-get install nginx -y
```

### 4.3 Configure Nginx as Load Balancer
```bash
sudo nano /etc/nginx/sites-available/loadbalancer
```

**Add this configuration:**
```nginx
# Upstream backend servers
upstream academico_backend {
    # Use least connections algorithm for better distribution
    least_conn;
    
    # Web01 backend
    server 3.84.27.55:80 weight=1 max_fails=3 fail_timeout=30s;
    
    # Web02 backend
    server 54.166.161.27:80 weight=1 max_fails=3 fail_timeout=30s;
    
    # Keep connections alive
    keepalive 32;
}

# Main server block
server {
    listen 80;
    server_name lb-01.isheja.tech www.isheja.tech isheja.tech 54.91.114.171;

    # Logging
    access_log /var/log/nginx/lb-access.log;
    error_log /var/log/nginx/lb-error.log;

    # Proxy to backend servers
    location / {
        proxy_pass http://academico_backend;
        
        # Headers for proper proxying
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Connection "";
        
        # Timeouts
        proxy_connect_timeout 5s;
        proxy_send_timeout 10s;
        proxy_read_timeout 10s;
        
        # Buffer settings
        proxy_buffering on;
        proxy_buffer_size 4k;
        proxy_buffers 8 4k;
        proxy_busy_buffers_size 8k;
        
        # Health check
        proxy_next_upstream error timeout invalid_header http_500 http_502 http_503;
    }

    # Health check endpoint for load balancer itself
    location /health {
        access_log off;
        return 200 "load-balancer-healthy\n";
        add_header Content-Type text/plain;
    }

    # Backend health check endpoint
    location /backend-health {
        proxy_pass http://academico_backend/health;
        access_log off;
    }
}
```

### 4.4 Enable the Load Balancer
```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/loadbalancer /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# If test passes, reload Nginx
sudo systemctl reload nginx

# Enable Nginx to start on boot
sudo systemctl enable nginx
```

### 4.5 Test Load Balancer
```bash
# Test from server
curl http://localhost

# Test from your local machine
curl http://54.91.114.171
# Or visit in browser: http://lb-01.isheja.tech or http://www.isheja.tech
```

**✅ Verify:**
- Application loads through load balancer
- Traffic is distributed between Web01 and Web02

---

## STEP 5: Verify Everything Works

### 5.1 Test Individual Servers
```bash
# Test Web01
curl -I http://web-01.isheja.tech
# Should return HTTP 200

# Test Web02
curl -I http://web-02.isheja.tech
# Should return HTTP 200
```

### 5.2 Test Load Balancer
```bash
# Test through load balancer
curl -I http://www.isheja.tech
curl -I http://lb-01.isheja.tech
curl -I http://isheja.tech

# All should return HTTP 200
```

### 5.3 Test Traffic Distribution
**On Lb01, monitor logs:**
```bash
sudo tail -f /var/log/nginx/lb-access.log
```

**Make multiple requests:**
```bash
# Run this multiple times
for i in {1..10}; do
    curl -s http://www.isheja.tech > /dev/null
    echo "Request $i"
done
```

**Check backend server logs:**
```bash
# On Web01
sudo tail -f /var/log/nginx/academico-access.log

# On Web02
sudo tail -f /var/log/nginx/academico-access.log
```

You should see requests distributed between both servers.

### 5.4 Test Failover
```bash
# Stop Web01
ssh ubuntu@3.84.27.55
sudo systemctl stop nginx

# Test load balancer - should still work using Web02
curl http://www.isheja.tech

# Restart Web01
sudo systemctl start nginx
```

### 5.5 Functional Testing
Visit `http://www.isheja.tech` and test:
- ✅ Homepage loads
- ✅ User registration works
- ✅ User login works
- ✅ Search functionality works
- ✅ Messaging works
- ✅ Connections work
- ✅ Admin dashboard works
- ✅ All features accessible

---

## STEP 6: Firewall Configuration

### 6.1 Configure Firewall on All Servers

**On Web01, Web02, and Lb01:**
```bash
# Allow HTTP
sudo ufw allow 80/tcp

# Allow HTTPS (for future SSL)
sudo ufw allow 443/tcp

# Allow SSH (be careful!)
sudo ufw allow 22/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

---

## STEP 7: Monitoring and Maintenance

### 7.1 Check Server Status
```bash
# Check Nginx status
sudo systemctl status nginx

# Check if Nginx is listening
sudo netstat -tlnp | grep nginx
# or
sudo ss -tlnp | grep nginx
```

### 7.2 View Logs
```bash
# Load balancer logs
sudo tail -f /var/log/nginx/lb-access.log
sudo tail -f /var/log/nginx/lb-error.log

# Web01 logs
ssh ubuntu@3.84.27.55
sudo tail -f /var/log/nginx/academico-access.log

# Web02 logs
ssh ubuntu@54.166.161.27
sudo tail -f /var/log/nginx/academico-access.log
```

### 7.3 Health Checks
```bash
# Check backend health
curl http://www.isheja.tech/backend-health

# Should return "healthy" from one of the backend servers
```

---

## STEP 8: Troubleshooting

### Issue: 502 Bad Gateway
**Solution:**
```bash
# Check if backend servers are running
curl http://3.84.27.55/health
curl http://54.166.161.27/health

# Check Nginx status on backend servers
ssh ubuntu@3.84.27.55
sudo systemctl status nginx

ssh ubuntu@54.166.161.27
sudo systemctl status nginx
```

### Issue: DNS not resolving
**Solution:**
- Wait 10-15 minutes for DNS propagation
- Check DNS records are correct
- Use `dig` or `nslookup` to verify:
```bash
dig web-01.isheja.tech
dig www.isheja.tech
```

### Issue: Application not loading
**Solution:**
```bash
# Check file permissions
sudo ls -la /var/www/academico

# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Verify config.js exists
ls -la /var/www/academico/config.js
```

### Issue: Firebase connection errors
**Solution:**
- Verify `config.js` is deployed on both Web01 and Web02
- Check Firebase project settings
- Verify network connectivity

---

## Quick Reference Commands

### Server Access
```bash
# Web01
ssh ubuntu@3.84.27.55

# Web02
ssh ubuntu@54.166.161.27

# Lb01
ssh ubuntu@54.91.114.171
```

### Nginx Commands
```bash
# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx

# Restart Nginx
sudo systemctl restart nginx

# Check status
sudo systemctl status nginx

# Stop Nginx
sudo systemctl stop nginx

# Start Nginx
sudo systemctl start nginx
```

### File Locations
- **Web root**: `/var/www/academico`
- **Nginx config**: `/etc/nginx/sites-available/academico`
- **Load balancer config**: `/etc/nginx/sites-available/loadbalancer`
- **Logs**: `/var/log/nginx/`

---

## Demo Video Checklist

For your assignment demo video, show:

1. ✅ **Local Testing**
   - Application running locally
   - All features working

2. ✅ **Web01 Deployment**
   - Access `http://web-01.isheja.tech`
   - Show application loading
   - Test a feature (e.g., registration)

3. ✅ **Web02 Deployment**
   - Access `http://web-02.isheja.tech`
   - Show application loading
   - Verify identical functionality

4. ✅ **Load Balancer**
   - Access `http://www.isheja.tech` or `http://lb-01.isheja.tech`
   - Show application loading through load balancer
   - Test features work

5. ✅ **Traffic Distribution**
   - Show load balancer logs
   - Make multiple requests
   - Show requests being distributed between Web01 and Web02

6. ✅ **Failover Test**
   - Stop one backend server (Web01 or Web02)
   - Show application still works through load balancer
   - Restart the server

7. ✅ **Final Verification**
   - All features working through load balancer
   - User registration, login, search, messaging, admin dashboard

---

## Summary Checklist

- [ ] Updated DNS records to point to correct IPs
- [ ] Deployed files to Web01
- [ ] Configured Nginx on Web01
- [ ] Tested Web01
- [ ] Deployed files to Web02
- [ ] Configured Nginx on Web02
- [ ] Tested Web02
- [ ] Configured load balancer on Lb01
- [ ] Tested load balancer
- [ ] Verified traffic distribution
- [ ] Tested failover
- [ ] Configured firewalls
- [ ] All features working through load balancer
- [ ] Ready for demo video

---

## Support

If you encounter issues:
1. Check server logs: `sudo tail -f /var/log/nginx/error.log`
2. Verify Nginx is running: `sudo systemctl status nginx`
3. Test configuration: `sudo nginx -t`
4. Check file permissions: `ls -la /var/www/academico`
5. Verify DNS: `dig your-domain.isheja.tech`

**Good luck with your deployment! 🚀**

