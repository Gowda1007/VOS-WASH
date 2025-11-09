# Server Deployment Guide

This guide walks you through deploying the VOS Wash Express server to production.

## Prerequisites

- MongoDB Atlas account (or other MongoDB hosting)
- Node.js 18+ on server
- Server with public IP or domain name
- SSL certificate (optional but recommended)

## Option 1: Deploy to Railway (Recommended for Quick Setup)

Railway provides easy Node.js deployment with automatic HTTPS.

### Steps:

1. **Create Railway Account**
   - Go to https://railway.app
   - Sign up with GitHub

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Connect your repository

3. **Configure Environment Variables**
   - In Railway dashboard, go to Variables tab
   - Add the following:
     ```
     MONGODB_URI=your_mongodb_atlas_connection_string
     PORT=3001
     API_KEY=your_secure_api_key_here
     ALLOWED_ORIGINS=https://your-web-app-domain.com
     ALLOW_ALL_CORS=false
     NODE_ENV=production
     ```

4. **Deploy**
   - Railway will auto-deploy on git push
   - You'll get a public URL like `https://your-app.railway.app`

5. **Update Client Configuration**
   - Update `.env` in web app:
     ```
     VITE_SERVER_URL=https://your-app.railway.app/api
     VITE_API_KEY=your_secure_api_key_here
     ```

## Option 2: Deploy to Render

Render offers free tier for Node.js apps.

### Steps:

1. **Create Render Account**
   - Go to https://render.com
   - Sign up with GitHub

2. **Create New Web Service**
   - Click "New +" → "Web Service"
   - Connect your repository
   - Select `server` directory

3. **Configure Service**
   - **Name**: vos-wash-server
   - **Environment**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start:prod`
   - **Plan**: Free

4. **Add Environment Variables**
   ```
   MONGODB_URI=your_mongodb_atlas_connection_string
   PORT=3001
   API_KEY=your_secure_api_key_here
   ALLOWED_ORIGINS=https://your-web-app-domain.com
   ALLOW_ALL_CORS=false
   NODE_ENV=production
   ```

5. **Deploy**
   - Click "Create Web Service"
   - Render will build and deploy
   - You'll get a URL like `https://vos-wash-server.onrender.com`

## Option 3: Deploy to DigitalOcean/Linode/AWS EC2

For full control and scalability.

### 1. Set Up Server

SSH into your server:

```bash
ssh user@your-server-ip
```

### 2. Install Node.js

```bash
# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node -v
npm -v
```

### 3. Install Git and Clone Repository

```bash
# Install Git
sudo apt-get install git

# Clone repository
cd /var/www
sudo git clone https://github.com/yourusername/vos-wash.git
cd vos-wash/server

# Install dependencies
sudo npm install
```

### 4. Set Up Environment Variables

```bash
# Create .env file
sudo nano .env
```

Add:
```
MONGODB_URI=your_mongodb_atlas_connection_string
PORT=3001
API_KEY=your_secure_api_key_here
ALLOWED_ORIGINS=https://your-web-app-domain.com
ALLOW_ALL_CORS=false
NODE_ENV=production
```

### 5. Build TypeScript

```bash
sudo npm run build
```

### 6. Install PM2 for Process Management

```bash
# Install PM2 globally
sudo npm install -g pm2

# Start server with PM2
pm2 start dist/server.js --name vos-wash-server

# Save PM2 configuration
pm2 save

# Set PM2 to start on boot
pm2 startup
```

### 7. Configure Firewall

```bash
# Allow SSH
sudo ufw allow ssh

# Allow HTTP and HTTPS
sudo ufw allow 80
sudo ufw allow 443

# Allow your app port
sudo ufw allow 3001

# Enable firewall
sudo ufw enable
```

### 8. Set Up Nginx Reverse Proxy (Optional but Recommended)

```bash
# Install Nginx
sudo apt-get install nginx

# Create Nginx configuration
sudo nano /etc/nginx/sites-available/vos-wash
```

Add:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location /api {
        proxy_pass http://localhost:3001/api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/vos-wash /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 9. Set Up SSL with Let's Encrypt (Recommended)

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com

# Certificate will auto-renew
```

### 10. Monitor Server

```bash
# View logs
pm2 logs vos-wash-server

# Monitor status
pm2 status

# Restart server
pm2 restart vos-wash-server
```

## Option 4: Deploy to Vercel (Serverless)

Vercel supports Node.js serverless functions.

### Steps:

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Create vercel.json** in server directory:
   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "src/server.ts",
         "use": "@vercel/node"
       }
     ],
     "routes": [
       {
         "src": "/api/(.*)",
         "dest": "src/server.ts"
       }
     ],
     "env": {
       "MONGODB_URI": "@mongodb-uri",
       "API_KEY": "@api-key",
       "ALLOWED_ORIGINS": "@allowed-origins"
     }
   }
   ```

3. **Deploy**
   ```bash
   cd server
   vercel
   ```

4. **Add Environment Variables**
   ```bash
   vercel env add MONGODB_URI
   vercel env add API_KEY
   vercel env add ALLOWED_ORIGINS
   ```

## MongoDB Atlas Setup

If you don't have MongoDB Atlas set up:

1. **Create Account**
   - Go to https://www.mongodb.com/cloud/atlas
   - Sign up for free

2. **Create Cluster**
   - Choose free tier (M0)
   - Select region closest to your users
   - Click "Create Cluster"

3. **Configure Network Access**
   - Go to "Network Access"
   - Click "Add IP Address"
   - Select "Allow Access from Anywhere" (0.0.0.0/0)
   - Or add your server's specific IP

4. **Create Database User**
   - Go to "Database Access"
   - Click "Add New Database User"
   - Choose username and password
   - Grant "Read and write to any database"

5. **Get Connection String**
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy connection string
   - Replace `<password>` with your database user password
   - Replace `<dbname>` with your database name (e.g., `voswash`)

## Post-Deployment Checklist

- [ ] Server is accessible via public URL
- [ ] MongoDB connection is working
- [ ] API endpoints respond correctly
- [ ] CORS is configured properly
- [ ] API key authentication is working
- [ ] SSL/HTTPS is enabled (recommended)
- [ ] Environment variables are set correctly
- [ ] Server restarts automatically on crash
- [ ] Logs are accessible for monitoring
- [ ] Backup strategy is in place for MongoDB

## Testing Deployment

Test your deployed server:

```bash
# Test status endpoint (no auth required)
curl https://your-server-url/api/status

# Test authenticated endpoint
curl -H "x-api-key: your-api-key" https://your-server-url/api/invoices

# Test from your web app
# Update .env with new server URL and test all features
```

## Updating Deployment

### Railway/Render
- Just push to GitHub, auto-deploys

### Manual Server (PM2)
```bash
cd /var/www/vos-wash
sudo git pull
cd server
sudo npm install
sudo npm run build
pm2 restart vos-wash-server
```

## Monitoring and Maintenance

### View Logs
```bash
# PM2
pm2 logs vos-wash-server

# Railway
# View in dashboard

# Render
# View in dashboard
```

### Check Server Health
```bash
# CPU and memory usage
pm2 monit

# Server status
systemctl status nginx
```

### Database Backup
- MongoDB Atlas provides automatic backups
- Configure backup schedule in Atlas dashboard

## Troubleshooting

### Server Not Starting
- Check logs: `pm2 logs vos-wash-server`
- Verify environment variables are set
- Ensure MongoDB URI is correct
- Check port is not already in use: `sudo lsof -i :3001`

### Connection Refused
- Check firewall rules
- Verify server is listening on 0.0.0.0, not 127.0.0.1
- Ensure port forwarding is configured

### CORS Errors
- Add your web app domain to ALLOWED_ORIGINS
- Or temporarily set ALLOW_ALL_CORS=true for testing

### API Key Not Working
- Verify x-api-key header is being sent
- Check API_KEY environment variable matches client

## Security Best Practices

1. **Use Strong API Keys**
   - Generate: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

2. **Enable HTTPS**
   - Use Let's Encrypt or cloud provider SSL

3. **Restrict CORS**
   - Only allow specific origins in production

4. **Keep Dependencies Updated**
   ```bash
   npm audit
   npm update
   ```

5. **Regular Backups**
   - Enable MongoDB Atlas continuous backup

6. **Monitor Server**
   - Set up uptime monitoring (UptimeRobot, Pingdom)
   - Configure alerts for server downtime

## Support

If you encounter issues:
1. Check server logs
2. Verify environment variables
3. Test MongoDB connection
4. Check network/firewall rules
5. Review error messages carefully

## Next Steps

After deployment:
1. Update web app `.env` with production server URL
2. Test all features from web app
3. Deploy web app to hosting (Vercel, Netlify, etc.)
4. Proceed with React Native APK build using REACT_NATIVE_SETUP.md
