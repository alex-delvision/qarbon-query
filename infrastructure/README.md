# QarbonQuery Infrastructure

This directory contains all infrastructure-as-code configurations for deploying QarbonQuery
services.

## Structure

```
infrastructure/
├── docker/          # Docker configurations and compose files
├── k8s/             # Kubernetes manifests and Helm charts
├── terraform/       # Terraform infrastructure definitions
└── README.md        # This file
```

## Quick Start

### Local Development with Docker

```bash
# Build and start all services
cd infrastructure/docker
docker-compose up --build

# Start specific services
docker-compose up api-gateway emission-service
```

### Kubernetes Deployment

```bash
# Apply base infrastructure
kubectl apply -f k8s/base/

# Deploy services
kubectl apply -f k8s/services/
```

### Cloud Infrastructure with Terraform

```bash
# Initialize Terraform
cd terraform/
terraform init

# Plan deployment
terraform plan

# Apply infrastructure
terraform apply
```

## Services

- **API Gateway**: Main entry point and routing
- **Emission Service**: Carbon calculation engine
- **Offset Service**: Carbon offset management
- **Auth Service**: Authentication and authorization

## Environment Configuration

Copy `.env.example` to `.env` and configure:

- Database connections
- API keys
- Service endpoints
- Security settings

## Monitoring

- Prometheus metrics
- Grafana dashboards
- ELK stack for logging
- Health checks and alerts

## Security

- HTTPS/TLS termination
- JWT authentication
- Rate limiting
- CORS configuration
- Security headers
