#!/bin/bash

# QarbonQuery Docker Development Environment Startup Script

set -e

echo "🚀 Starting QarbonQuery Development Environment..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Navigate to the docker directory
cd "$(dirname "$0")"

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📋 Creating .env file..."
    cp .env .env.local
    echo "✅ .env file created. You can customize it if needed."
fi

# Pull latest images
echo "📦 Pulling latest Docker images..."
docker-compose pull

# Start services
echo "🏃 Starting services..."
docker-compose up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be healthy..."
timeout=60
elapsed=0

while [ $elapsed -lt $timeout ]; do
    if docker-compose ps | grep -q "healthy"; then
        break
    fi
    echo "  Waiting... ($elapsed/$timeout seconds)"
    sleep 5
    elapsed=$((elapsed + 5))
done

# Check service status
echo "📊 Service Status:"
docker-compose ps

echo ""
echo "✅ QarbonQuery Development Environment is ready!"
echo ""
echo "🔗 Access URLs:"
echo "  📊 Adminer (Database UI): http://localhost:8080"
echo "  🧪 Mock Carbon API: http://localhost:3004"
echo "  ⚡ Redis: localhost:6379"
echo "  🗄️  PostgreSQL: localhost:5432"
echo ""
echo "🌐 Local domains (add to /etc/hosts):"
echo "  127.0.0.1 api.qarbon.local"
echo "  127.0.0.1 dashboard.qarbon.local"
echo "  127.0.0.1 docs.qarbon.local"
echo "  127.0.0.1 enterprise.qarbon.local"
echo "  127.0.0.1 mock-api.qarbon.local"
echo ""
echo "📝 Database Connection:"
echo "  URL: postgresql://qarbon:qarbonsecret@localhost:5432/qarbon_dev"
echo ""
echo "🛠️  Useful commands:"
echo "  View logs: docker-compose logs -f"
echo "  Stop services: docker-compose down"
echo "  Reset data: docker-compose down -v"
echo ""
echo "Happy coding! 🎉"
