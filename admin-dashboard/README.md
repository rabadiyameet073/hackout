# 🌿 Mangrove Watch Admin Dashboard

A comprehensive administrative interface for managing the Community Mangrove Watch platform. Built with React, TypeScript, and Material-UI.

## Features

### 🎛️ **Dashboard Overview**
- Real-time statistics and metrics
- Incident trends and analytics
- Recent activity monitoring
- Quick action shortcuts

### 📊 **Incident Management**
- Advanced filtering and search
- Bulk operations support
- Status management workflow
- Export capabilities
- Detailed incident views

### 👥 **User Management**
- User roles and permissions
- Account activation/suspension
- Activity monitoring
- Bulk user operations

### 🤖 **AI Validation System**
- Review AI-powered validations
- Confidence score analysis
- Manual override capabilities
- Training data management

### 📈 **Analytics & Reporting**
- Comprehensive data visualization
- Geographic heat maps
- Trend analysis
- Exportable reports

### ⚙️ **System Settings**
- Application configuration
- Security policies
- Backup management
- System monitoring

## Technology Stack

- **Frontend**: React 18 + TypeScript
- **UI Framework**: Material-UI (MUI) v5
- **State Management**: React Query
- **Routing**: React Router v6
- **Charts**: Recharts
- **Forms**: React Hook Form + Yup
- **Build Tool**: Vite
- **Maps**: React Leaflet

## Getting Started

### Prerequisites

- Node.js 16+ 
- npm or yarn
- Backend API running on port 3000

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd admin-dashboard
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment setup**
   ```bash
   cp .env.example .env
   ```
   
   Update the `.env` file with your configuration:
   ```env
   VITE_API_URL=http://localhost:3000/api
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   ```
   http://localhost:3001
   ```

### Demo Credentials

For testing purposes, use these demo credentials:

- **Admin**: `admin@mangrovewatch.org` / `admin123`
- **Moderator**: `moderator@mangrovewatch.org` / `mod123`

## Project Structure

```
admin-dashboard/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── Common/         # Generic components
│   │   └── Layout/         # Layout components
│   ├── contexts/           # React contexts
│   ├── pages/              # Page components
│   ├── services/           # API services
│   ├── types/              # TypeScript types
│   └── utils/              # Utility functions
├── public/                 # Static assets
└── dist/                   # Build output
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run type-check` - Run TypeScript checks

## Features in Detail

### Authentication & Authorization

- Role-based access control (Admin, Moderator, Analyst)
- JWT token authentication
- Automatic token refresh
- Protected routes

### Data Management

- Real-time data updates
- Optimistic updates
- Error handling and retry logic
- Offline support (planned)

### User Interface

- Responsive design for all screen sizes
- Dark/light theme support (planned)
- Accessibility compliance
- Intuitive navigation

### Performance

- Code splitting and lazy loading
- Optimized bundle size
- Efficient re-rendering
- Image optimization

## API Integration

The admin dashboard integrates with the backend API for:

- **Authentication**: `/api/auth/*`
- **Dashboard**: `/api/admin/dashboard/*`
- **Incidents**: `/api/admin/incidents/*`
- **Users**: `/api/admin/users/*`
- **Validations**: `/api/admin/validations/*`
- **Analytics**: `/api/admin/analytics/*`
- **Settings**: `/api/admin/settings/*`

## Deployment

### Production Build

```bash
npm run build
```

### Docker Deployment

```dockerfile
FROM node:18-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Environment Variables

Production environment variables:

```env
VITE_API_URL=https://api.mangrovewatch.org/api
VITE_APP_NAME=Mangrove Watch Admin
VITE_NODE_ENV=production
```

## Security Considerations

- All API calls require authentication
- Role-based access control
- Input validation and sanitization
- XSS protection
- CSRF protection
- Secure token storage

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Create an issue on GitHub
- Contact the development team
- Check the documentation

---

**Built with ❤️ for mangrove conservation**
