# 🍽️ JiGR App - Modular Hospitality Platform

A comprehensive multi-tenant SaaS platform for New Zealand hospitality businesses that provides complete restaurant management including inventory tracking, recipe management, menu engineering, and compliance automation using AI document processing.

## ✨ Key Features

### 🤖 AI-Powered Document Processing
- **Automatic temperature extraction** from delivery docket photos
- **Google Document AI integration** for accurate text recognition
- **Real-time compliance validation** against NZ food safety standards
- **Confidence scoring** and manual review workflows

### 🏢 Multi-Tenant Architecture
- **Complete data isolation** between clients using Row Level Security
- **Role-based permissions** (Staff, Manager, Admin, Owner)
- **Team invitation system** with secure onboarding
- **Scalable to unlimited clients** with enterprise-grade security

### 📊 Compliance Management
- **Real-time violation alerts** via email/SMS for critical issues
- **Automated compliance reports** for health inspectors
- **Comprehensive audit trails** for regulatory compliance
- **Temperature trend analysis** and supplier performance tracking

### 🔍 Health Inspector Portal
- **Secure, time-limited access** for government inspectors
- **Read-only compliance data** with comprehensive reporting
- **Tamper-evident digital signatures** and data verification
- **Export capabilities** for official inspections

### 💳 Subscription Billing
- **Stripe integration** with usage-based pricing
- **Three tier plans**: Basic ($49), Professional ($99), Enterprise ($199) NZD
- **Document usage tracking** and automatic billing
- **7-day free trial** with seamless conversion

## 🎯 Target Market

**Primary**: New Zealand hospitality businesses (restaurants, cafes, bars, hotels) requiring food safety compliance.

**Specific Optimization**: iPad Air (2013) with Safari 12 for kitchen/receiving area use.

## 🏗️ Technical Architecture

### Frontend
- **Next.js 13** with TypeScript for robust development
- **Tailwind CSS** with Safari 12 compatibility
- **Flexbox-first layouts** optimized for older devices
- **Memory-optimized components** for 1GB RAM constraint

### Backend
- **Supabase** for database, authentication, and real-time features
- **PostgreSQL** with Row Level Security for multi-tenant isolation
- **Edge Functions** for serverless document processing
- **Real-time subscriptions** with polling fallbacks

### AI & Processing
- **Google Document AI** for text extraction from images
- **Pattern matching algorithms** for temperature identification
- **Compliance rule engine** for violation detection
- **Image compression** optimized for Safari 12 performance

### Integrations
- **Stripe** for subscription billing and usage tracking
- **Email/SMS notifications** for critical alerts
- **Google Cloud Storage** for secure document archival
- **Audit logging** for regulatory compliance

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Supabase account
- Google Cloud Platform account
- Stripe account
- Git

### Quick Setup

1. **Clone and install**:
   ```bash
   git clone <repository-url>
   cd hospitality-compliance-saas
   npm install
   ```

2. **Environment setup**:
   ```bash
   cp .env.example .env.local
   # Configure your environment variables
   ```

3. **Database setup**:
   ```bash
   npm run supabase:start
   supabase db push
   ```

4. **Start development**:
   ```bash
   npm run dev
   ```

Visit `http://localhost:3000` to see the application.

For detailed setup instructions, see [SETUP.md](./SETUP.md).

## 🗄️ Database Schema

### Multi-Tenant Core
```
clients ──┐
          ├── client_users ── profiles (auth.users)
          ├── invitations
          └── suppliers
```

### Compliance Data
```
delivery_records ──┐
                   ├── temperature_readings
                   ├── compliance_alerts
                   └── compliance_reports
```

### Audit & Billing
```
audit_logs
document_usage
webhook_logs
inspector_access
```

## 🔒 Security Features

### Data Isolation
- **Row Level Security (RLS)** policies on all tables
- **Storage bucket isolation** by client ID
- **Edge Function permission validation**
- **Encrypted sensitive data** at rest and in transit

### Compliance
- **Complete audit trails** for all user actions
- **Tamper-evident logs** with cryptographic verification
- **Data retention policies** meeting NZ requirements
- **GDPR compliance** with data export/deletion

### Authentication
- **Multi-factor authentication** support
- **Role-based access control** with granular permissions
- **Secure invitation workflows** with token validation
- **Session management** with automatic timeouts

## 📱 Safari 12 Compatibility

Specifically optimized for iPad Air (2013) running Safari 12:

### Performance Optimizations
- **Memory management** for 1GB RAM constraint
- **Image compression** before upload
- **Simplified animations** for A7 processor
- **Progressive loading** of dashboard components

### Compatibility Features
- **ES5 JavaScript transpilation** with Babel
- **CSS fallbacks** for modern features
- **Touch-optimized interface** with 44px minimum targets
- **Polyfills** for modern APIs

### Network Resilience
- **Offline capability** for photo capture
- **Background sync** when connection restored
- **Retry mechanisms** for failed uploads
- **Progress indicators** for slow connections

## 📊 Monitoring & Analytics

### Application Metrics
- **Document processing success rates**
- **Compliance violation trends**
- **User engagement analytics**
- **Performance monitoring**

### Business Intelligence
- **Supplier performance scorecards**
- **Industry compliance benchmarking**
- **Cost tracking and ROI analysis**
- **Predictive compliance analytics**

### Operational Monitoring
- **Real-time error tracking**
- **Uptime monitoring**
- **Database performance metrics**
- **Edge Function execution logs**

## 🔧 Development

### Code Structure
```
app/
├── components/           # Reusable UI components
│   ├── delivery/        # Document upload components
│   ├── compliance/      # Dashboard and alerts
│   └── ui/             # Shared UI elements
├── api/                # Next.js API routes
└── (dashboard)/        # Protected app routes

lib/
├── supabase.ts         # Database client and helpers
├── auth.ts            # Authentication utilities
└── compliance.ts      # Business logic

supabase/
├── functions/         # Edge Functions
├── migrations/       # Database schema
└── config.toml      # Local development config
```

### Key Scripts
```bash
npm run dev              # Start development server
npm run build           # Build for production
npm run db:generate-types # Generate TypeScript types
npm run supabase:start  # Start local Supabase
```

### Testing Strategy
- **Unit tests** for business logic
- **Integration tests** for API endpoints
- **E2E tests** for critical user flows
- **Security tests** for RLS policies

## 📈 Roadmap

### Phase 1: MVP (Weeks 1-8) ✅
- [x] Multi-tenant database schema
- [x] Document AI processing pipeline
- [x] Basic compliance dashboard
- [x] Safari 12 optimized upload
- [x] Stripe billing integration

### Phase 2: Production Ready (Weeks 9-12)
- [ ] Complete onboarding flow
- [ ] Health inspector portal
- [ ] Email notification system
- [ ] Advanced reporting
- [ ] Mobile PWA features

### Phase 3: Growth Features (Weeks 13-16)
- [ ] Advanced analytics dashboard
- [ ] API access for integrations
- [ ] Multi-location support
- [ ] Custom compliance rules
- [ ] Supplier performance tracking

### Phase 4: Enterprise Features (Weeks 17-24)
- [ ] White-label solutions
- [ ] Advanced IoT integrations
- [ ] Predictive analytics
- [ ] Industry-specific modules
- [ ] Global compliance standards

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

### Development Principles
- **Safari 12 first** - All features must work on target hardware
- **Multi-tenant by design** - Perfect data isolation is non-negotiable
- **Compliance focused** - Features must serve regulatory requirements
- **Performance optimized** - Respect hardware constraints

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 🆘 Support

### Documentation
- [Setup Guide](./SETUP.md) - Complete setup instructions
- [API Documentation](./docs/api/) - Edge Function and API reference
- [Database Schema](./docs/database/) - Complete schema documentation

### Community
- [GitHub Issues](../../issues) - Bug reports and feature requests
- [Discussions](../../discussions) - Community support and ideas

### Commercial Support
For enterprise support, custom development, or consulting services, contact us at support@example.com.

---

**Built with ❤️ for New Zealand hospitality businesses**

*Ensuring food safety compliance with modern technology while supporting the people who feed our communities.*# Deployment trigger Tue Sep  9 19:09:12 NZST 2025
