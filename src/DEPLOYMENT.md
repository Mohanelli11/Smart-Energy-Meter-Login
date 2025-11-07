
# Deployment Guide

## Prerequisites
- GitHub account
- Netlify account (free tier works)
- Git installed locally

## Step 1: Prepare Your Repository

1. **Initialize Git** (if not already done):
```bash
git init
```

2. **Add all files**:
```bash
git add .
```

3. **Commit your changes**:
```bash
git commit -m "Initial commit: Hydrobox SmartMeter System"
```

## Step 2: Push to GitHub

1. **Create a new repository on GitHub**:
   - Go to https://github.com/new
   - Name: `hydrobox-smartmeter`
   - Description: "Smart metering system for energy monitoring"
   - Keep it Private or Public (your choice)
   - Do NOT initialize with README (we already have one)

2. **Add remote and push**:
```bash
git remote add origin https://github.com/YOUR_USERNAME/hydrobox-smartmeter.git
git branch -M main
git push -u origin main
```

## Step 3: Deploy to Netlify

### Method A: Via Netlify Dashboard (Recommended)

1. **Login to Netlify**:
   - Go to https://app.netlify.com
   - Sign in with GitHub

2. **Import Project**:
   - Click "Add new site" → "Import an existing project"
   - Choose "Deploy with GitHub"
   - Authorize Netlify to access your repositories
   - Select `hydrobox-smartmeter` repository

3. **Configure Build Settings**:
   - **Branch to deploy**: main
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   - Click "Deploy site"

4. **Wait for Deployment**:
   - Netlify will install dependencies and build your project
   - First deployment takes 2-5 minutes
   - You'll get a random URL like `random-name-123456.netlify.app`

5. **Custom Domain** (Optional):
   - Go to "Domain settings"
   - Click "Add custom domain"
   - Follow instructions to configure DNS

### Method B: Via Netlify CLI

1. **Install Netlify CLI**:
```bash
npm install -g netlify-cli
```

2. **Login**:
```bash
netlify login
```

3. **Initialize and Deploy**:
```bash
netlify init
# Follow the prompts to connect to your site

# Deploy to production
netlify deploy --prod
```

## Step 4: Verify Deployment

1. **Check the deployed site**:
   - Open the Netlify URL provided
   - Test login with: mahmadstephen19@gmail.com / @Testing
   - Verify all features work

2. **Common Issues**:
   - **404 on refresh**: Already handled by `netlify.toml` redirects
   - **Build fails**: Check Node version (should be 18+)
   - **Missing dependencies**: Run `npm install` locally first

## Step 5: Continuous Deployment

Once connected, every push to the `main` branch will automatically:
1. Trigger a new build on Netlify
2. Run tests (if configured)
3. Deploy to production if successful

### To Update Your Site:

```bash
# Make changes to your code
git add .
git commit -m "Description of changes"
git push origin main
# Netlify automatically deploys!
```

## Environment Variables (If Needed)

If you need to add environment variables:

1. Go to Netlify Dashboard → Site settings → Environment variables
2. Add variables like:
   - `VITE_API_URL` (if you add a backend later)
   - `VITE_APP_NAME`

## Monitoring

- **Build logs**: Check Netlify dashboard for build status
- **Analytics**: Enable Netlify Analytics for visitor stats
- **Forms**: Netlify can handle form submissions (if you add contact forms)

## Rollback

If something goes wrong:
1. Go to Netlify Dashboard → Deploys
2. Find a previous working deployment
3. Click "Publish deploy" to rollback

## Custom Domain Setup

1. **Buy a domain** (e.g., from Namecheap, GoDaddy)
2. In Netlify:
   - Go to Domain settings
   - Click "Add custom domain"
   - Enter your domain (e.g., hydroboxsmartmeter.com)
3. **Configure DNS**:
   - Add Netlify's nameservers to your domain registrar
   - Or add A/CNAME records as instructed
4. **Enable HTTPS**:
   - Netlify provides free SSL via Let's Encrypt
   - Automatically enabled after domain verification

## Performance Optimization

The project is already optimized with:
- Code splitting (React, Charts, Icons in separate chunks)
- Tree shaking (unused code removed)
- Minification (production build)
- Gzip compression (Netlify handles this)

## Security Headers

Already configured in `netlify.toml`:
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- X-XSS-Protection enabled
- Referrer-Policy configured

## Support

If you encounter issues:
1. Check Netlify build logs
2. Verify all files are committed to Git
3. Ensure `package.json` has all dependencies
4. Test build locally: `npm run build`

## Success Checklist

- [ ] Code pushed to GitHub
- [ ] Netlify connected to repository
- [ ] Build completes successfully
- [ ] Site accessible via Netlify URL
- [ ] Login works correctly
- [ ] All dashboard features functional
- [ ] Meter login works
- [ ] Graphs display correctly
- [ ] Mobile responsive
- [ ] HTTPS enabled

Your Hydrobox SmartMeter System is now live! 🎉
