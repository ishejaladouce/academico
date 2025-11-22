# Part 2: Deployment Implementation Checklist

## 🎯 Goal: Deploy AcademicO to Multiple Servers with Load Balancing

---

## ✅ What Needs to Be Implemented

### 1. **DNS Configuration** ⚠️ CRITICAL FIRST STEP
- [ ] Update DNS records in your DNS management panel:
  - `web-01.isheja.tech` → `3.84.27.55`
  - `web-02.isheja.tech` → `54.166.161.27`
  - `lb-01.isheja.tech` → `54.91.114.171`
  - `www.isheja.tech` → `54.91.114.171` (point to load balancer)
- [ ] Wait 10 minutes for DNS propagation
- [ ] Verify DNS resolution: `dig web-01.isheja.tech`

---

### 2. **Web01 Server Setup** (3.84.27.55)
- [ ] **Connect to server**: `ssh ubuntu@3.84.27.55`
- [ ] **Install Nginx**: `sudo apt-get update && sudo apt-get install nginx -y`
- [ ] **Create application directory**: `/var/www/academico`
- [ ] **Upload all application files** (from local machine):
  ```bash
  scp -r * ubuntu@3.84.27.55:/var/www/academico/
  ```
- [ ] **Create Nginx configuration** at `/etc/nginx/sites-available/academico`
- [ ] **Enable the site**: Create symlink in `sites-enabled`
- [ ] **Test Nginx config**: `sudo nginx -t`
- [ ] **Reload Nginx**: `sudo systemctl reload nginx`
- [ ] **Set permissions**: `sudo chown -R www-data:www-data /var/www/academico`
- [ ] **Test Web01**: Visit `http://web-01.isheja.tech` or `http://3.84.27.55`
- [ ] **Verify**: Application loads, Firebase works, all features functional

---

### 3. **Web02 Server Setup** (54.166.161.27)
- [ ] **Connect to server**: `ssh ubuntu@54.166.161.27`
- [ ] **Install Nginx**: `sudo apt-get update && sudo apt-get install nginx -y`
- [ ] **Create application directory**: `/var/www/academico`
- [ ] **Upload all application files** (same files as Web01):
  ```bash
  scp -r * ubuntu@54.166.161.27:/var/www/academico/
  ```
- [ ] **Create Nginx configuration** at `/etc/nginx/sites-available/academico`
- [ ] **Enable the site**: Create symlink in `sites-enabled`
- [ ] **Test Nginx config**: `sudo nginx -t`
- [ ] **Reload Nginx**: `sudo systemctl reload nginx`
- [ ] **Set permissions**: `sudo chown -R www-data:www-data /var/www/academico`
- [ ] **Test Web02**: Visit `http://web-02.isheja.tech` or `http://54.166.161.27`
- [ ] **Verify**: Application loads, identical to Web01, Firebase works

---

### 4. **Load Balancer Setup** (Lb01 - 54.91.114.171)
- [ ] **Connect to server**: `ssh ubuntu@54.91.114.171`
- [ ] **Install Nginx**: `sudo apt-get update && sudo apt-get install nginx -y`
- [ ] **Create load balancer configuration** at `/etc/nginx/sites-available/loadbalancer`
- [ ] **Configure upstream backend** pointing to:
  - Web01: `3.84.27.55:80`
  - Web02: `54.166.161.27:80`
- [ ] **Configure load balancing algorithm** (least_conn recommended)
- [ ] **Configure proxy settings** (headers, timeouts, health checks)
- [ ] **Enable the site**: Create symlink in `sites-enabled`
- [ ] **Test Nginx config**: `sudo nginx -t`
- [ ] **Reload Nginx**: `sudo systemctl reload nginx`
- [ ] **Test Load Balancer**: Visit `http://www.isheja.tech` or `http://lb-01.isheja.tech`
- [ ] **Verify**: Application loads through load balancer

---

### 5. **Traffic Distribution Verification**
- [ ] **Monitor load balancer logs**:
  ```bash
  ssh ubuntu@54.91.114.171
  sudo tail -f /var/log/nginx/lb-access.log
  ```
- [ ] **Make multiple requests** to load balancer:
  ```bash
  for i in {1..10}; do curl http://www.isheja.tech; done
  ```
- [ ] **Check Web01 logs**:
  ```bash
  ssh ubuntu@3.84.27.55
  sudo tail -f /var/log/nginx/academico-access.log
  ```
- [ ] **Check Web02 logs**:
  ```bash
  ssh ubuntu@54.166.161.27
  sudo tail -f /var/log/nginx/academico-access.log
  ```
- [ ] **Verify**: Requests are distributed between both servers

---

### 6. **Failover Testing** (Critical for Assignment)
- [ ] **Stop Web01**:
  ```bash
  ssh ubuntu@3.84.27.55
  sudo systemctl stop nginx
  ```
- [ ] **Test load balancer**: Visit `http://www.isheja.tech`
- [ ] **Verify**: Application still works (using Web02)
- [ ] **Restart Web01**:
  ```bash
  sudo systemctl start nginx
  ```
- [ ] **Stop Web02**:
  ```bash
  ssh ubuntu@54.166.161.27
  sudo systemctl stop nginx
  ```
- [ ] **Test load balancer**: Visit `http://www.isheja.tech`
- [ ] **Verify**: Application still works (using Web01)
- [ ] **Restart Web02**:
  ```bash
  sudo systemctl start nginx
  ```

---

### 7. **Firewall Configuration**
- [ ] **On Web01**: Configure firewall
  ```bash
  ssh ubuntu@3.84.27.55
  sudo ufw allow 80/tcp
  sudo ufw allow 443/tcp
  sudo ufw allow 22/tcp
  sudo ufw enable
  ```
- [ ] **On Web02**: Configure firewall
  ```bash
  ssh ubuntu@54.166.161.27
  sudo ufw allow 80/tcp
  sudo ufw allow 443/tcp
  sudo ufw allow 22/tcp
  sudo ufw enable
  ```
- [ ] **On Lb01**: Configure firewall
  ```bash
  ssh ubuntu@54.91.114.171
  sudo ufw allow 80/tcp
  sudo ufw allow 443/tcp
  sudo ufw allow 22/tcp
  sudo ufw enable
  ```

---

### 8. **Functional Testing Through Load Balancer**
- [ ] **Homepage**: Visit `http://www.isheja.tech` - loads correctly
- [ ] **User Registration**: Create a new account - works
- [ ] **User Login**: Login with credentials - works
- [ ] **Search Functionality**: Search for study partners - works
- [ ] **Messaging**: Send messages - works
- [ ] **Connections**: Send/accept connection requests - works
- [ ] **Admin Dashboard**: Access admin dashboard - works
- [ ] **All Features**: Every feature works through load balancer

---

### 9. **Health Checks**
- [ ] **Web01 Health**: `curl http://web-01.isheja.tech/health` → returns "healthy"
- [ ] **Web02 Health**: `curl http://web-02.isheja.tech/health` → returns "healthy"
- [ ] **Load Balancer Health**: `curl http://www.isheja.tech/health` → returns status
- [ ] **Backend Health Check**: `curl http://www.isheja.tech/backend-health` → works

---

### 10. **Documentation & Demo Video**
- [ ] **Document the deployment process** (already in `docs/deployment.md`)
- [ ] **Record demo video** showing:
  - [ ] Application running locally
  - [ ] Web01 accessible and working
  - [ ] Web02 accessible and working
  - [ ] Load balancer accessible and working
  - [ ] Traffic distribution (show logs)
  - [ ] Failover test (stop one server, show it still works)
  - [ ] All features working through load balancer

---

## 📋 Summary: What Part 2 Requires

### Core Requirements:
1. ✅ **Deploy application to 2 web servers** (Web01 and Web02)
2. ✅ **Configure Nginx on both web servers**
3. ✅ **Set up load balancer** (Lb01) using Nginx
4. ✅ **Configure load balancing** (distribute traffic between servers)
5. ✅ **Implement health checks** (for monitoring)
6. ✅ **Test failover** (application works when one server is down)
7. ✅ **Verify traffic distribution** (requests split between servers)
8. ✅ **Test all features** through load balancer
9. ✅ **Configure firewalls** (security)
10. ✅ **Document and demonstrate** (demo video)

---

## 🎬 Demo Video Requirements

Your demo video must show:

1. **Local Application** (30 seconds)
   - Show application running locally
   - Quick demo of features

2. **Web01 Deployment** (1 minute)
   - Access `http://web-01.isheja.tech`
   - Show application loading
   - Test one feature (e.g., registration)

3. **Web02 Deployment** (1 minute)
   - Access `http://web-02.isheja.tech`
   - Show application loading
   - Verify identical functionality

4. **Load Balancer** (1 minute)
   - Access `http://www.isheja.tech`
   - Show application loading through load balancer
   - Test features work

5. **Traffic Distribution** (1 minute)
   - Show load balancer logs
   - Make multiple requests
   - Show requests being distributed between Web01 and Web02

6. **Failover Test** (1 minute)
   - Stop one backend server (Web01 or Web02)
   - Show application still works through load balancer
   - Restart the server

7. **Final Verification** (1 minute)
   - Show all features working through load balancer
   - User registration, login, search, messaging, admin dashboard

**Total video length: ~7-8 minutes**

---

## 🚀 Quick Start Commands

### Deploy to Web01
```bash
scp -r * ubuntu@3.84.27.55:/var/www/academico/
ssh ubuntu@3.84.27.55
# Then configure Nginx (see docs/deployment.md)
```

### Deploy to Web02
```bash
scp -r * ubuntu@54.166.161.27:/var/www/academico/
ssh ubuntu@54.166.161.27
# Then configure Nginx (see docs/deployment.md)
```

### Configure Load Balancer
```bash
ssh ubuntu@54.91.114.171
# Then configure Nginx as load balancer (see docs/deployment.md)
```

---

## 📚 Detailed Instructions

For complete step-by-step instructions with all configuration files, see:
- **`docs/deployment.md`** - Full deployment guide with all Nginx configs

---

## ✅ Completion Criteria

Part 2 is complete when:
- [x] Both Web01 and Web02 serve the application
- [x] Load balancer distributes traffic between both servers
- [x] Application works through load balancer
- [x] Failover works (one server down, app still works)
- [x] Traffic distribution is verified
- [x] All features work through load balancer
- [x] Demo video recorded showing all above

**Once all checkboxes are checked, Part 2 is 100% complete! 🎉**

