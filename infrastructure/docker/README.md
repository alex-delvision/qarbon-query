# QarbonQuery Docker Development Environment

This Docker Compose setup provides a complete local development environment for QarbonQuery with all
necessary services.

## Services Included

| Service         | Port | Description                      |
| --------------- | ---- | -------------------------------- |
| PostgreSQL 15   | 5432 | Main database (`qarbon_dev`)     |
| Redis           | 6379 | Cache and session storage        |
| Nginx           | 80   | Reverse proxy and load balancer  |
| Adminer         | 8080 | Database administration UI       |
| Mock Carbon API | 3004 | Simulated carbon marketplace API |

## Quick Start

1. **Start all services:**

   ```bash
   cd infrastructure/docker
   docker-compose up -d
   ```

2. **View logs:**

   ```bash
   docker-compose logs -f
   ```

3. **Stop all services:**

   ```bash
   docker-compose down
   ```

4. **Reset data (remove volumes):**
   ```bash
   docker-compose down -v
   ```

## Service Details

### PostgreSQL Database

- **Host:** `localhost:5432`
- **Database:** `qarbon_dev`
- **User:** `qarbon`
- **Password:** `qarbonsecret`
- **Connection URL:** `postgresql://qarbon:qarbonsecret@localhost:5432/qarbon_dev`

### Redis Cache

- **Host:** `localhost:6379`
- **URL:** `redis://localhost:6379`
- No authentication required for development

### Nginx Reverse Proxy

Routes traffic to your local development services:

| Domain                    | Target                 | Description      |
| ------------------------- | ---------------------- | ---------------- |
| `api.qarbon.local`        | `localhost:3000`       | API Gateway      |
| `dashboard.qarbon.local`  | `localhost:3001`       | Web Dashboard    |
| `docs.qarbon.local`       | `localhost:3002`       | Developer Portal |
| `enterprise.qarbon.local` | `localhost:3003`       | Enterprise App   |
| `mock-api.qarbon.local`   | `mock-carbon-api:3004` | Mock Carbon API  |

### Adminer Database UI

- **URL:** http://localhost:8080
- **Server:** `postgres_qarbon`
- **Username:** `qarbon`
- **Password:** `qarbonsecret`
- **Database:** `qarbon_dev`

### Mock Carbon Marketplace API

- **URL:** http://localhost:3004
- **Endpoints:**
  - `GET /api/v1/credits` - List available carbon credits
  - `POST /api/v1/purchase` - Purchase carbon credits

## Local DNS Setup

Add these entries to your `/etc/hosts` file for easier development:

```
127.0.0.1 api.qarbon.local
127.0.0.1 dashboard.qarbon.local
127.0.0.1 docs.qarbon.local
127.0.0.1 enterprise.qarbon.local
127.0.0.1 mock-api.qarbon.local
```

## Environment Variables

Copy `.env` file to customize settings:

```bash
cp .env.example .env
```

Key variables:

- `POSTGRES_PASSWORD` - Database password
- `JWT_SECRET` - JWT signing secret
- Service ports configuration

## Health Checks

All services include health checks:

- **PostgreSQL:** `pg_isready` command
- **Redis:** `redis-cli ping`
- **Mock API:** HTTP GET to `/`

Check service health:

```bash
docker-compose ps
```

## Data Persistence

Data is persisted in Docker volumes:

- `postgres_data` - Database files
- `redis_data` - Redis persistence

## Troubleshooting

### Common Issues

1. **Port conflicts:**

   ```bash
   # Check what's using a port
   lsof -i :5432
   ```

2. **Permission issues:**

   ```bash
   # Reset Docker volumes
   docker-compose down -v
   docker system prune -f
   ```

3. **Database connection issues:**

   ```bash
   # Test database connection
   docker-compose exec postgres psql -U qarbon -d qarbon_dev
   ```

4. **View service logs:**

   ```bash
   # All services
   docker-compose logs

   # Specific service
   docker-compose logs postgres
   ```

### Reset Everything

To completely reset the development environment:

```bash
# Stop and remove containers, networks, and volumes
docker-compose down -v

# Remove all unused Docker resources
docker system prune -a -f

# Start fresh
docker-compose up -d
```

## Network Configuration

All services run on the `qarbon-network` bridge network, allowing:

- Service-to-service communication by container name
- Isolated network environment
- Custom DNS resolution

## Security Notes

⚠️ **Development Only**: This setup is for local development only and includes:

- Default passwords
- Open network access
- No TLS/SSL encryption
- Permissive CORS settings

Never use these configurations in production!
