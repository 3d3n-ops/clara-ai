# Clara AI Backend - Docker Self-Hosting Guide

This guide will help you migrate your Clara AI backend from Render to a self-hosted Docker setup, saving you money while maintaining full control over your deployment.

## 🎯 Why Self-Host with Docker?

- **Cost Savings**: No monthly hosting fees
- **Full Control**: Complete control over your infrastructure
- **Customization**: Ability to customize server configuration
- **Privacy**: Your data stays on your own infrastructure
- **Scalability**: Easy to scale up or down as needed

## 📋 Prerequisites

### Required Software
1. **Docker Desktop** - [Download here](https://www.docker.com/products/docker-desktop/)
2. **Git** - For version control
3. **A text editor** - VS Code, Notepad++, etc.

### Required Accounts & API Keys
- OpenAI API key
- Pinecone API key and environment
- Clerk API keys (for authentication)
- LiveKit API keys (for voice features)
- Deepgram API key (for voice features)
- Cartesia API key (for voice features)

## 🚀 Quick Start (Windows)

### Step 1: Install Docker Desktop
1. Download Docker Desktop from [docker.com](https://www.docker.com/products/docker-desktop/)
2. Install and start Docker Desktop
3. Ensure Docker is running (you should see the Docker icon in your system tray)

### Step 2: Configure Environment
1. Copy the environment template:
   ```powershell
   Copy-Item env.example .env
   ```

2. Edit the `.env` file with your actual API keys:
   ```env
   OPENAI_API_KEY=sk-your-actual-openai-key
   PINECONE_API_KEY=your-actual-pinecone-key
   PINECONE_ENVIRONMENT=your-pinecone-environment
   PINECONE_INDEX_NAME=your-pinecone-index
   CLERK_SECRET_KEY=your-actual-clerk-secret
   # ... add all other required keys
   ```

### Step 3: Deploy
Run the deployment script:
```powershell
.\deploy-docker.ps1
```

Or if you prefer batch files:
```cmd
deploy-docker.bat
```

### Step 4: Verify Deployment
1. Open your browser and go to: `http://localhost:8000/health`
2. You should see a JSON response indicating the service is healthy
3. Check the API docs at: `http://localhost:8000/docs`

## 🔧 Manual Deployment

If you prefer to deploy manually or need to troubleshoot:

### Build and Run with Docker Compose
```bash
# Build and start the service
docker-compose up --build -d

# View logs
docker-compose logs -f clara-backend

# Stop the service
docker-compose down

# Restart the service
docker-compose restart clara-backend
```

### Build and Run with Docker Directly
```bash
# Build the image
docker build -t clara-backend ./backend

# Run the container
docker run -d \
  --name clara-backend \
  -p 8000:8000 \
  --env-file .env \
  -v $(pwd)/backend/generated_content:/app/generated_content \
  -v $(pwd)/backend/uploads:/app/uploads \
  clara-backend
```

## 🌐 Making Your Backend Publicly Accessible

### Option 1: Port Forwarding (Router)
1. Log into your router's admin panel
2. Set up port forwarding for port 8000 to your local machine
3. Use your public IP address to access the backend

### Option 2: Reverse Proxy (Recommended)
Use Nginx as a reverse proxy:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Option 3: Cloudflare Tunnel (Free)
1. Install Cloudflare Tunnel
2. Create a tunnel pointing to `localhost:8000`
3. Get a free subdomain from Cloudflare

## 🔒 Security Considerations

### Environment Variables
- Never commit your `.env` file to version control
- Use strong, unique API keys
- Rotate keys regularly

### Network Security
- Use HTTPS in production
- Configure firewall rules
- Consider using a VPN for remote access

### Container Security
- Keep Docker and images updated
- Use non-root users (already configured)
- Scan images for vulnerabilities

## 📊 Monitoring and Maintenance

### Health Checks
The container includes automatic health checks:
```bash
# Check container health
docker ps

# View health check logs
docker inspect clara-backend | grep -A 10 Health
```

### Logs
```bash
# View real-time logs
docker-compose logs -f clara-backend

# View logs for the last hour
docker-compose logs --since 1h clara-backend
```

### Updates
```bash
# Update the application
git pull
docker-compose up --build -d

# Update dependencies only
docker-compose exec clara-backend pip install -r requirements.txt
docker-compose restart clara-backend
```

## 🗄️ Data Persistence

Your data is stored in mounted volumes:
- `./backend/generated_content` - Generated files and content
- `./backend/uploads` - Uploaded files

To backup your data:
```bash
# Create a backup
tar -czf backup-$(date +%Y%m%d).tar.gz backend/generated_content backend/uploads

# Restore from backup
tar -xzf backup-20231201.tar.gz
```

## 🔧 Troubleshooting

### Common Issues

#### Container won't start
```bash
# Check logs
docker-compose logs clara-backend

# Check if port 8000 is already in use
netstat -an | findstr :8000
```

#### Environment variables not loading
```bash
# Verify .env file exists
ls -la .env

# Check if variables are loaded
docker-compose exec clara-backend env | grep OPENAI
```

#### Permission issues
```bash
# Fix file permissions
chmod -R 755 backend/generated_content backend/uploads
```

#### Memory issues
```bash
# Check container resource usage
docker stats clara-backend

# Increase Docker memory limit in Docker Desktop settings
```

### Performance Optimization

#### Resource Limits
Add to `docker-compose.yml`:
```yaml
services:
  clara-backend:
    # ... existing config ...
    deploy:
      resources:
        limits:
          memory: 2G
          cpus: '1.0'
        reservations:
          memory: 512M
          cpus: '0.5'
```

#### Caching
The Dockerfile is optimized for layer caching. Dependencies are installed before copying application code.

## 💰 Cost Comparison

| Service | Monthly Cost | Features |
|---------|-------------|----------|
| Render | $7-25+ | Managed, auto-scaling |
| Self-hosted | $0-5 | Full control, your hardware |
| VPS (DigitalOcean) | $5-20 | More control, managed OS |

## 🔄 Migration Checklist

- [ ] Install Docker Desktop
- [ ] Copy and configure `.env` file
- [ ] Test local deployment
- [ ] Update frontend API endpoints
- [ ] Set up public access (if needed)
- [ ] Configure monitoring
- [ ] Set up backups
- [ ] Test all features
- [ ] Update DNS/domain settings
- [ ] Shut down Render deployment

## 📞 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review container logs: `docker-compose logs clara-backend`
3. Verify environment variables are set correctly
4. Ensure Docker Desktop is running
5. Check if ports are available

## 🎉 Success!

Once deployed, your Clara AI backend will be running locally with:
- ✅ Full control over your infrastructure
- ✅ No monthly hosting costs
- ✅ Same functionality as Render deployment
- ✅ Easy scaling and customization options

Your backend will be available at `http://localhost:8000` and ready to serve your frontend application!
