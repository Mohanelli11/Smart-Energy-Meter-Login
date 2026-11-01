# Smart Energy Meter Login Page

A modern, responsive login system for the **MoTech Smart Meter Platform** — an enterprise-grade smart metering system for real-time energy monitoring and management.

## 🚀 Quick Start

### Prerequisites
- Node.js 18 or higher
- npm or yarn

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open your browser and navigate to `http://localhost:5173`

### Build for Production

```bash
npm run build
```

The build output will be in the `dist` directory.

## 📋 Project Overview

This is the login interface for a comprehensive smart metering solution that includes:

- **Admin Dashboard** — Network-wide meter management and analytics
- **User Dashboard** — Individual meter access and consumption monitoring
- **Real-time Readings** — Voltage, current, power factor, and energy consumption
- **Payment Tracking** — Support for both prepaid and postpaid meters
- **Data Export** — CSV/Excel export capabilities
- **NB-IoT Integration** — Real-time IoT data collection

## 🛠️ Tech Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **UI Components**: Lucide React
- **Charts**: Recharts

## 📖 Documentation

- **[Full Project Documentation](./src/README.md)** — Features, deployment, and architecture
- **[API Documentation](./src/api/README.md)** — REST API, authentication, and endpoints

## 🔐 Default Login Credentials

### Admin Access
- **Email**: mahmadstephen19@gmail.com
- **Password**: @Testing

### User Access
- **Email**: motechkenya@gmail.com
- **Password**: @Testing

### Meter Access
- **Account Number**: Any meter account (e.g., MET-1234-2023)
- **Password**: @Testing

## 📁 Project Structure

```
Smart-Energy-Meter-Login-Page/
├── src/
│   ├── components/          # React components
│   ├── api/                 # API documentation
│   ├── App.tsx             # Main App component
│   └── index.css           # Global styles
├── public/                 # Static assets
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── README.md
```

## 🚀 Deployment

### Deploy to Netlify

1. Push your code to GitHub
2. Visit [Netlify](https://netlify.com) and click "Add new site"
3. Select "Import an existing project"
4. Connect your repository
5. Configure build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
6. Click "Deploy site"

Or use Netlify CLI:
```bash
npm install -g netlify-cli
netlify login
netlify deploy --prod
```

## ✨ Features

### Login System
- Secure form validation
- Role-based access (Admin/User/Meter)
- Responsive design

### Admin Dashboard
- Meter management (add, edit, view, delete)
- User account management
- Real-time payment monitoring
- Advanced filtering and search

### Meter Access
- Real-time consumption readings
- Historical data visualization
- Payment history tracking
- Token/balance management

## 📊 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## 📝 License

This project is proprietary software owned by **MoTech Electrical and Electronics Engineering Solutions**.

## 📧 Support

For support, contact: **motechembeddedengineering@gmail.com**

---

**Design Source**: [MOTECH KENYA].
