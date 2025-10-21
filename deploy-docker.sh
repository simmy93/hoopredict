#!/bin/bash

# HooPredict Docker Deployment Script
# Usage: ./deploy-docker.sh

set -e

echo "🚀 Starting HooPredict deployment..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ .env file not found! Please create one from .env.example"
    exit 1
fi

# Pull latest code (if using git)
if [ -d .git ]; then
    echo "📥 Pulling latest code..."
    git pull origin main
fi

# Build Docker image
echo "🔨 Building Docker image..."
docker-compose build --no-cache app

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose down

# Start containers
echo "🚀 Starting containers..."
docker-compose up -d

# Wait for database to be ready
echo "⏳ Waiting for database..."
sleep 10

# Run migrations
echo "📊 Running database migrations..."
docker-compose exec -T app php artisan migrate --force

# Create storage link
echo "🔗 Creating storage link..."
docker-compose exec -T app php artisan storage:link || true

# Clear and cache config
echo "🗑️  Clearing caches..."
docker-compose exec -T app php artisan config:clear
docker-compose exec -T app php artisan route:clear
docker-compose exec -T app php artisan view:clear
docker-compose exec -T app php artisan cache:clear

echo "💾 Caching configuration..."
docker-compose exec -T app php artisan config:cache
docker-compose exec -T app php artisan route:cache
docker-compose exec -T app php artisan view:cache

# Set correct permissions
echo "🔐 Setting permissions..."
docker-compose exec -T app chown -R www-data:www-data /var/www/storage
docker-compose exec -T app chmod -R 775 /var/www/storage
docker-compose exec -T app chmod -R 775 /var/www/bootstrap/cache

# Show container status
echo "📊 Container status:"
docker-compose ps

echo "✅ Deployment completed successfully!"
echo "🌐 Your application should be available at: https://hoopredict.websimas.com"
echo ""
echo "📝 To view logs, run:"
echo "   docker-compose logs -f app"
