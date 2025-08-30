# Community Mangrove Watch

A participatory monitoring system for mangrove forest conservation, empowering coastal communities to report and track environmental incidents.

## 🌿 Project Overview

Mangrove forests are vital ecosystems that act as natural barriers against storms and are crucial for biodiversity and carbon storage. This system enables:

- **Community Reporting**: Mobile apps and SMS for incident reporting
- **AI Validation**: Automated verification using satellite data and image analysis
- **Gamification**: Points, leaderboards, and rewards to encourage participation
- **Real-time Monitoring**: Live dashboards for authorities and researchers

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Mobile App    │    │   Web Dashboard │    │   SMS Gateway   │
│  (React Native)│    │    (Next.js)    │    │    (Twilio)     │
└─────────┬───────┘    └─────────┬───────┘    └─────────┬───────┘
          │                      │                      │
          └──────────────────────┼──────────────────────┘
                                 │
                    ┌─────────────┴───────────┐
                    │     Backend API         │
                    │   (Node.js/Express)     │
                    │     + Supabase          │
                    └─────────────┬───────────┘
                                 │
                    ┌─────────────┴───────────┐
                    │   AI/ML Service         │
                    │  (Python/FastAPI)       │
                    └─────────────┬───────────┘
                                 │
                    ┌─────────────┴───────────┐
                    │  External Services      │
                    │ • Satellite APIs        │
                    │ • Image Storage         │
                    │ • Maps & Geolocation    │
                    └─────────────────────────┘
```

## 🚀 Tech Stack

### Backend
- **Node.js + Express**: REST API server
- **Supabase**: Database, authentication, real-time features
- **PostgreSQL + PostGIS**: Geospatial data storage
- **Redis**: Caching and sessions

### Frontend
- **React Native + Expo**: Cross-platform mobile app
- **Next.js**: Web dashboard for authorities
- **Tailwind CSS**: Styling framework

### AI/ML
- **Python + FastAPI**: AI microservice
- **TensorFlow/PyTorch**: Image analysis models
- **OpenCV**: Image processing

### External Services
- **Cloudinary**: Image storage and processing
- **Twilio**: SMS integration
- **Google Earth Engine**: Satellite data
- **Mapbox**: Maps and geospatial services

## 📱 Features

### Mobile App
- [x] Incident reporting with photos
- [x] GPS location tagging
- [x] Offline capability
- [x] User authentication
- [x] Gamification (points, badges)
- [x] Community leaderboards

### Web Dashboard
- [x] Incident review and validation
- [x] User management
- [x] Analytics and reporting
- [x] Map visualization
- [x] Alert system

### AI Validation
- [x] Image analysis for incident verification
- [x] Satellite data comparison
- [x] Anomaly detection
- [x] Automated scoring

## 🎯 Target Users

- **Coastal Communities**: Primary reporters and monitors
- **Conservation NGOs**: Data analysis and coordination
- **Government Forestry Departments**: Policy and enforcement
- **Researchers**: Data collection and analysis

## 📊 Impact Goals

- Improve surveillance and protection of mangroves
- Empower local communities in conservation efforts
- Provide reliable, real-time data for authorities
- Enable data-driven policy decisions

## 🛠️ Development Setup

### Prerequisites
- Node.js 18+
- Python 3.9+
- Expo CLI
- Supabase account
- Required API keys (see .env.example)

### Quick Start
```bash
# Clone and setup
git clone <repository>
cd community-mangrove-watch

# Install dependencies
npm run install:all

# Setup environment
cp .env.example .env
# Fill in your API keys

# Start development servers
npm run dev
```

## 📁 Project Structure

```
community-mangrove-watch/
├── backend/              # Node.js API server
├── mobile/              # React Native app
├── dashboard/           # Next.js web dashboard
├── ai-service/          # Python AI/ML service
├── shared/              # Shared utilities and types
├── docs/                # Documentation
└── deployment/          # Docker and deployment configs
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🌍 Environmental Impact

This project directly contributes to:
- **SDG 14**: Life Below Water
- **SDG 15**: Life on Land
- **SDG 13**: Climate Action
- **SDG 11**: Sustainable Cities and Communities
