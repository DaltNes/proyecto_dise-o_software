# FileConverter

## Overview

FileConverter is a full-stack web application designed to solve file format conversion and archive management challenges. The platform provides a comprehensive solution for converting between multiple file formats while offering advanced archive extraction and management capabilities.

## Technical Architecture

### Frontend Stack
- **React 18+** with functional components and hooks
- **Custom Translation System** - Minimal i18n implementation (~100 LOC)
- **Responsive Design** - Mobile-first CSS with flexbox/grid
- **Modern JavaScript** - ES6+ features, async/await patterns
- **Component Architecture** - Modular, reusable UI components

### Backend Infrastructure
- **Node.js 16+** with Express.js framework
- **RESTful API** - Standardized HTTP endpoints
- **File Processing** - Multer for multipart form handling
- **Archive Management** - AdmZip, CloudConvert API integration
- **Environment Configuration** - dotenv for secure credential management

### Database & Authentication
- **Supabase PostgreSQL** - Cloud-native database solution
- **Row Level Security** - Database-level access control
- **JWT Authentication** - Stateless session management
- **User Management** - Registration, login, session handling

### External Integrations
- **CloudConvert API** - Professional file conversion service
- **Local Archive Processing** - ZIP/RAR/7Z handling
- **Fallback Systems** - Local processing when external APIs fail

## Supported File Operations

### Archive Formats
```
ZIP ←→ RAR ←→ 7Z ←→ ARC
```

### Conversion Capabilities
- **Bidirectional conversion** between all supported formats
- **Archive extraction** with file listing and metadata
- **Batch processing** for multiple files
- **Format validation** and error handling

## Technical Features

### Internationalization
- **Bilingual Support**: Spanish ↔ English
- **Runtime Language Switching** - No page reload required
- **Translation Coverage**: 100% UI text localization
- **Minimal Implementation**: Custom hook-based system

### Security Implementation
- **Authentication Required** - All operations require valid session
- **File Upload Validation** - Type and size restrictions
- **CORS Configuration** - Proper cross-origin resource sharing
- **Environment Variables** - Sensitive data protection

### Performance Optimizations
- **Lazy Loading** - Components loaded on demand
- **File Streaming** - Efficient large file handling
- **Error Boundaries** - Graceful failure handling
- **Progress Indicators** - Real-time operation feedback

## Development Environment

### Prerequisites
```bash
Node.js >= 16.0.0
npm >= 8.0.0
Git >= 2.0.0
```

### Installation
```bash
# Clone repository
git clone https://github.com/DaltNes/proyecto_diseno_software.git
cd proyecto_diseno_software

# Backend setup
cd backend
npm install
cp .env.example .env
# Configure environment variables

# Frontend setup
cd ../frontend
npm install
```

### Environment Configuration
```env
# Backend (.env)
CLOUDCONVERT_API_KEY=your_api_key
PORT=3001
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
```

### Development Server
```bash
# Terminal 1 - Backend API (Port 3001)
cd backend && node server.js

# Terminal 2 - Frontend Dev Server (Port 3000)
cd frontend && npm start
```

### Network Access Configuration
```bash
# For mobile device testing
HOST=0.0.0.0 npm start
# Access via: http://[your-ip]:3000
```

## API Documentation

### Authentication Endpoints
```
POST /api/auth/register    # User registration
POST /api/auth/login       # User authentication
POST /api/auth/logout      # Session termination
```

### File Conversion Endpoints
```
POST /api/convert          # File format conversion
POST /api/extract          # Archive extraction
GET  /api/download/:id     # Download converted file
GET  /api/history          # User conversion history
```

### Request/Response Examples
```javascript
// Conversion Request
POST /api/convert
Content-Type: multipart/form-data
{
  file: [binary],
  from: "zip",
  to: "rar"
}

// Response
{
  success: true,
  filename: "converted_file.rar",
  downloadUrl: "/download/abc123",
  metadata: {
    originalSize: 1024,
    convertedSize: 956,
    compressionRatio: 0.93
  }
}
```

## Project Structure
```
├── backend/
│   ├── server.js              # Main server file
│   ├── cloudconvert.js        # External API integration
│   ├── uploads/               # Temporary file storage
│   ├── converted/             # Output files
│   └── temp/                  # Processing workspace
├── frontend/
│   ├── src/
│   │   ├── App.js            # Main application component
│   │   ├── useLanguage.js    # Translation hook
│   │   ├── translations.js   # Language definitions
│   │   ├── AuthContext.js    # Authentication context
│   │   └── components/       # Reusable UI components
│   └── public/               # Static assets
└── README.md                 # Project documentation
```

## Quality Assurance

### Code Standards
- **ESLint Configuration** - Enforced coding standards
- **Component Testing** - Unit tests for critical functions
- **Error Handling** - Comprehensive try-catch implementations
- **Type Safety** - PropTypes validation where applicable

### Performance Metrics
- **Bundle Size** - Optimized for web delivery
- **Load Time** - < 3s initial page load
- **Conversion Speed** - Dependent on file size and format
- **Mobile Responsiveness** - 100% mobile compatibility

## Deployment Considerations

### Production Requirements
- **Node.js Runtime** - v16+ recommended
- **Database** - PostgreSQL 12+
- **File Storage** - Local or cloud storage solution
- **SSL Certificate** - HTTPS required for production
- **Environment Variables** - Secure credential management

### Scalability Features
- **Stateless Architecture** - Horizontal scaling capability
- **Database Connection Pooling** - Efficient resource utilization
- **File Processing Queue** - Async operation handling
- **Load Balancer Ready** - Multiple instance support

## Technical Debt & Future Enhancements

### Current Limitations
- CloudConvert API dependency for advanced conversions
- Local 7-Zip requirement for certain archive operations
- File size limitations based on available memory

### Planned Improvements
- WebAssembly integration for client-side processing
- Background job queue implementation
- Advanced file preview capabilities
- Batch conversion API endpoints

---

**Academic Project**: Software Design Course (TICS316)  
**Institution**: Universidad del Desarrollo  
**Year**: 2025  
**Technology Stack**: React.js, Node.js, PostgreSQL, Supabase
