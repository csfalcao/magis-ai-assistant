# MAGIS AI Assistant - Development Instructions for Claude Code

## 🎯 **Project Overview**

MAGIS is a revolutionary personal AI assistant that combines:
- **Conversational Intelligence**: Natural, context-aware conversations across work/personal/family contexts
- **Personal RAG System**: Comprehensive memory that learns from every interaction
- **Proactive Engagement**: Naturally follows up on experiences and builds genuine relationships
- **Voice Integration**: Seamless speech-to-text and text-to-speech capabilities

**Core Vision**: Create the first AI assistant that feels like a personal companion who truly knows you and gets smarter over time.

## 🏗️ **Technology Stack**

**Primary Stack**: Next.js + Convex + Vercel AI SDK
- **Frontend**: Next.js 14 with TypeScript, Tailwind CSS, Framer Motion
- **Backend**: Convex (reactive database + serverless functions)
- **AI**: Vercel AI SDK with OpenAI GPT-4 and Claude support
- **Real-time**: Convex reactive queries (no Socket.IO needed)
- **Voice**: Browser Speech API + OpenAI Whisper + ElevenLabs
- **Vector Search**: Convex built-in vector search for RAG
- **Deployment**: Vercel (frontend) + Convex Cloud (backend)

**Why This Stack**: 
- 4-day MVP timeline (vs 10 days with traditional stack)
- Native MCP integration for Claude Code development
- Built-in real-time without configuration
- End-to-end TypeScript type safety
- RAG capabilities without separate vector database

## 📁 **Project Structure**

```
magis-ai-assistant/
├── app/                          # Next.js 14 app directory
│   ├── api/chat/route.ts        # AI chat endpoint with RAG
│   ├── api/webhooks/            # Zapier/external integrations
│   ├── components/              # React components
│   ├── page.tsx                 # Main application
│   └── layout.tsx               # Root layout
├── convex/                      # Convex backend
│   ├── schema.ts                # Database schema with vector search
│   ├── conversations.ts         # Chat functions
│   ├── memory.ts                # RAG search and retrieval
│   ├── embeddings.ts            # Vector embedding generation
│   ├── proactiveConversations.ts # Natural follow-up system
│   └── auth.ts                  # Authentication
├── components/                  # Shared React components
│   ├── ChatInterface.tsx        # Main chat component
│   ├── VoiceInput.tsx          # Voice input handling
│   └── ProactiveNotifications.tsx
└── docs/                        # This documentation
```

## 🚀 **Implementation Priority Order**

### **Day 1: Foundation (6 hours)**
1. **Project Setup** (30 min)
   - Initialize Next.js 14 with TypeScript
   - Install Convex and Vercel AI SDK
   - Configure environment variables

2. **Basic Schema** (1 hour)
   - Users, conversations, messages tables
   - Authentication setup

3. **Simple Chat Interface** (4 hours)
   - Basic React chat component
   - Simple AI integration
   - Message persistence

4. **Convex Setup** (30 min)
   - Deploy Convex backend
   - Test basic mutations/queries

### **Day 2: AI Integration & Voice (6 hours)**
1. **Enhanced AI Chat** (3 hours)
   - Vercel AI SDK integration
   - Multi-provider support (OpenAI + Claude)
   - Streaming responses
   - Tool integration

2. **Voice Capabilities** (2 hours)
   - Speech-to-text integration
   - Voice input component
   - Text-to-speech responses

3. **Context Switching** (1 hour)
   - Work/Personal/Family mode switching
   - Context-aware prompts

### **Day 3: RAG System (6 hours)**
1. **Vector Search Setup** (2 hours)
   - Extend schema for embeddings
   - Embedding generation functions
   - Vector search configuration

2. **Memory Storage** (2 hours)
   - Conversation embedding pipeline
   - Entity extraction
   - Memory chunk creation

3. **RAG Retrieval** (2 hours)
   - Semantic search functions
   - Context injection to AI
   - Memory-enhanced responses

### **Day 4: Proactive Intelligence (6 hours)**
1. **Experience Tracking** (2 hours)
   - Track appointments/events
   - Completion detection
   - Follow-up scheduling

2. **Natural Follow-ups** (3 hours)
   - Proactive conversation generation
   - Natural timing calculation
   - Insight extraction from responses

3. **Cross-Context Learning** (1 hour)
   - Preference learning
   - Pattern recognition
   - Recommendation improvement

## 🔧 **Key Implementation Details**

### **Environment Variables**
```env
# Convex
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
CONVEX_DEPLOY_KEY=your-deploy-key

# AI Services
OPENAI_API_KEY=sk-your-openai-key
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key

# Optional Voice
ELEVENLABS_API_KEY=your-elevenlabs-key

# External Integrations
ZAPIER_WEBHOOK_SECRET=your-zapier-secret
```

### **Critical Features to Implement**

1. **Personal RAG System**
   - Embed all conversations with metadata
   - Semantic search for relevant memories
   - Cross-context learning and preference tracking
   - Memory compression for long-term storage

2. **Proactive Conversations**
   - Natural follow-up timing (4 hours after dentist, next morning after restaurant)
   - Conversational insight extraction (not surveys)
   - Emotional intelligence in responses
   - Cross-experience learning

3. **Voice Integration**
   - Browser Speech Recognition API
   - Context-appropriate TTS responses
   - Voice command processing
   - Hands-free operation

4. **Context Intelligence**
   - Work/Personal/Family mode switching
   - Context-specific system prompts
   - Tone adaptation by context
   - Cross-context memory linking

## 📖 **Additional Documentation**

- **`architecture.md`** - Complete technical architecture
- **`rag-system.md`** - Detailed RAG implementation
- **`proactive-conversations.md`** - Natural conversation system
- **`examples.md`** - User scenarios and conversation examples
- **`schema.md`** - Complete database schema
- **`implementation-timeline.md`** - Detailed 4-day schedule
- **`tech-stack.md`** - Technology decisions and rationale
- **`deployment.md`** - Deployment instructions

## 🎯 **Success Criteria**

By end of Day 4, MAGIS should:
- ✅ Handle natural voice conversations
- ✅ Remember and learn from every interaction
- ✅ Proactively follow up on experiences naturally
- ✅ Switch contexts (work/personal/family) intelligently
- ✅ Provide increasingly personalized responses
- ✅ Feel like a genuine personal companion

## 🚀 **Getting Started**

1. Read through all documentation files
2. Set up development environment (see `deployment.md`)
3. Follow the 4-day timeline in `implementation-timeline.md`
4. Use the examples in `examples.md` for testing
5. Implement features in priority order

The goal is to create something that makes users say: *"I can't live without MAGIS - it actually knows me!"*

Let's build the future of personal AI assistance! 🎯