# 🎛️ Admin Dashboard - Community Mangrove Watch

## Overview

The Admin Dashboard is a comprehensive web-based administrative interface for managing the Community Mangrove Watch platform. Built with modern web technologies, it provides administrators, moderators, and analysts with powerful tools to monitor, manage, and analyze the conservation platform.

## 🚀 Features

### **Dashboard Overview**
- **Real-time Statistics**: Live metrics on incidents, users, validations, and conservation impact
- **Trend Analysis**: Visual charts showing incident patterns and resolution rates
- **Activity Monitoring**: Recent system activities and user actions
- **Quick Actions**: One-click access to common administrative tasks

### **Incident Management**
- **Advanced Filtering**: Search and filter by status, severity, type, location, and date
- **Bulk Operations**: Update multiple incidents simultaneously
- **Status Workflow**: Manage incident lifecycle from pending to resolved
- **Detailed Views**: Comprehensive incident information with images and validation data
- **Export Capabilities**: Generate reports in various formats

### **User Management**
- **User Directory**: Complete user listing with roles and activity status
- **Role Management**: Assign and modify user permissions
- **Account Control**: Suspend/activate user accounts with audit trails
- **Activity Tracking**: Monitor user engagement and contribution patterns

### **AI Validation System**
- **Validation Queue**: Review AI-powered incident validations
- **Confidence Analysis**: Assess AI confidence scores and accuracy
- **Manual Override**: Expert review and validation correction
- **Performance Metrics**: Track AI system performance and improvement

### **Analytics & Reporting**
- **Geographic Analysis**: Heat maps and regional incident distribution
- **Trend Visualization**: Time-series analysis of conservation efforts
- **Impact Metrics**: Measure conservation outcomes and effectiveness
- **Custom Reports**: Generate tailored reports for stakeholders

### **System Settings**
- **Configuration Management**: System-wide settings and parameters
- **Security Policies**: Access control and authentication settings
- **Backup Management**: Database backup and restore operations
- **Audit Logs**: Complete system activity tracking

## 🛠 Technology Stack

### **Frontend**
- **React 18**: Modern React with hooks and functional components
- **TypeScript**: Type-safe development with enhanced IDE support
- **Material-UI v5**: Google's Material Design component library
- **React Query**: Efficient data fetching and state management
- **React Router v6**: Client-side routing and navigation
- **Recharts**: Interactive data visualization and charts
- **React Hook Form**: Performant form handling with validation
- **Vite**: Fast build tool and development server

### **Backend Integration**
- **RESTful APIs**: Clean API integration with the backend
- **JWT Authentication**: Secure token-based authentication
- **Role-based Access**: Granular permission system
- **Real-time Updates**: Live data synchronization

## 📁 Project Structure

```
admin-dashboard/
├── src/
│   ├── components/
│   │   ├── Common/           # Reusable UI components
│   │   │   ├── LoadingSpinner.tsx
│   │   │   └── StatCard.tsx
│   │   └── Layout/           # Layout components
│   │       ├── Layout.tsx
│   │       ├── Sidebar.tsx
│   │       └── NotificationPanel.tsx
│   ├── contexts/
│   │   └── AuthContext.tsx   # Authentication state management
│   ├── pages/
│   │   ├── DashboardPage.tsx # Main dashboard
│   │   ├── IncidentsPage.tsx # Incident management
│   │   ├── UsersPage.tsx     # User management
│   │   ├── ValidationsPage.tsx # AI validation management
│   │   ├── AnalyticsPage.tsx # Analytics and reports
│   │   ├── SettingsPage.tsx  # System settings
│   │   └── LoginPage.tsx     # Authentication
│   ├── services/
│   │   └── api.ts           # API service layer
│   └── types/               # TypeScript type definitions
├── public/                  # Static assets
└── dist/                   # Production build
```

## 🔐 Authentication & Authorization

### **Role-Based Access Control**
- **Admin**: Full system access and configuration
- **Moderator**: User and incident management
- **Analyst**: Read-only access with reporting capabilities

### **Security Features**
- JWT token authentication with automatic refresh
- Role-based route protection
- Session management and timeout
- Secure API communication

### **Demo Credentials**
```
Admin: admin@mangrovewatch.org / admin123
Moderator: moderator@mangrovewatch.org / mod123
Analyst: analyst@mangrovewatch.org / analyst123
```

## 🚀 Getting Started

### **Prerequisites**
- Node.js 16+
- npm or yarn
- Backend API running on port 3000

### **Installation**
```bash
# Clone and navigate
cd admin-dashboard

# Install dependencies
npm install

# Environment setup
cp .env.example .env

# Start development server
npm run dev

# Open browser
http://localhost:3001
```

### **Environment Configuration**
```env
VITE_API_URL=http://localhost:3000/api
VITE_APP_NAME=Mangrove Watch Admin
VITE_NODE_ENV=development
```

## 📊 Dashboard Features

### **Real-time Metrics**
- Total incidents and resolution rates
- Active user count and engagement
- Pending validations and AI performance
- Protected area coverage and impact

### **Interactive Charts**
- Incident trends over time
- Severity distribution analysis
- Geographic heat maps
- User activity patterns

### **Quick Actions**
- Review pending incidents
- Validate AI assessments
- Manage user accounts
- Generate reports

## 🔧 API Integration

### **Endpoint Categories**
```typescript
// Authentication
POST /api/auth/admin-login
GET  /api/auth/profile

// Dashboard
GET  /api/admin/dashboard/stats
GET  /api/admin/dashboard/recent-activity

// Incident Management
GET  /api/admin/incidents
PUT  /api/admin/incidents/:id
POST /api/admin/incidents/bulk-update

// User Management
GET  /api/admin/users
POST /api/admin/users/:id/suspend
PUT  /api/admin/users/:id

// Validations
GET  /api/admin/validations
POST /api/admin/validations/:id/approve
POST /api/admin/validations/:id/reject

// Analytics
GET  /api/admin/analytics/overview
GET  /api/admin/analytics/trends
GET  /api/admin/analytics/export
```

## 🎨 User Interface

### **Design Principles**
- **Material Design**: Consistent Google Material Design language
- **Responsive Layout**: Optimized for desktop, tablet, and mobile
- **Accessibility**: WCAG 2.1 compliance with keyboard navigation
- **Dark Mode**: Theme switching support (planned)

### **Key Components**
- **Data Grids**: Sortable, filterable tables with pagination
- **Interactive Charts**: Hover effects and drill-down capabilities
- **Modal Dialogs**: Contextual actions and detailed views
- **Notification System**: Real-time alerts and status updates

## 📈 Performance

### **Optimization Features**
- Code splitting and lazy loading
- Optimized bundle size with tree shaking
- Efficient re-rendering with React.memo
- Image optimization and caching
- API response caching with React Query

### **Metrics**
- Initial load time: <3 seconds
- Time to interactive: <2 seconds
- Bundle size: <500KB gzipped
- Lighthouse score: 90+

## 🔒 Security

### **Security Measures**
- JWT token authentication
- Role-based access control
- Input validation and sanitization
- XSS and CSRF protection
- Secure API communication (HTTPS)
- Audit logging for all admin actions

## 🚀 Deployment

### **Production Build**
```bash
npm run build
```

### **Docker Deployment**
```dockerfile
FROM node:18-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### **Environment Variables**
```env
VITE_API_URL=https://api.mangrovewatch.org/api
VITE_APP_NAME=Mangrove Watch Admin
VITE_NODE_ENV=production
```

## 🧪 Testing

### **Testing Strategy**
- Unit tests for components and utilities
- Integration tests for API interactions
- E2E tests for critical user flows
- Accessibility testing with axe-core

### **Test Commands**
```bash
npm run test          # Run unit tests
npm run test:e2e      # Run E2E tests
npm run test:coverage # Generate coverage report
```

## 📱 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Implement changes with tests
4. Submit a pull request
5. Code review and merge

## 📞 Support

- **Documentation**: Comprehensive guides and API docs
- **Issue Tracking**: GitHub issues for bug reports
- **Community**: Discord channel for discussions
- **Professional Support**: Enterprise support available

---

**Built with ❤️ for mangrove conservation and environmental protection**
