# MoTech Electrical and Electronics Engineering Solutions SmartMeter System

A comprehensive smart metering system for energy monitoring and management, supporting both prepaid and postpaid meters with real-time data collection via NB-IoT.

## Sign-in

There are no default credentials. Create the first administrator with `npm run seed` (see the root README).

## Deployment to Netlify

### Option 1: Deploy from GitHub

1. Push your code to GitHub
2. Go to [Netlify](https://netlify.com)
3. Click "Add new site" → "Import an existing project"
4. Connect your GitHub repository
5. Configure build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
6. Click "Deploy site"

### Option 2: Deploy via Netlify CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy
netlify deploy --prod
```

## Project Structure

```
motech-smartmeter/
├── src/
│   ├── components/
│   │   ├── AddMeterForm.tsx
│   │   ├── ConsumptionGraph.tsx
│   │   ├── CreateAccountModal.tsx
│   │   ├── Dashboard.tsx
│   │   ├── DeleteConfirmModal.tsx
│   │   ├── EditMeterModal.tsx
│   │   ├── FilterModal.tsx
│   │   ├── IndividualMeterView.tsx
│   │   ├── LivePayments.tsx
│   │   ├── LoginForm.tsx
│   │   ├── LoginPage.tsx
│   │   ├── MeterLoginPage.tsx
│   │   ├── MeterTable.tsx
│   │   ├── StatsCard.tsx
│   │   ├── TokenModal.tsx
│   │   └── ViewMeterModal.tsx
│   ├── App.tsx
│   ├── index.tsx
│   └── index.css
├── public/
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.js
├── netlify.toml
└── README.md
```

## Features Overview

### Dashboard Statistics
- Total Meters: 1,248 (856 Prepaid + 392 Postpaid)
- Real-time revenue tracking
- Network-wide consumption monitoring
- Trend analysis with percentage changes

### Meter Management
- Add new meters with complete details
- Edit existing meter information
- View detailed meter information
- Delete meters with confirmation
- Bulk export to CSV

### Payment System
- Live payment monitoring
- Transaction history with filtering
- Token generation for prepaid meters
- Payment receipt management

### Security
- Role-based access control (Admin/User)
- Secure meter login system
- Password-protected individual meter access
- Admin-only account creation

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

This project is proprietary software owned by MoTech Electrical and Electronics Engineering Solutions.

## Support

For support, email: motechembeddedengineering@gmail.com

## Contributing

This is a private project. Contact the administrator for contribution guidelines.