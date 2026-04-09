
  # Women's Safety App

A comprehensive mobile-first web application designed to enhance women's safety through emergency features, location sharing, and community support.

## Features

### Core Safety Features
- **SOS Button**: Instant emergency alert with location sharing
- **Fake Call**: Simulate an incoming call to escape uncomfortable situations
- **Video Recording**: Quick video capture for evidence collection
- **Share Journey**: Real-time location sharing with trusted contacts
- **Safe Zones**: Interactive map showing safe locations and police stations

### User Management
- Secure user registration and authentication
- OTP verification for account security
- User dashboard with safety statistics
- Customizable settings and preferences

### Additional Features
- SMS notifications via Twilio integration
- File upload capabilities
- Responsive design for mobile and desktop
- Offline-capable basic functionality

## Tech Stack

### Frontend
- **React 18** - Modern JavaScript library for building user interfaces
- **TypeScript** - Type-safe JavaScript
- **Vite** - Fast build tool and development server
- **React Router** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Accessible UI components
- **Leaflet** - Interactive maps
- **React Hook Form** - Form management

### Backend
- **Node.js** - JavaScript runtime
- **JSON Server** - REST API simulation
- **Multer** - File upload handling
- **Twilio** - SMS service integration

## Installation

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn package manager

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd womensafety
   ```

2. **Install frontend dependencies**
   ```bash
   npm install
   ```

3. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   cd ..
   ```

4. **Configure environment variables**
   - Set up Twilio credentials in backend configuration
   - Configure any required API keys

## Usage

### Development

1. **Start the backend server**
   ```bash
   cd backend
   npm run dev
   ```

2. **Start the frontend development server**
   ```bash
   npm run dev
   ```

3. **Open your browser**
   Navigate to `http://localhost:5173` (or the port shown in terminal)

### Production Build

```bash
npm run build
```

## API Endpoints

The backend provides RESTful API endpoints for:
- User registration and authentication
- Location data management
- File uploads
- SMS notifications

## Project Structure

```
womensafety/
├── src/
│   ├── components/     # Reusable UI components
│   ├── pages/         # Application pages/routes
│   ├── services/      # API service functions
│   ├── hooks/         # Custom React hooks
│   └── styles/        # Global styles
├── backend/
│   ├── server.js      # Main server file
│   ├── db.json        # Mock database
│   └── uploads/       # File upload directory
└── build/             # Production build output
```

## Testing

Run the test suite:
```bash
npm test
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Attributions

This project uses components from [shadcn/ui](https://ui.shadcn.com/) under MIT license and photos from [Unsplash](https://unsplash.com) under their license.

## Disclaimer

This application is designed to assist in emergency situations but should not replace professional emergency services. Always contact local authorities directly when in danger.
  
