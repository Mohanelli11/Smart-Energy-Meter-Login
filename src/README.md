
# Hydrobox SmartMeter System

A comprehensive smart metering system for energy monitoring and management, supporting both prepaid and postpaid meters with real-time data collection via NB-IoT.

## Features

### Admin Dashboard
- **Total Network Overview**: Aggregate consumption data from all installed meters
- **Meter Management**: Add, edit, view, and delete meters
- **User Management**: Admin-only account creation (mahmadstephen19@gmail.com)
- **Payment Tracking**: Real-time payment monitoring and transaction history
- **Data Export**: Export meter and payment data to CSV/Excel
- **Advanced Filtering**: Filter meters by status, location, consumption, and balance

### Individual Meter Access
- **Secure Login**: Access individual meters using account number + password
- **Real-time Readings**: 
  - Voltage monitoring (220-240V)
  - Current consumption (Amperes)
  - Units consumed (kWh)
  - Remaining balance (Ksh)
- **Historical Data**: View consumption graphs for any date
- **Payment History**: Complete transaction records
- **10-minute Updates**: Simulated NB-IoT data reporting

### Meter Types
- **Prepaid Meters**: Token-based system with balance monitoring
- **Postpaid Meters**: Bill-based system with payment tracking

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Icons**: Lucide React
- **Build Tool**: Vite
- **Deployment**: Netlify

## Getting Started

### Prerequisites
- Node.js 18 or higher
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/hydrobox-smartmeter.git
cd hydrobox-smartmeter
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:3000`

### Build for Production

```bash
npm run build
```

The build output will be in the `dist` directory.

## Default Login Credentials

### Admin Access
- **Email**: mahmadstephen19@gmail.com
- **Password**: @Testing

### User Access
- **Email**: hydroboxkenya@gmail.com
- **Password**: @Testing

### Individual Meter Access
- **Account Number**: Any meter account (e.g., MET-1234-2023)
- **Password**: @Testing

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
hydrobox-smartmeter/
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

This project is proprietary software owned by Hydrobox Kenya.

## Support

For support, email: hydroboxkenya@gmail.com

## Contributing

This is a private project. Contact the administrator for contribution guidelines.
