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
docker compose build --no-cache app

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker compose down

# Start containers
echo "🚀 Starting containers..."
docker compose up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be ready..."
max_attempts=60
attempt=1

while [ $attempt -le $max_attempts ]; do
    # Check if all services are healthy
    db_health=$(docker inspect --format='{{.State.Health.Status}}' hoopredict-db 2>/dev/null || echo "unknown")
    redis_health=$(docker inspect --format='{{.State.Health.Status}}' hoopredict-redis 2>/dev/null || echo "unknown")

    echo "Attempt $attempt/$max_attempts: DB=$db_health, Redis=$redis_health"

    if [ "$db_health" = "healthy" ] && [ "$redis_health" = "healthy" ]; then
        echo "✅ All services are healthy!"
        break
    fi

    if [ $attempt -eq $max_attempts ]; then
        echo "❌ Services failed to become healthy after $max_attempts attempts"
        echo ""
        echo "📋 Database container logs:"
        docker compose logs db --tail=50
        echo ""
        echo "📋 Redis container logs:"
        docker compose logs redis --tail=20
        echo ""
        echo "📋 App container logs:"
        docker compose logs app --tail=20
        exit 1
    fi

    sleep 1
    attempt=$((attempt + 1))
done

# Additional wait to ensure app container is fully started
echo "⏳ Waiting for app container to be fully ready..."
sleep 5

# Run migrations
echo "📊 Running database migrations..."
docker compose exec -T app php artisan migrate --force

# Create storage link
echo "🔗 Creating storage link..."
docker compose exec -T app php artisan storage:link || true

# Clear and cache config
echo "🗑️  Clearing caches..."
docker compose exec -T app php artisan config:clear
docker compose exec -T app php artisan route:clear
docker compose exec -T app php artisan view:clear
docker compose exec -T app php artisan cache:clear

echo "💾 Caching configuration..."
docker compose exec -T app php artisan config:cache
docker compose exec -T app php artisan route:cache
docker compose exec -T app php artisan view:cache

# Set correct permissions
echo "🔐 Setting permissions..."
docker compose exec -T app chown -R www-data:www-data /var/www/storage
docker compose exec -T app chmod -R 775 /var/www/storage
docker compose exec -T app chmod -R 775 /var/www/bootstrap/cache

# Show container status
echo "📊 Container status:"
docker compose ps

echo "✅ Deployment completed successfully!"
echo "🌐 Your application should be available at: https://hoopredict.websimas.com"
echo ""
echo "📝 To view logs, run:"
echo "   docker-compose logs -f app"
