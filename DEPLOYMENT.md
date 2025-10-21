# HooPredict VPS Deployment Guide

This guide will help you deploy HooPredict to your VPS at `hoopredict.websimas.com`.

## Prerequisites

- VPS with Ubuntu 22.04/24.04 (or similar Linux distribution)
- SSH access to your VPS
- Domain managed via Cloudflare
- Root or sudo access

## Step 1: Cloudflare DNS Configuration

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Select your domain `websimas.com`
3. Go to **DNS** → **Records**
4. Click **Add record**
5. Configure:
   - **Type**: A
   - **Name**: hoopredict
   - **IPv4 address**: Your VPS IP address
   - **Proxy status**: Orange cloud (Proxied) - recommended for DDoS protection
   - **TTL**: Auto
6. Click **Save**

**Note**: If proxied through Cloudflare, you'll need to configure SSL in "Full" or "Full (strict)" mode later.

## Step 2: VPS Server Setup

SSH into your VPS:
```bash
ssh root@your-vps-ip
```

### Install Required Software

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Nginx
sudo apt install nginx -y

# Install PHP 8.3 and required extensions
sudo apt install -y software-properties-common
sudo add-apt-repository ppa:ondrej/php -y
sudo apt update
sudo apt install -y php8.3 php8.3-fpm php8.3-cli php8.3-common \
    php8.3-mysql php8.3-pgsql php8.3-sqlite3 php8.3-zip \
    php8.3-gd php8.3-mbstring php8.3-curl php8.3-xml \
    php8.3-bcmath php8.3-redis php8.3-intl

# Install Composer
curl -sS https://getcomposer.org/installer | php
sudo mv composer.phar /usr/local/bin/composer

# Install Node.js 20 and npm
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install MySQL (or PostgreSQL)
sudo apt install -y mysql-server

# Install Git
sudo apt install -y git

# Install Certbot for SSL
sudo apt install -y certbot python3-certbot-nginx

# Install Supervisor (for queue workers and Reverb)
sudo apt install -y supervisor

# Install Redis (for queues and cache)
sudo apt install -y redis-server
sudo systemctl enable redis-server
sudo systemctl start redis-server
```

## Step 3: Create Database

```bash
# Secure MySQL installation
sudo mysql_secure_installation

# Create database and user
sudo mysql -u root -p

# In MySQL prompt:
CREATE DATABASE hoopredict CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'hoopredict'@'localhost' IDENTIFIED BY 'your_secure_password_here';
GRANT ALL PRIVILEGES ON hoopredict.* TO 'hoopredict'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

## Step 4: Deploy Application

```bash
# Create application directory
sudo mkdir -p /var/www/hoopredict
sudo chown -R $USER:www-data /var/www/hoopredict

# Clone your repository (or upload via FTP/SFTP)
cd /var/www
git clone https://github.com/yourusername/hoopredict.git hoopredict
# OR upload files via SFTP to /var/www/hoopredict

cd /var/www/hoopredict

# Install PHP dependencies
composer install --optimize-autoloader --no-dev

# Install Node dependencies
npm install

# Build frontend assets
npm run build

# Set correct permissions
sudo chown -R www-data:www-data /var/www/hoopredict
sudo chmod -R 755 /var/www/hoopredict
sudo chmod -R 775 /var/www/hoopredict/storage
sudo chmod -R 775 /var/www/hoopredict/bootstrap/cache
```

## Step 5: Configure Environment

```bash
# Copy environment file
cp .env.example .env

# Generate application key
php artisan key:generate

# Edit .env file
nano .env
```

Update these values in `.env`:

```env
APP_NAME=HooPredict
APP_ENV=production
APP_DEBUG=false
APP_URL=https://hoopredict.websimas.com

# Database
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=hoopredict
DB_USERNAME=hoopredict
DB_PASSWORD=your_secure_password_here

# Cache & Queue (using Redis)
CACHE_STORE=redis
QUEUE_CONNECTION=redis
SESSION_DRIVER=redis

# Redis
REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379

# Broadcasting (Reverb)
BROADCAST_CONNECTION=reverb

REVERB_APP_ID=your_app_id
REVERB_APP_KEY=your_app_key
REVERB_APP_SECRET=your_app_secret
REVERB_HOST=hoopredict.websimas.com
REVERB_PORT=8080
REVERB_SCHEME=https

VITE_REVERB_APP_KEY="${REVERB_APP_KEY}"
VITE_REVERB_HOST="${REVERB_HOST}"
VITE_REVERB_PORT="${REVERB_PORT}"
VITE_REVERB_SCHEME="${REVERB_SCHEME}"

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI="${APP_URL}/auth/google/callback"
```

**Important**: Update Google OAuth redirect URIs in Google Cloud Console to:
- `https://hoopredict.websimas.com/auth/google/callback`

```bash
# Run migrations
php artisan migrate --force

# Create storage link
php artisan storage:link

# Cache configuration
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Download team logos and scrape data (optional)
php artisan scrape:euroleague
```

## Step 6: Configure Nginx

Create Nginx configuration:

```bash
sudo nano /etc/nginx/sites-available/hoopredict
```

Add this configuration:

```nginx
# Redirect HTTP to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name hoopredict.websimas.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name hoopredict.websimas.com;

    root /var/www/hoopredict/public;
    index index.php index.html;

    # SSL certificates (will be configured by Certbot)
    # ssl_certificate /etc/letsencrypt/live/hoopredict.websimas.com/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/hoopredict.websimas.com/privkey.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Logging
    access_log /var/log/nginx/hoopredict-access.log;
    error_log /var/log/nginx/hoopredict-error.log;

    # Max upload size
    client_max_body_size 100M;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript application/json;

    # Main location
    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    # PHP-FPM
    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/var/run/php/php8.3-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
        fastcgi_hide_header X-Powered-By;
    }

    # Deny access to hidden files
    location ~ /\. {
        deny all;
    }

    # Reverb WebSocket proxy (if using Reverb for real-time features)
    location /app {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400;
    }
}
```

Enable the site:

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/hoopredict /etc/nginx/sites-enabled/

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

## Step 7: SSL Certificate with Let's Encrypt

```bash
# Obtain SSL certificate
sudo certbot --nginx -d hoopredict.websimas.com

# Follow the prompts:
# - Enter email address
# - Agree to terms
# - Choose whether to redirect HTTP to HTTPS (recommended: yes)

# Certbot will automatically configure Nginx with SSL
# Test auto-renewal
sudo certbot renew --dry-run
```

**If using Cloudflare Proxy (Orange Cloud)**:
1. Go to Cloudflare → SSL/TLS → Overview
2. Set encryption mode to **Full (strict)**
3. Go to SSL/TLS → Origin Server
4. Create an Origin Certificate (15 years validity)
5. Save the certificate and key on your server
6. Update Nginx SSL paths to use Cloudflare Origin Certificate

## Step 8: Configure Supervisor for Queue & Reverb

### Queue Worker Configuration

```bash
sudo nano /etc/supervisor/conf.d/hoopredict-worker.conf
```

Add:

```ini
[program:hoopredict-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /var/www/hoopredict/artisan queue:work redis --sleep=3 --tries=3 --max-time=3600
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
user=www-data
numprocs=2
redirect_stderr=true
stdout_logfile=/var/www/hoopredict/storage/logs/worker.log
stopwaitsecs=3600
```

### Reverb WebSocket Server Configuration

```bash
sudo nano /etc/supervisor/conf.d/hoopredict-reverb.conf
```

Add:

```ini
[program:hoopredict-reverb]
process_name=%(program_name)s
command=php /var/www/hoopredict/artisan reverb:start --host=0.0.0.0 --port=8080
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
user=www-data
numprocs=1
redirect_stderr=true
stdout_logfile=/var/www/hoopredict/storage/logs/reverb.log
stopwaitsecs=3600
```

### Apply Supervisor Configuration

```bash
# Reread configuration
sudo supervisorctl reread

# Update supervisor
sudo supervisorctl update

# Start all processes
sudo supervisorctl start hoopredict-worker:*
sudo supervisorctl start hoopredict-reverb:*

# Check status
sudo supervisorctl status
```

## Step 9: Configure Scheduled Tasks (Cron)

```bash
# Edit crontab
sudo crontab -e -u www-data
```

Add:

```cron
# Laravel Scheduler
* * * * * cd /var/www/hoopredict && php artisan schedule:run >> /dev/null 2>&1

# Optional: Scrape EuroLeague data daily at 3 AM
0 3 * * * cd /var/www/hoopredict && php artisan scrape:euroleague >> /var/www/hoopredict/storage/logs/scraper.log 2>&1
```

## Step 10: Firewall Configuration

```bash
# Allow HTTP, HTTPS, and SSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

## Step 11: Performance Optimization

### PHP-FPM Tuning

```bash
sudo nano /etc/php/8.3/fpm/pool.d/www.conf
```

Adjust these values based on your VPS resources:

```ini
pm = dynamic
pm.max_children = 50
pm.start_servers = 5
pm.min_spare_servers = 5
pm.max_spare_servers = 35
pm.max_requests = 500
```

Restart PHP-FPM:

```bash
sudo systemctl restart php8.3-fpm
```

### OPcache Configuration

```bash
sudo nano /etc/php/8.3/fpm/conf.d/10-opcache.ini
```

```ini
opcache.enable=1
opcache.memory_consumption=256
opcache.interned_strings_buffer=16
opcache.max_accelerated_files=10000
opcache.revalidate_freq=2
opcache.validate_timestamps=0
```

## Deployment Workflow (Future Updates)

Create a deployment script:

```bash
nano /var/www/hoopredict/deploy.sh
```

```bash
#!/bin/bash

cd /var/www/hoopredict

# Enable maintenance mode
php artisan down

# Pull latest changes
git pull origin main

# Install/update dependencies
composer install --no-dev --optimize-autoloader
npm install
npm run build

# Run migrations
php artisan migrate --force

# Clear and cache
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Restart services
sudo supervisorctl restart hoopredict-worker:*
sudo supervisorctl restart hoopredict-reverb:*

# Disable maintenance mode
php artisan up

echo "Deployment completed!"
```

Make it executable:

```bash
chmod +x /var/www/hoopredict/deploy.sh
```

## Troubleshooting

### Check Logs

```bash
# Laravel logs
tail -f /var/www/hoopredict/storage/logs/laravel.log

# Nginx error logs
sudo tail -f /var/log/nginx/hoopredict-error.log

# Supervisor logs
sudo tail -f /var/www/hoopredict/storage/logs/worker.log
sudo tail -f /var/www/hoopredict/storage/logs/reverb.log

# PHP-FPM logs
sudo tail -f /var/log/php8.3-fpm.log
```

### Common Issues

**500 Error**:
- Check Laravel logs
- Ensure storage and cache directories are writable
- Run `php artisan config:clear`

**WebSockets not working**:
- Check if Reverb is running: `sudo supervisorctl status hoopredict-reverb`
- Verify Nginx proxy configuration
- Check firewall allows port 8080

**Database connection issues**:
- Verify credentials in `.env`
- Check MySQL is running: `sudo systemctl status mysql`

**Permission issues**:
```bash
sudo chown -R www-data:www-data /var/www/hoopredict
sudo chmod -R 775 /var/www/hoopredict/storage
sudo chmod -R 775 /var/www/hoopredict/bootstrap/cache
```

## Security Checklist

- [ ] SSL certificate installed and auto-renewal configured
- [ ] Firewall enabled (UFW)
- [ ] `APP_DEBUG=false` in production
- [ ] Strong database password
- [ ] Disabled directory listing in Nginx
- [ ] Security headers configured
- [ ] Regular backups configured
- [ ] Database backups automated
- [ ] File permissions correctly set
- [ ] Root SSH login disabled (optional but recommended)

## Monitoring

Consider setting up:
- **Uptime monitoring**: UptimeRobot, Pingdom
- **Error tracking**: Sentry, Bugsnag
- **Server monitoring**: New Relic, Datadog
- **Log aggregation**: Papertrail, Loggly

## Backup Strategy

```bash
# Database backup script
nano /root/backup-db.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/root/backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup database
mysqldump -u hoopredict -p'your_password' hoopredict | gzip > $BACKUP_DIR/hoopredict_$DATE.sql.gz

# Keep only last 7 days
find $BACKUP_DIR -name "hoopredict_*.sql.gz" -mtime +7 -delete
```

Schedule daily backups:
```bash
sudo crontab -e
# Add: 0 2 * * * /root/backup-db.sh
```

---

## Quick Reference

**Start services**:
```bash
sudo supervisorctl start all
sudo systemctl start nginx
sudo systemctl start php8.3-fpm
```

**Restart services**:
```bash
sudo supervisorctl restart all
sudo systemctl restart nginx
sudo systemctl restart php8.3-fpm
```

**Clear cache**:
```bash
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear
```

**Access site**: https://hoopredict.websimas.com
