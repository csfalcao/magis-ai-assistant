# MAGIS Architecture Documentation

## 🏗️ **System Architecture Overview**

```
┌─────────────────────────────────────────────────────────────┐
│                    CLAUDE CODE                              │
│              (Orchestrates Everything)                      │
└─────────────────────┬───────────────────────────────────────┘
                      │ MCP Protocol
┌─────────────────────▼───────────────────────────────────────┐
│                 MCP ECOSYSTEM                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │   Convex    │  │ Vercel AI   │  │    Zapier/Other     │ │
│  │ MCP Server  │  │ MCP Client  │  │   MCP Servers       │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                 NEXT.JS APP                                 │
│  ┌─────────────────┐    ┌─────────────────┐                │
│  │   React UI      │    │  API Routes     │                │
│  │ • Convex Hooks  │◄──►│ • AI SDK        │                │
│  │ • Real-time     │    │ • Streaming     │                │
│  │ • Type Safety   │    │ • Webhooks      │                │
│  └─────────────────┘    └─────────────────┘                │
└─────────────────────────────────────────────────────────────┘
```

## 🔄 **Data Flow Architecture**

### **Voice Input to AI Response Flow**
```
📱 Voice Input → 🎤 Speech-to-Text → 💬 Chat Interface → 🧠 AI Processing → 🔍 RAG Search → 📝 Response Generation → 🗄️ Memory Storage → 📲 Real-time UI Update
     1s              1s                <1s              2-3s            1s             1s                1s               <1s
```

### **Memory & Learning Flow**
```
💬 Conversation → 🔢 Embedding Generation → 🗄️ Vector Storage → 🔍 Semantic Search → 🧠 Context Injection → 📈 Preference Learning
```

### **Proactive Conversation Flow**
```
✅ Event Completion → ⏰ Smart Timing → 💬 Natural Follow-up → 🧠 Insight Extraction → 📊 Cross-Context Learning
```

## 🏭 **Component Architecture**

### **Frontend Components (Next.js 14)**

```typescript
app/
├── layout.tsx                    # Root layout with providers
├── page.tsx                     # Main dashboard
├── chat/
│   ├── page.tsx                # Chat interface route
│   └── [conversationId]/       # Individual conversation
├── components/
│   ├── ChatInterface.tsx       # Main chat component
│   ├── VoiceInput.tsx         # Voice input handling
│   ├── MessageList.tsx        # Message display
│   ├── ContextSwitcher.tsx    # Work/Personal/Family modes
│   ├── ProactiveNotifications.tsx # Proactive messages
│   └── MemoryInsights.tsx     # Memory visualization
└── api/
    ├── chat/route.ts          # AI chat endpoint
    ├── voice/route.ts         # Voice processing
    └── webhooks/              # External integrations
```

### **Backend Functions (Convex)**

```typescript
convex/
├── schema.ts                  # Database schema with vector search
├── auth.ts                   # Authentication functions
├── conversations.ts          # Chat CRUD operations
├── messages.ts              # Message handling
├── memory/
│   ├── embeddings.ts        # Vector embedding generation
│   ├── search.ts           # Semantic search functions
│   ├── compression.ts      # Memory compression
│   └── entities.ts         # Entity extraction/tracking
├── proactive/
│   ├── scheduling.ts       # Proactive conversation timing
│   ├── generation.ts       # Natural follow-up creation
│   └── analysis.ts         # Conversation insight extraction
├── tasks.ts                 # Task management
└── external/
    ├── calendar.ts         # Calendar integration
    └── webhooks.ts         # Zapier/external webhooks
```

## 🗄️ **Database Architecture (Convex)**

### **Core Tables**
```typescript
// Users and Authentication
users: {
  id, email, name, avatar, assistantName,
  preferences: { defaultContext, voiceEnabled, aiProvider, theme }
}

// Conversations and Messages  
conversations: { id, userId, title, context, lastMessageAt }
messages: { id, conversationId, content, role, metadata, timestamp }

// Tasks and Experiences
tasks: { id, userId, title, completed, priority, context, dueDate }
experienceTracking: { 
  id, userId, type, title, provider, scheduledTime, 
  completedTime, status, followUpScheduled, naturalReview 
}
```

### **RAG Memory Tables**
```typescript
// Memory chunks for semantic search
memory_chunks: {
  id, userId, conversationId, content, 
  embedding: vector(1536), // OpenAI embeddings
  metadata: { type, timestamp, context, importance, entities, summary }
}

// Compressed memory summaries
memory_summaries: {
  id, userId, timeRange, summary, keyInsights, 
  importantEvents, learnedPreferences, embedding: vector(1536)
}

// Entity tracking for relationship building
entities: {
  id, userId, name, type, aliases, context,
  lastMentioned, importance, relationships
}
```

### **Vector Search Indexes**
```typescript
// Primary embedding search
memory_chunks.vectorIndex('by_embedding', {
  vectorField: 'embedding',
  dimensions: 1536,
  filterFields: ['userId', 'metadata.context', 'metadata.type']
})

// Summary search for compressed memories
memory_summaries.vectorIndex('by_summary_embedding', {
  vectorField: 'embedding',
  dimensions: 1536,
  filterFields: ['userId']
})
```

## 🤖 **AI Integration Architecture**

### **Multi-Provider AI System**
```typescript
// Unified AI interface with fallback
const aiProviders = {
  primary: openai('gpt-4-turbo'),
  fallback: anthropic('claude-3-sonnet-20240229'),
  embedding: openai('text-embedding-3-small'),
  voice: {
    stt: 'browser-speech-api', // or OpenAI Whisper
    tts: 'elevenlabs-voice-synthesis'
  }
}

// Provider selection logic
function selectProvider(context, userPreference) {
  if (userPreference === 'claude') return aiProviders.fallback;
  return aiProviders.primary;
}
```

### **Tool Integration**
```typescript
// AI Tools for system interaction
const tools = {
  // Memory & RAG
  searchPersonalMemory: searchMemories,
  rememberPersonalInfo: storeMemory,
  
  // Task Management
  createTask: createTaskWithContext,
  getCurrentTasks: getTasksByContext,
  
  // Calendar & Scheduling
  checkCalendarAvailability: queryCalendar,
  scheduleAppointment: createCalendarEvent,
  
  // External Services
  findLocalProviders: searchBusinesses,
  getWeatherForecast: fetchWeather,
  
  // Proactive Features
  scheduleFollowUp: createProactiveConversation,
  analyzeExperience: extractInsights
}
```

## 🔍 **RAG System Architecture**

### **Embedding Pipeline**
```typescript
// Real-time embedding generation
Conversation → Content Chunking → Embedding Generation → Vector Storage → Index Update
     ↓              ↓                    ↓                   ↓              ↓
  AI Response → Entity Extraction → Metadata Enrichment → Semantic Linking → Search Ready
```

### **Retrieval Architecture**
```typescript
// Multi-stage retrieval for comprehensive context
User Query → Query Embedding → Vector Search → Relevance Filtering → Context Ranking → LLM Injection

// Parallel searches for complete context
Promise.all([
  searchRecentMemories(query, 24h),    // Last 24 hours
  searchSemanticMemories(query, 10),   // Most relevant
  searchEntityMentions(query),         // Related people/places
  searchContextMemories(currentContext, 5), // Context-specific
  searchPatterns(userId, query)        // Behavioral patterns
])
```

### **Memory Compression Strategy**
```typescript
// Intelligent memory management
Recent (0-30 days):    Full detail storage
Medium (30-180 days):  Weekly summaries + high-importance items
Old (180+ days):       Monthly summaries + critical memories only
Archive (1+ years):    Yearly summaries + life-changing events
```

## 🔄 **Real-Time Architecture**

### **Convex Reactive System**
```typescript
// No Socket.IO needed - Convex handles all real-time
const messages = useQuery(api.conversations.getMessages, { 
  conversationId 
});
// ↑ Automatically updates when new messages arrive

// Real-time across all clients
User A sends message → Convex mutation → All connected clients update instantly
```

### **Optimistic UI Updates**
```typescript
// Immediate UI feedback with server reconciliation
const sendMessage = useMutation(api.messages.send);

async function handleSend(content) {
  // Optimistic update
  setMessages(prev => [...prev, { content, role: 'user', pending: true }]);
  
  // Server call
  await sendMessage({ content, conversationId });
  
  // Convex automatically reconciles with server state
}
```

## 🔐 **Security Architecture**

### **Authentication & Authorization**
```typescript
// Convex Auth with multiple providers
auth: {
  providers: [
    Password({ verify: 'always' }),
    GoogleOAuth,
    // Future: Apple, Microsoft, etc.
  ]
}

// Row-level security
function canAccessConversation(userId, conversationId) {
  return conversation.userId === userId;
}
```

### **Data Privacy**
```typescript
// User data ownership
- All conversations stored in user's Convex deployment
- Memory embeddings never leave user's database  
- Option for self-hosted Convex deployment
- Granular data deletion controls
- No training on user conversations
```

## 📊 **Monitoring & Analytics Architecture**

### **Performance Monitoring**
```typescript
// Built-in Convex observability
- Function execution times
- Database query performance
- Real-time connection status
- Vector search performance metrics
```

### **User Analytics (Privacy-Preserving)**
```typescript
// Anonymous usage patterns
- Feature usage statistics
- Performance bottlenecks
- Error rates and types
- User engagement metrics (no personal data)
```

## 🚀 **Deployment Architecture**

### **Production Environment**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Vercel Edge   │    │  Convex Cloud   │    │  External APIs  │
│                 │    │                 │    │                 │
│ • Next.js App   │◄──►│ • Database      │◄──►│ • OpenAI        │
│ • Global CDN    │    │ • Functions     │    │ • Anthropic     │
│ • Auto Scaling  │    │ • Vector Search │    │ • ElevenLabs    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### **Development Environment**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Local Next.js  │    │  Convex Dev     │    │     Claude      │
│                 │    │                 │    │      Code       │
│ • Hot Reload    │◄──►│ • Local DB      │◄──►│                 │
│ • Dev Server    │    │ • Live Functions│    │ • MCP Server    │
│ • Type Safety   │    │ • Auto Deploy   │    │ • Direct Access │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🔧 **Development Tools Integration**

### **Claude Code MCP Integration**
```bash
# Start Convex MCP server for Claude Code
npx convex mcp start

# Claude Code can now:
# - Query database directly
# - Read function schemas
# - Generate type-safe code
# - Test functions in real-time
```

### **Type Safety Architecture**
```typescript
// End-to-end type safety
Database Schema → Convex Types → API Types → React Props → UI Components
      ↓              ↓            ↓           ↓            ↓
  Automatic      Generated     Inferred   Type-safe   Compile-time
  validation     types         types      props       errors
```

This architecture enables MAGIS to be both sophisticated in capabilities and simple in development, with Claude Code having full visibility and control over every component! 🏗️