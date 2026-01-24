# 🚀 Simple Nginx Setup Guide for Backend (Beginner Friendly)

## What is Nginx?
**Think of Nginx as a traffic director** 🚦
- Your backend runs on port 5000 (only accessible locally)
- Nginx sits in front and makes it accessible on port 80 (the internet)
- When someone visits `http://72.62.232.178`, Nginx forwards the request to your backend

---

## 📋 Step-by-Step Instructions

### **Step 1: Connect to Your VPS**
```bash
ssh root@72.62.232.178
```
*(Enter your password when asked)*

---

### **Step 2: Make Sure Nginx is Installed**
```bash
nginx -v
```

**If you see a version number** ✅ → Nginx is installed, continue to Step 3

**If you see "command not found"** ❌ → Install it first:
```bash
apt update
apt install nginx -y
```

---

### **Step 3: Create the Nginx Configuration File**

**What we're doing:** Creating a file that tells Nginx how to handle requests.

**Command:**
```bash
nano /etc/nginx/sites-available/backend
```

**What happens:** A text editor opens (nano). It will be empty.

**Paste this EXACT code** (copy all of it):

```nginx
server {
    listen 80;
    server_name _;

    # Increase upload size limit (for file uploads)
    client_max_body_size 10M;

    # Proxy all requests to backend
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
}
```

**What each line means:**
- `listen 80;` → Listen on port 80 (standard web port)
- `server_name _;` → Accept requests from any domain/IP
- `proxy_pass http://localhost:5000;` → Forward requests to your backend
- `client_max_body_size 10M;` → Allow file uploads up to 10MB
- The rest → Headers needed for proper communication

**How to save:**
1. Press `CTRL + O` (that's the letter O, not zero)
2. Press `Enter` to confirm
3. Press `CTRL + X` to exit

---

### **Step 4: Enable the Configuration**

**What we're doing:** Creating a link so Nginx knows to use this config.

**Command:**
```bash
ln -s /etc/nginx/sites-available/backend /etc/nginx/sites-enabled/
```

**What this does:** Creates a shortcut (symbolic link) from `sites-available` to `sites-enabled`

---

### **Step 5: Remove the Default Nginx Page**

**Why:** The default Nginx page can cause conflicts.

**Command:**
```bash
rm /etc/nginx/sites-enabled/default
```

**What this does:** Deletes the default welcome page configuration

---

### **Step 6: Test Nginx Configuration**

**What we're doing:** Checking if our config file has any errors.

**Command:**
```bash
nginx -t
```

**Expected output:**
```
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

✅ **If you see "syntax is ok"** → Continue to Step 7

❌ **If you see errors** → Go back to Step 3 and check your code

---

### **Step 7: Restart Nginx**

**Command:**
```bash
systemctl restart nginx
```

**What this does:** Restarts Nginx with your new configuration

**Check if it's running:**
```bash
systemctl status nginx
```

**Press `q` to exit the status view**

---

### **Step 8: Test Your Backend (MOST IMPORTANT!)**

**Option 1: From your computer (browser)**
Open: `http://72.62.232.178/health`

**Option 2: From the VPS (command line)**
```bash
curl http://localhost/health
```

**Expected response:**
```json
{"status":"OK","timestamp":"2024-01-15T10:30:00.000Z"}
```

✅ **If you see this** → SUCCESS! Your backend is accessible!

❌ **If you see "Connection refused" or error** → Check:
1. Is your backend running? `pm2 list`
2. Is it on port 5000? Check `backend/.env` file
3. Check Nginx logs: `tail -f /var/log/nginx/error.log`

---

## 🔍 Troubleshooting

### **Backend not responding?**
```bash
# Check if backend is running
pm2 list

# Check backend logs
pm2 logs

# Restart backend
pm2 restart all
```

### **Nginx not working?**
```bash
# Check Nginx status
systemctl status nginx

# Check Nginx error logs
tail -20 /var/log/nginx/error.log

# Test configuration again
nginx -t
```

### **Port 80 already in use?**
```bash
# Check what's using port 80
sudo lsof -i :80

# Or
sudo netstat -tulpn | grep :80
```

---

## ✅ Success Checklist

- [ ] Nginx installed
- [ ] Configuration file created at `/etc/nginx/sites-available/backend`
- [ ] Configuration enabled (link created)
- [ ] Default config removed
- [ ] `nginx -t` shows no errors
- [ ] Nginx restarted
- [ ] `http://72.62.232.178/health` returns `{"status":"OK"}`

---

## 🎉 You're Done!

Your backend is now accessible on the internet at:
- **Health Check:** `http://72.62.232.178/health`
- **API Base:** `http://72.62.232.178/api`

**Next Steps:**
- Set up SSL/HTTPS (for security)
- Configure your frontend to point to this backend URL
- Set up domain name (optional)

---

## 📝 Quick Reference Commands

```bash
# Edit config
nano /etc/nginx/sites-available/backend

# Test config
nginx -t

# Restart Nginx
systemctl restart nginx

# Check Nginx status
systemctl status nginx

# View error logs
tail -f /var/log/nginx/error.log

# View access logs
tail -f /var/log/nginx/access.log
```
