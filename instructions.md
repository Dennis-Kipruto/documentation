# RetailPay Documentation Platform

A comprehensive documentation management system built with Next.js, PostgreSQL, Prisma, and Meilisearch for modern development and production deployments.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Development Setup](#development-setup)
- [Production Setup with Docker](#production-setup-with-docker)
- [User Management](#user-management)
- [Documentation Management](#documentation-management)
- [Troubleshooting](#troubleshooting)

## Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose (for production setup)
- Git

## Development Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd netra-doc
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Create a `.env.local` file in the root directory:

```env
# Database - Use PostgreSQL for development
DATABASE_URL="postgresql://postgres:password@localhost:5432/netra_doc_dev"

# Authentication
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-super-secret-key-minimum-32-characters-long"

# Meilisearch
MEILISEARCH_HOST="http://localhost:7700"
MEILISEARCH_API_KEY="your-meilisearch-master-key"

# Email Configuration (Optional)
EMAIL_SERVER_HOST="smtp.example.com"
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER="your-email@example.com"
EMAIL_SERVER_PASSWORD="your-email-password"
EMAIL_FROM="noreply@example.com"
```

### 4. Database Setup

#### Option A: Local PostgreSQL
```bash
# Create database
createdb netra_doc_dev

# Run migrations
npx prisma db push

# Generate Prisma client
npx prisma generate
```

#### Option B: Docker PostgreSQL (Recommended)
```bash
# Start PostgreSQL container
docker run -d \
  --name netra-postgres-dev \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=netra_doc_dev \
  -p 5432:5432 \
  postgres:16-alpine

# Run migrations
npx prisma db push
```

### 5. Start Meilisearch (for search functionality)
```bash
# Using Docker
docker run -d \
  --name netra-meilisearch-dev \
  -p 7700:7700 \
  -e MEILI_MASTER_KEY=your-meilisearch-master-key \
  -e MEILI_ENV=development \
  getmeili/meilisearch:v1.10
```

### 6. Initial Setup
```bash
# Sync documentation from docs folder
npm run sync-docs

# Create an admin user
npm run create-user admin@example.com AdminPass123! admin

# Index documents in Meilisearch
npm run index-documents
```

### 7. Start Development Server
```bash
npm run dev
```

Visit http://localhost:3000 and login with your admin credentials.

## Production Setup with Docker

### 1. Prerequisites
- Docker and Docker Compose installed
- Domain name (optional, for public access)
- SSL certificates (optional, for HTTPS)

### 2. Configuration Files

The project includes production-ready Docker configuration:
- `Dockerfile` - Multi-stage build for optimized image
- `docker-compose.yml` - Complete stack configuration
- `docker-entrypoint.sh` - Startup script with initialization

### 3. Environment Setup

Create a `.env` file for production:
```env
# Authentication Secret (generate a secure random string)
NEXTAUTH_SECRET="your-production-secret-minimum-32-characters"

# Email Configuration
EMAIL_SERVER_HOST="smtp.your-provider.com"
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER="your-email@domain.com"
EMAIL_SERVER_PASSWORD="your-email-password"
EMAIL_FROM="noreply@yourdomain.com"
```

### 4. Build and Deploy

```bash
# Build and start all services
docker compose up -d --build

# View logs
docker compose logs -f

# Check service status
docker compose ps
```

This will start:
- **Next.js Application** on port 3000
- **PostgreSQL Database** on port 5432
- **Meilisearch** on port 7700

### 5. Initial Production Setup

```bash
# Create admin user
docker compose exec app node scripts/create-user.js admin@yourdomain.com SecurePassword123! admin

# Verify database is initialized
docker compose exec postgres psql -U postgres -d netra_doc -c "\dt"

# Check Meilisearch status
curl http://localhost:7700/health

# Index documents manually (until automatic indexing is fixed)
docker compose exec -e MEILISEARCH_HOST=http://meilisearch:7700 -e MEILISEARCH_API_KEY=netra-doc-secure-key-2025-change-in-production app node scripts/index-documents.js
```

### 6. Production Deployment Options

#### Option A: Direct Server Deployment
```bash
# On your server
git clone <repository-url>
cd netra-doc

# Copy your .env file
cp /path/to/.env .

# Start services
docker compose up -d
```

#### Option B: Using Docker Hub
```bash
# Build and push image
docker build -t yourusername/netra-doc:latest .
docker push yourusername/netra-doc:latest

# On production server, update docker-compose.yml to use your image
# Then start services
docker compose up -d
```

### 7. SSL/HTTPS Setup (Recommended)

Add a reverse proxy with SSL:

```yaml
# docker-compose.yml addition
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
```

## User Management

### Creating Users
```bash
# Development
npm run create-user <email> <password> <role>

# Production
docker compose exec app node scripts/create-user.js <email> <password> <role>
```

Roles: `admin` or `user`

### Granting Permissions
```bash
# Development
npm run grant-permissions <user-email> <version-name> <permission>

# Production
docker compose exec app node scripts/grant-user-permissions.js <user-email> <version-name> <permission>
```

## Documentation Management

### Document Structure
```
docs/
├── v1.0/
│   ├── getting-started/
│   │   ├── introduction/
│   │   │   ├── overview.md
│   │   │   └── quick-start.md
│   │   └── installation/
│   │       └── setup.md
│   └── api-reference/
│       └── authentication/
│           └── oauth.md
└── v2.0/
    └── ...
```

### Syncing Documentation
```bash
# Development
npm run sync-docs

# Production
docker compose exec app node scripts/sync-docs.js
```

### Indexing for Search
```bash
# Development
npm run index-documents

# Production
docker compose exec app node scripts/index-documents.js
```

## Maintenance

### Database Backups
```bash
# Backup
docker compose exec postgres pg_dump -U postgres netra_doc > backup.sql

# Restore
docker compose exec -T postgres psql -U postgres netra_doc < backup.sql
```

### Updating the Application
```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker compose down
docker compose up -d --build
```

### Monitoring
```bash
# View logs
docker compose logs -f app

# Check resource usage
docker stats

# Health checks
curl http://localhost:3000
curl http://localhost:7700/health
```

## Project Structure

```
netra-doc/
├── docs/                           # Documentation source files
│   ├── v1.0/                      # Version directories
│   │   ├── getting-started/       # Module directories
│   │   │   ├── introduction/      # Chapter directories
│   │   │   │   └── overview.md    # Document files
│   │   │   └── quickstart/
│   │   └── api-reference/
│   └── v2.0/
├── prisma/
│   ├── schema.prisma              # Database schema (PostgreSQL)
│   └── migrations/                # Database migrations
├── public/
│   └── docs-media/               # Uploaded media files
├── src/
│   ├── app/                      # Next.js app router
│   │   ├── admin/               # Admin panel pages
│   │   ├── api/                 # API routes
│   │   ├── docs/                # Documentation viewer
│   │   └── login/               # Authentication
│   ├── components/              # React components
│   ├── lib/                    # Utility libraries
│   └── styles/                 # Styling files
├── scripts/                    # Utility scripts
│   ├── create-user.js         # User creation
│   ├── sync-docs.js           # Documentation sync
│   ├── index-documents.js     # Meilisearch indexing
│   └── grant-user-permissions.js
├── docker-compose.yml          # Docker services configuration
├── Dockerfile                  # Application container
├── docker-entrypoint.sh       # Container startup script
├── .env                       # Environment variables
└── package.json              # Dependencies and scripts
```

## Tech Stack

### Frontend
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript 5.0+
- **Styling**: Tailwind CSS 3.0+
- **Rich Text**: TipTap editor
- **Icons**: Lucide React
- **Themes**: next-themes

### Backend
- **Database**: PostgreSQL 16
- **ORM**: Prisma
- **Search**: Meilisearch
- **Authentication**: NextAuth.js
- **File Processing**: Unified/Remark/Rehype

### Production
- **Containerization**: Docker & Docker Compose
- **Database**: PostgreSQL in container
- **Search Engine**: Meilisearch in container
- **Reverse Proxy**: Nginx (optional)

## Available Scripts

```bash
# Development
npm run dev              # Start development server
npm run build           # Build for production
npm run start           # Start production server
npm run lint            # Run ESLint

# Database
npm run db:generate     # Generate Prisma client
npm run db:push         # Push schema to database

# Documentation Management
npm run sync-docs       # Sync docs from files to database
npm run create-admin    # Create admin user
npm run create-user     # Create user with password
npm run index-documents # Index documents in Meilisearch
npm run grant-permissions # Grant user permissions
npm run update-version-order # Update version ordering
```

## Troubleshooting

### Common Issues

#### Database Connection Errors
```bash
# Check PostgreSQL is running
docker compose ps postgres

# Test connection
docker compose exec postgres psql -U postgres -d netra_doc

# View logs
docker compose logs postgres
```

#### Search Not Working
```bash
# Check Meilisearch status
docker compose logs meilisearch
curl http://localhost:7700/health

# Re-index documents
docker compose exec app node scripts/index-documents.js
```

#### Container Issues
```bash
# Restart all services
docker compose restart

# Rebuild containers
docker compose down
docker compose up -d --build

# View all logs
docker compose logs -f
```

### Debugging Commands
```bash
# Access app container
docker compose exec app sh

# Check environment variables
docker compose exec app env | grep -E "(DATABASE|MEILISEARCH|NEXTAUTH)"

# Database status
docker compose exec app npx prisma db push --dry-run

# Test Meilisearch connection
docker compose exec app curl http://meilisearch:7700/health
```

## Security Best Practices

1. **Environment Variables**
   - Never commit `.env` files to version control
   - Use strong, unique passwords and secrets
   - Rotate secrets regularly

2. **Database Security**
   - Change default PostgreSQL password
   - Use strong database credentials
   - Regular backups with encryption

3. **Application Security**
   - Keep dependencies updated
   - Use HTTPS in production
   - Implement rate limiting
   - Secure admin access

4. **Docker Security**
   - Don't run containers as root
   - Keep base images updated
   - Use specific version tags
   - Scan images for vulnerabilities

## Support

For issues and questions:
- Check the application logs: `docker compose logs -f`
- Review database connectivity: `docker compose exec postgres psql -U postgres -d netra_doc`
- Verify Meilisearch status: `curl http://localhost:7700/health`
- Submit issues to the repository

---

*Last updated: 2025 - Production-ready Docker deployment with PostgreSQL and Meilisearch*