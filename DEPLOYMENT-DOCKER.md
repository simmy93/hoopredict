# HooPredict Docker Deployment Guide

Deploy HooPredict to your VPS using Docker and Traefik (similar to your existing websimas.com setup).

## Prerequisites

- VPS with Docker and Docker Compose installed
- Traefik reverse proxy already running (from your websimas.com setup)
- Domain managed via Cloudflare
- SSH access to your VPS

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      Traefik Proxy                       │
│            (handles SSL, routing, load balancing)        │
└────────────────┬────────────────────────────────────────┘
                 │
                 ├──> hoopredict.websimas.com:80 → App Container (HTTP)
                 └──> hoopredict.websimas.com/app → App Container (WebSocket:8080)
                      │
                      ├──> Nginx (port 80)
                      ├──> PHP-FPM (port 9000)
                      ├──> Laravel Reverb (port 8080)
                      ├──> Queue Workers (2 processes)
                      └──> Scheduler
                      │
                      ├──> MySQL Container
                      └──> Redis Container
```

## Step 1: Cloudflare DNS Configuration

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Select your domain `websimas.com`
3. Go to **DNS** → **Records**
4. Click **Add record**
5. Configure:
   - **Type**: A
   - **Name**: hoopredict
   - **IPv4 address**: Your VPS IP address
   - **Proxy status**: ☁️ Proxied (orange cloud)
   - **TTL**: Auto
6. Click **Save**

## Step 2: Prepare VPS

SSH into your VPS:

```bash
ssh your-user@your-vps-ip
```

### Ensure Docker Network Exists

```bash
# Check if traefik-network exists (used by your websimas.com)
docker network ls | grep traefik-network

# If it doesn't exist, create it
docker network create traefik-network
```

### Create Application Directory

```bash
# Create directory for HooPredict
mkdir -p ~/hoopredict
cd ~/hoopredict
```

## Step 3: Upload Application Files

You can either:

**Option A: Using Git**
```bash
cd ~/hoopredict
git clone https://github.com/yourusername/hoopredict.git .
```

**Option B: Using SCP/SFTP**
```bash
# From your local machine
scp -r /path/to/hoopredict/* your-user@vps-ip:~/hoopredict/
```

**Option C: Using rsync**
```bash
# From your local machine
rsync -avz --exclude 'node_modules' --exclude 'vendor' /path/to/hoopredict/ your-user@vps-ip:~/hoopredict/
```

## Step 4: Configure Environment

```bash
cd ~/hoopredict

# Copy environment file
cp .env.example .env

# Edit environment variables
nano .env
```

### Required .env Configuration

```env
# Application
APP_NAME=HooPredict
APP_ENV=production
APP_DEBUG=false
APP_URL=https://hoopredict.websimas.com

# Generate this key after first container startup
APP_KEY=

# Database (Docker service names)
DB_CONNECTION=mysql
DB_HOST=db
DB_PORT=3306
DB_DATABASE=hoopredict
DB_USERNAME=hoopredict
DB_PASSWORD=YOUR_SECURE_DB_PASSWORD_HERE
DB_ROOT_PASSWORD=YOUR_SECURE_ROOT_PASSWORD_HERE

# Redis (Docker service name)
CACHE_STORE=redis
QUEUE_CONNECTION=redis
SESSION_DRIVER=redis
REDIS_HOST=redis
REDIS_PORT=6379

# Broadcasting (Reverb)
BROADCAST_CONNECTION=reverb

REVERB_APP_ID=hoopredict-app
REVERB_APP_KEY=your-app-key-here
REVERB_APP_SECRET=your-app-secret-here
REVERB_HOST=hoopredict.websimas.com
REVERB_PORT=443
REVERB_SCHEME=https

VITE_REVERB_APP_KEY="${REVERB_APP_KEY}"
VITE_REVERB_HOST="${REVERB_HOST}"
VITE_REVERB_PORT="${REVERB_PORT}"
VITE_REVERB_SCHEME="${REVERB_SCHEME}"

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI="${APP_URL}/auth/google/callback"

# Mail (optional - use log driver for now)
MAIL_MAILER=log
```

**Important**: Update your Google OAuth redirect URIs in Google Cloud Console:
- Add: `https://hoopredict.websimas.com/auth/google/callback`

## Step 5: Update Traefik Configuration

If you're using Traefik (like your websimas.com), you might need to ensure it's configured correctly.

Check your existing Traefik docker compose.yml:

```bash
# Find your Traefik setup
find ~ -name "docker compose.yml" -exec grep -l "traefik" {} \;
```

Your Traefik should have:
- HTTP entrypoint (port 80)
- HTTPS entrypoint (port 443)
- Let's Encrypt certificate resolver

If needed, here's a minimal Traefik setup:

```yaml
# ~/traefik/docker compose.yml
version: '3.8'

services:
  traefik:
    image: traefik:v2.11
    container_name: traefik
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - ./traefik.yml:/traefik.yml:ro
      - ./acme.json:/acme.json
    networks:
      - traefik-network

networks:
  traefik-network:
    external: true
```

```yaml
# ~/traefik/traefik.yml
api:
  dashboard: true

entryPoints:
  web:
    address: ":80"
    http:
      redirections:
        entryPoint:
          to: websecure
          scheme: https

  websecure:
    address: ":443"

providers:
  docker:
    endpoint: "unix:///var/run/docker.sock"
    exposedByDefault: false
    network: traefik-network

certificatesResolvers:
  letsencrypt:
    acme:
      email: your-email@example.com
      storage: acme.json
      httpChallenge:
        entryPoint: web
```

## Step 6: Build and Deploy

Make deployment script executable:

```bash
chmod +x deploy-docker.sh
```

Run the deployment:

```bash
./deploy-docker.sh
```

This script will:
1. Build the Docker image
2. Start all containers (app, database, redis)
3. Run database migrations
4. Cache configuration
5. Set proper permissions

### Manual Deployment Steps (if script fails)

```bash
# Build image
docker compose build

# Start containers
docker compose up -d

# Generate app key (first time only)
docker compose exec app php artisan key:generate

# Run migrations
docker compose exec app php artisan migrate --force

# Create storage link
docker compose exec app php artisan storage:link

# Cache config
docker compose exec app php artisan config:cache
docker compose exec app php artisan route:cache
docker compose exec app php artisan view:cache
```

## Step 7: Verify Deployment

### Check Container Status

```bash
docker compose ps
```

All containers should show "Up" status.

### Check Logs

```bash
# Application logs
docker compose logs -f app

# Database logs
docker compose logs -f db

# Redis logs
docker compose logs -f redis

# Follow all logs
docker compose logs -f
```

### Access the Application

Visit: `https://hoopredict.websimas.com`

## Step 8: Initial Data Setup (Optional)

```bash
# Scrape EuroLeague data
docker compose exec app php artisan scrape:euroleague

# Create admin user (if you have a seeder)
docker compose exec app php artisan db:seed --class=AdminUserSeeder
```

## Step 9: Laravel Scheduler Setup (IMPORTANT!)

HooPredict uses Laravel's scheduler to automatically:
- Update game scores every hour
- Scrape player statistics
- Calculate player prices when rounds complete

**The scheduler is already configured in the Docker container**, but you need to verify it's running:

### Verify Scheduler is Running

```bash
# Check if Laravel scheduler is active in supervisor
docker compose exec app supervisorctl status

# You should see:
# laravel-scheduler    RUNNING   pid 123, uptime 0:01:00
```

### How It Works (Docker)

The Dockerfile already includes a cron setup via Supervisor. The scheduler runs every minute and executes:

```bash
* * * * * php /var/www/artisan schedule:run >> /dev/null 2>&1
```

This single cron entry handles ALL scheduled tasks. Laravel internally manages:
- ✅ **`scrape:recent`** - Runs hourly (updates games, stats, prices)
- ✅ All other scheduled jobs you add in the future

### View Scheduled Tasks

```bash
# See what tasks are scheduled
docker compose exec app php artisan schedule:list

# Output shows:
# 0 * * * *  scrape:recent ........ Next Due: 1 hour from now
```

### Manual Trigger (Testing)

```bash
# Trigger the scheduler manually (for testing)
docker compose exec app php artisan schedule:run

# Or run the smart scraper directly
docker compose exec app php artisan scrape:recent
```

### Monitor Scheduler Logs

```bash
# View real-time logs to see scheduler activity
docker compose exec app tail -f storage/logs/laravel.log | grep -i "scrape\|schedule"

# You'll see entries like:
# [2025-10-21 18:00:00] Starting smart scraping of recent rounds
# [2025-10-21 18:00:15] Smart scraping completed
# [2025-10-21 18:00:20] Round 6 processed successfully
```

### Troubleshooting Scheduler

If tasks aren't running:

```bash
# 1. Check if supervisor is running the scheduler
docker compose exec app supervisorctl status laravel-scheduler

# 2. Restart the scheduler
docker compose exec app supervisorctl restart laravel-scheduler

# 3. Check for errors in logs
docker compose exec app tail -f storage/logs/laravel.log

# 4. Manually test the workflow
docker compose exec app php artisan scrape:recent
```

### What Gets Automated

Once the scheduler is running, the following happens **automatically every hour**:

1. **Scrape recent rounds** (only 4 rounds, not all 38!)
2. **Update game scores** from EuroLeague API
3. **Update player statistics** for finished games
4. **Calculate player prices** (if round is complete)
5. **Save price history** for tracking

**No manual intervention needed!** 🎉

## Maintenance Commands

### Update Application

```bash
cd ~/hoopredict

# Pull latest code
git pull origin main

# Run deployment script
./deploy-docker.sh
```

### View Logs

```bash
# Real-time application logs
docker compose logs -f app

# Laravel logs
docker compose exec app tail -f storage/logs/laravel.log

# Queue worker logs
docker compose exec app tail -f storage/logs/worker.log

# Reverb logs
docker compose exec app tail -f storage/logs/reverb.log
```

### Access Container Shell

```bash
# Access app container
docker compose exec app sh

# Access database
docker compose exec db mysql -u hoopredict -p hoopredict
```

### Restart Services

```bash
# Restart all containers
docker compose restart

# Restart only app
docker compose restart app

# Restart queue workers (inside container)
docker compose exec app supervisorctl restart laravel-worker:*

# Restart Reverb
docker compose exec app supervisorctl restart laravel-reverb
```

### Clear Cache

```bash
docker compose exec app php artisan cache:clear
docker compose exec app php artisan config:clear
docker compose exec app php artisan route:clear
docker compose exec app php artisan view:clear
```

### Database Backup

```bash
# Backup database
docker compose exec db mysqldump -u hoopredict -p hoopredict > backup_$(date +%Y%m%d).sql

# Restore database
docker compose exec -T db mysql -u hoopredict -p hoopredict < backup_20240101.sql
```

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker compose logs app

# Check if port is already in use
sudo netstat -tlnp | grep :80
sudo netstat -tlnp | grep :443
```

### Permission Errors

```bash
docker compose exec app chown -R www-data:www-data /var/www/storage
docker compose exec app chmod -R 775 /var/www/storage
docker compose exec app chmod -R 775 /var/www/bootstrap/cache
```

### Database Connection Issues

```bash
# Check if database is running
docker compose ps db

# Test database connection
docker compose exec app php artisan tinker
>>> DB::connection()->getPdo();
```

### WebSocket Not Working

```bash
# Check if Reverb is running
docker compose exec app supervisorctl status laravel-reverb

# Restart Reverb
docker compose exec app supervisorctl restart laravel-reverb

# Check Reverb logs
docker compose exec app tail -f storage/logs/reverb.log
```

### Build Errors

```bash
# Clear Docker cache and rebuild
docker compose build --no-cache

# Remove old containers and volumes
docker compose down -v
docker compose up -d
```

## Performance Optimization

### Enable OPcache

Already configured in `docker/php/php.ini`:
```ini
opcache.enable = 1
opcache.validate_timestamps = 0  # For production
```

### Optimize Composer Autoloader

```bash
docker compose exec app composer install --optimize-autoloader --no-dev
```

### Database Indexing

Ensure your migrations have proper indexes for:
- User lookups (email, google_id)
- Fantasy league queries
- Game schedules
- Draft picks

## Monitoring

### Resource Usage

```bash
# Container resource usage
docker stats

# Disk usage
docker system df
```

### Application Health

Create a health check endpoint and monitor it with:
- UptimeRobot
- Pingdom
- Custom monitoring script

### Log Aggregation

Consider sending logs to:
- Papertrail
- Loggly
- Sentry (for errors)

## Security Checklist

- [x] SSL/TLS enabled via Traefik
- [x] `APP_DEBUG=false` in production
- [x] Strong database passwords
- [x] Google OAuth configured with production URL
- [x] Firewall configured (UFW)
- [x] Docker socket not exposed
- [x] Environment variables properly secured
- [x] Regular backups scheduled
- [ ] Rate limiting configured
- [ ] CSRF protection enabled (Laravel default)
- [ ] Security headers configured

## Scaling

To handle more traffic:

### Horizontal Scaling (Multiple App Containers)

```yaml
# In docker compose.yml
services:
  app:
    deploy:
      replicas: 3  # Run 3 instances
```

### Increase Queue Workers

Edit `docker/supervisor/supervisord.conf`:
```ini
[program:laravel-worker]
numprocs=4  # Increase from 2 to 4
```

### Separate Database Server

For production, consider:
- Managed database (AWS RDS, DigitalOcean Database)
- Separate MySQL container on another server
- Read replicas for scaling

## Environment-Specific Tips

### If using Cloudflare Proxy

1. Set SSL/TLS mode to **Full (strict)** in Cloudflare
2. Traefik will still get Let's Encrypt certs
3. Benefit from Cloudflare's CDN and DDoS protection

### If using Docker Swarm

Deploy as a stack:
```bash
docker stack deploy -c docker compose.yml hoopredict
```

### If using Kubernetes

You'll need to convert this to K8s manifests or use Helm charts.

## Quick Reference

| Task | Command |
|------|---------|
| Deploy | `./deploy-docker.sh` |
| Logs | `docker compose logs -f app` |
| Restart | `docker compose restart app` |
| Shell | `docker compose exec app sh` |
| Artisan | `docker compose exec app php artisan {command}` |
| Migrations | `docker compose exec app php artisan migrate` |
| Cache clear | `docker compose exec app php artisan cache:clear` |
| Queue restart | `docker compose exec app supervisorctl restart laravel-worker:*` |

---

## Support

If you encounter issues:

1. Check container logs: `docker compose logs -f`
2. Verify environment variables: `docker compose exec app env | grep DB`
3. Test database connection: `docker compose exec app php artisan tinker`
4. Check Traefik dashboard (if enabled)
5. Verify DNS propagation: `dig hoopredict.websimas.com`

**Your application should now be live at:** `https://hoopredict.websimas.com` 🎉
