# MAGIS Deployment & Environment Setup

## 🚀 **Deployment Overview**

MAGIS uses a modern deployment architecture with Vercel for the frontend and Convex Cloud for the backend. This setup provides global performance, automatic scaling, and minimal operational overhead.

---

## 🏗️ **Architecture Summary**

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Vercel Edge   │    │  Convex Cloud   │    │  External APIs  │
│                 │    │                 │    │                 │
│ • Next.js App   │◄──►│ • Database      │◄──►│ • OpenAI        │
│ • Global CDN    │    │ • Functions     │    │ • Anthropic     │
│ • Auto Scaling  │    │ • Vector Search │    │ • ElevenLabs    │
│ • Edge Runtime  │    │ • Real-time     │    │ • Zapier        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📋 **Prerequisites**

### **Development Environment**
- **Node.js 18+** - [Download here](https://nodejs.org/)
- **npm 8+** - Comes with Node.js
- **Git** - For version control
- **VS Code** (recommended) - For development
- **Chrome/Edge** - For testing (voice features)

### **Required Accounts**
1. **Vercel Account** - [https://vercel.com](https://vercel.com)
2. **Convex Account** - [https://convex.dev](https://convex.dev)
3. **OpenAI Account** - [https://platform.openai.com](https://platform.openai.com)
4. **Anthropic Account** - [https://console.anthropic.com](https://console.anthropic.com)

### **Optional Services**
- **ElevenLabs** - For premium voice synthesis
- **Google Cloud** - For calendar integration
- **Zapier** - For external automations

---

## 🔧 **Environment Configuration**

### **Environment Variables**

Create `.env.local` in your project root:

```bash
# ==================== CONVEX ====================
NEXT_PUBLIC_CONVEX_URL="https://your-deployment.convex.cloud"
CONVEX_DEPLOY_KEY="your-convex-deploy-key"

# ==================== AI SERVICES ====================
# Required: OpenAI API Key
OPENAI_API_KEY="sk-your-openai-api-key"

# Required: Anthropic API Key  
ANTHROPIC_API_KEY="sk-ant-your-anthropic-api-key"

# Optional: ElevenLabs for premium voice
ELEVENLABS_API_KEY="your-elevenlabs-api-key"

# ==================== EXTERNAL INTEGRATIONS ====================
# Optional: Google Calendar Integration
GOOGLE_CALENDAR_CLIENT_ID="your-google-client-id"
GOOGLE_CALENDAR_CLIENT_SECRET="your-google-client-secret"

# Optional: Zapier Webhooks
ZAPIER_WEBHOOK_SECRET="your-zapier-webhook-secret"

# ==================== APPLICATION CONFIG ====================
# Environment
NODE_ENV="development" # or "production"
NEXT_PUBLIC_APP_URL="http://localhost:3000" # or your production URL

# Features flags
NEXT_PUBLIC_ENABLE_VOICE="true"
NEXT_PUBLIC_ENABLE_PROACTIVE="true"
NEXT_PUBLIC_ENABLE_RAG="true"

# ==================== MONITORING (Optional) ====================
SENTRY_DSN="your-sentry-dsn"
MIXPANEL_TOKEN="your-mixpanel-token"

# ==================== SECURITY ====================
NEXTAUTH_SECRET="your-nextauth-secret"
NEXTAUTH_URL="http://localhost:3000" # or your production URL
```

### **API Key Setup Guide**

#### **1. OpenAI API Key**
```bash
# 1. Visit https://platform.openai.com/api-keys
# 2. Click "Create new secret key"
# 3. Name it "MAGIS-Production" or "MAGIS-Development"
# 4. Copy the key (starts with sk-)
# 5. Add to .env.local:
OPENAI_API_KEY="sk-your-actual-key-here"
```

#### **2. Anthropic API Key**
```bash
# 1. Visit https://console.anthropic.com/
# 2. Go to "API Keys" section
# 3. Click "Create Key"
# 4. Copy the key (starts with sk-ant-)
# 5. Add to .env.local:
ANTHROPIC_API_KEY="sk-ant-your-actual-key-here"
```

#### **3. Convex Setup**
```bash
# 1. Install Convex CLI
npm install -g convex

# 2. Login to Convex
npx convex login

# 3. Initialize Convex in your project
npx convex dev

# 4. Copy the generated URLs to .env.local
```

---

## 🏃‍♂️ **Quick Start Deployment**

### **Option 1: One-Click Setup (Recommended)**

```bash
# 1. Clone the repository
git clone <your-magis-repo-url>
cd magis-ai-assistant

# 2. Run setup script
npm run setup

# 3. Configure environment variables
cp .env.example .env.local
# Edit .env.local with your API keys

# 4. Start development
npm run dev
```

### **Option 2: Manual Setup**

```bash
# 1. Install dependencies
npm install

# 2. Setup Convex
npx convex dev

# 3. Deploy schema
npx convex deploy

# 4. Start development server
npm run dev
```

### **Option 3: Docker Development**

```bash
# 1. Start with Docker Compose
docker-compose up -d

# 2. Setup Convex inside container
docker-compose exec app npx convex dev

# 3. Access application
open http://localhost:3000
```

---

## 🌐 **Production Deployment**

### **Vercel Deployment (Frontend)**

#### **Method 1: GitHub Integration (Recommended)**
```bash
# 1. Push code to GitHub
git add .
git commit -m "Initial MAGIS deployment"
git push origin main

# 2. Visit https://vercel.com/new
# 3. Import your GitHub repository
# 4. Configure environment variables in Vercel dashboard
# 5. Deploy automatically on git push
```

#### **Method 2: Vercel CLI**
```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Login to Vercel
vercel login

# 3. Deploy to production
vercel --prod

# 4. Set environment variables
vercel env add OPENAI_API_KEY
vercel env add ANTHROPIC_API_KEY
vercel env add NEXT_PUBLIC_CONVEX_URL
```

### **Convex Deployment (Backend)**

```bash
# 1. Deploy functions and schema
npx convex deploy --prod

# 2. Configure production environment variables
npx convex env set OPENAI_API_KEY "your-production-key"
npx convex env set ANTHROPIC_API_KEY "your-production-key"

# 3. Verify deployment
npx convex dashboard
```

### **Environment-Specific Configuration**

#### **Development Environment**
```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_CONVEX_URL: process.env.NEXT_PUBLIC_CONVEX_URL,
  },
  experimental: {
    serverComponentsExternalPackages: ['convex'],
  },
};

module.exports = nextConfig;
```

#### **Production Environment**
```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_CONVEX_URL: process.env.NEXT_PUBLIC_CONVEX_URL,
  },
  experimental: {
    serverComponentsExternalPackages: ['convex'],
  },
  
  // Production optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
```

---

## 🔐 **Security Configuration**

### **API Security**
```typescript
// app/api/*/route.ts - Rate limiting example
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'),
});

export async function POST(request: Request) {
  const ip = request.headers.get('x-forwarded-for') ?? 'unknown';
  const { success } = await ratelimit.limit(ip);
  
  if (!success) {
    return Response.json({ error: 'Too many requests' }, { status: 429 });
  }
  
  // Continue with API logic...
}
```

### **Environment Security Checklist**
- [ ] All API keys stored as environment variables (never in code)
- [ ] Different API keys for development/staging/production
- [ ] Rate limiting enabled on all API endpoints
- [ ] CORS configured correctly for your domain
- [ ] CSP headers configured
- [ ] Regular API key rotation schedule

### **Data Privacy Configuration**
```typescript
// convex/privacy.ts - Data retention example
export const cleanupOldData = internalAction({
  handler: async (ctx) => {
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    
    // Get users with data retention preferences
    const users = await ctx.runQuery(internal.users.getUsersWithRetention);
    
    for (const user of users) {
      if (user.preferences.privacy.dataRetentionDays > 0) {
        const cutoff = Date.now() - (user.preferences.privacy.dataRetentionDays * 24 * 60 * 60 * 1000);
        await deleteUserDataOlderThan(ctx, user._id, cutoff);
      }
    }
  },
});
```

---

## 📊 **Monitoring & Observability**

### **Performance Monitoring**
```typescript
// lib/monitoring.ts
export function trackPerformance(operation: string, duration: number) {
  if (process.env.NODE_ENV === 'production') {
    // Send to your analytics service
    analytics.track('performance', {
      operation,
      duration,
      timestamp: Date.now(),
    });
  }
}

// Usage in API routes
const startTime = Date.now();
const result = await processAIRequest(request);
trackPerformance('ai_request', Date.now() - startTime);
```

### **Error Tracking**
```typescript
// lib/error-tracking.ts
import * as Sentry from '@sentry/nextjs';

export function captureError(error: Error, context: any = {}) {
  if (process.env.NODE_ENV === 'production') {
    Sentry.captureException(error, {
      tags: context.tags,
      extra: context.extra,
    });
  } else {
    console.error('Error:', error, context);
  }
}
```

### **Health Check Endpoints**
```typescript
// app/api/health/route.ts
export async function GET() {
  try {
    // Check database connectivity
    const dbHealth = await checkConvexHealth();
    
    // Check AI services
    const aiHealth = await checkAIServices();
    
    // Check external integrations
    const integrationHealth = await checkIntegrations();
    
    return Response.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: dbHealth,
        ai: aiHealth,
        integrations: integrationHealth,
      },
    });
  } catch (error) {
    return Response.json(
      { status: 'unhealthy', error: error.message },
      { status: 500 }
    );
  }
}
```

---

## 🧪 **Testing Configuration**

### **Test Environment Setup**
```bash
# Install testing dependencies
npm install --save-dev jest @testing-library/react @testing-library/jest-dom

# Create test environment file
echo "NODE_ENV=test" > .env.test

# Run tests
npm test
```

### **E2E Testing with Playwright**
```typescript
// tests/e2e/chat.spec.ts
import { test, expect } from '@playwright/test';

test('user can send a message and receive AI response', async ({ page }) => {
  await page.goto('/');
  
  // Login
  await page.fill('[data-testid=email]', 'test@example.com');
  await page.fill('[data-testid=password]', 'password');
  await page.click('[data-testid=login-button]');
  
  // Send message
  await page.fill('[data-testid=message-input]', 'Hello, MAGIS!');
  await page.click('[data-testid=send-button]');
  
  // Check for AI response
  await expect(page.locator('[data-testid=ai-message]')).toBeVisible();
});
```

---

## 🔄 **CI/CD Pipeline**

### **GitHub Actions Workflow**
```yaml
# .github/workflows/deploy.yml
name: Deploy MAGIS

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Run linting
        run: npm run lint
      
      - name: Type check
        run: npm run type-check

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Deploy Convex
        run: |
          npx convex deploy --cmd-url-env-var-name=NEXT_PUBLIC_CONVEX_URL
        env:
          CONVEX_DEPLOY_KEY: ${{ secrets.CONVEX_DEPLOY_KEY }}
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

---

## 📈 **Scaling Considerations**

### **Performance Optimization**
```typescript
// Performance configuration
const nextConfig = {
  // Image optimization
  images: {
    domains: ['your-domain.com'],
    formats: ['image/webp', 'image/avif'],
  },
  
  // Bundle analysis
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback.fs = false;
    }
    return config;
  },
  
  // Compression
  compress: true,
  
  // Headers for caching
  async headers() {
    return [
      {
        source: '/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};
```

### **Database Scaling**
```typescript
// Convex automatically scales, but monitor:
// 1. Function execution time
// 2. Database storage usage
// 3. Vector search performance
// 4. Concurrent user limits

// Optimize expensive queries
export const optimizedQuery = query({
  args: { userId: v.id('users'), limit: v.number() },
  handler: async (ctx, args) => {
    // Use appropriate indexes
    return await ctx.db
      .query('memory_chunks')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .order('desc')
      .take(args.limit);
  },
});
```

---

## 🚨 **Troubleshooting Guide**

### **Common Issues**

#### **Convex Connection Issues**
```bash
# Check Convex status
npx convex dashboard

# Redeploy functions
npx convex deploy

# Clear local cache
rm -rf .convex
npx convex dev
```

#### **API Key Issues**
```bash
# Verify API keys work
curl -H "Authorization: Bearer $OPENAI_API_KEY" \
  https://api.openai.com/v1/models

# Check Anthropic key
curl -H "x-api-key: $ANTHROPIC_API_KEY" \
  https://api.anthropic.com/v1/messages \
  -d '{"model":"claude-3-sonnet-20240229","max_tokens":10,"messages":[{"role":"user","content":"Hi"}]}'
```

#### **Build Issues**
```bash
# Clear all caches
rm -rf .next node_modules .convex
npm install
npx convex dev
npm run build
```

#### **Performance Issues**
```bash
# Check bundle size
npm run analyze

# Monitor API usage
# Check Convex dashboard for function performance
# Monitor OpenAI usage dashboard
```

### **Support Resources**
- **Convex Discord** - [https://discord.gg/convex](https://discord.gg/convex)
- **Vercel Support** - [https://vercel.com/support](https://vercel.com/support)
- **OpenAI Community** - [https://community.openai.com](https://community.openai.com)
- **Project Issues** - Create GitHub issues for project-specific problems

---

## 📋 **Deployment Checklist**

### **Pre-Deployment**
- [ ] All environment variables configured
- [ ] API keys tested and working
- [ ] Database schema deployed
- [ ] Tests passing
- [ ] Performance optimization completed
- [ ] Security headers configured

### **Production Deployment**
- [ ] Vercel project configured
- [ ] Convex production deployment
- [ ] Domain configured (if custom)
- [ ] SSL certificate valid
- [ ] Monitoring and alerts set up
- [ ] Backup strategy in place

### **Post-Deployment**
- [ ] Smoke tests completed
- [ ] Performance monitoring active
- [ ] Error tracking functional
- [ ] User feedback collection ready
- [ ] Documentation updated
- [ ] Team trained on operational procedures

---

## 🎯 **Success Metrics**

### **Technical Metrics**
- **Response Time**: < 2s for chat responses
- **Uptime**: > 99.9%
- **Error Rate**: < 0.1%
- **API Latency**: < 500ms average

### **User Experience Metrics**
- **First Load Time**: < 3s
- **Voice Input Accuracy**: > 95%
- **Memory Search Relevance**: > 90%
- **User Retention**: Track weekly/monthly active users

This deployment guide ensures MAGIS runs reliably and scales effectively in production! 🚀