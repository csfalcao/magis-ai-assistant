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
- **Text Processing**: LangChain SemanticChunker for intelligent text segmentation
- **Embeddings**: Voyage-3.5-lite (1024 dimensions, int8 quantization)
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

5. **MCP Ecosystem Integration**
   - Model Context Protocol servers for unified digital life access
   - Calendar, email, tasks, and location integration
   - Health, media, finance, and smart home connectivity
   - Privacy-first approach with granular user control

### **MCP Integration Strategy**

**Philosophy**: Transform MAGIS into the central intelligence hub for your entire digital ecosystem through seamless MCP integrations.

**Core Approach**:
- **Conversational Intelligence**: MCP data enhances natural conversation, never dominates it
- **Proactive Assistance**: "I noticed..." rather than "Your calendar shows..."
- **Contextual Awareness**: Right information at the perfect moment
- **Privacy Control**: User decides what data MAGIS can access

**Example MCP-Enhanced Interactions**:
```
User: "I'm feeling overwhelmed"
MAGIS: "I can see why - you have 15 meetings this week and only 2 hours of 
       free time. Want me to suggest which meetings might be reschedulable?"

User: "I need to go to the dentist"  
MAGIS: "I see you're free next Tuesday at 2 PM. Should I find dentists near 
       your work, and would you prefer morning or afternoon appointments?"
```

**Integration Priority**:
- **Phase 2A**: Calendar, Email, Tasks, Location (Essential Context)
- **Phase 2B**: Health, Media, Finance, Smart Home (Lifestyle Intelligence)  
- **Phase 2C**: Commerce, Transport, Cloud Storage (Advanced Ecosystem)

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

---

## 🚀 **CURRENT SESSION STATUS (Life Operating System Implementation)**

### **🎯 Revolutionary Breakthrough: MAGIS Life OS**

**Vision Confirmed**: MAGIS transforms from "AI assistant with memory" to **"The First Life Operating System"** - managing life resources like a computer OS manages system resources.

**Market Positioning**: The first AI that treats your entire life as an integrated operating system with predictable needs, cycles, and optimizations.

### **🧠 Three-Tier Intelligence Architecture**

**Core Innovation**: MAGIS now distinguishes between three fundamental types of content:

#### **🆔 WHO I AM (Profile)**
- **Biographical Information**: "My birthday is Dec 29", "I work at Google", "I live in Miami"
- **Processing**: Updates user profile automatically + creates conversational memory
- **Purpose**: Build comprehensive understanding of user identity and context

#### **📚 WHAT I DID (Memory)**  
- **Past Events & Preferences**: "I love Italian food", "Had great dinner last night", "Meeting went well"
- **Processing**: Creates rich memory records for context and learning
- **Purpose**: Maintain conversational context and understand user preferences

#### **📅 WHAT I'LL DO (Experience)**
- **Future/Planned Events**: "Dentist appointment next Friday", "Vacation next month", "Meeting tomorrow"
- **Processing**: Creates trackable experiences + memories + generates hidden proactive tasks
- **Purpose**: Enable proactive life management and follow-up intelligence

### **🔍 Classification-First Processing (Option B)**

**Single AI Call Architecture**: Content classification drives specialized entity extraction
- **Efficiency**: One AI call instead of double processing
- **Intelligence**: Context-aware extraction tailored to content type
- **Performance**: Faster response times, lower costs

**Processing Flow**:
1. **Classify** content → PROFILE/MEMORY/EXPERIENCE
2. **Extract** entities based on classification type
3. **Route** to appropriate systems (profile update, memory storage, experience creation)
4. **Generate** hidden system tasks for proactive intelligence

### **📅 Advanced Date Resolution**

**Date Ranges for Periods**:
- **Specific Dates**: "next Friday" → `{type: "date", value: "2025-08-01"}`
- **Time Periods**: "next week" → `{type: "range", start: "2025-08-04", end: "2025-08-10"}`
- **Temporal Intelligence**: Proper conflict detection and scheduling across date ranges

### **⚙️ Task-Based Proactive Intelligence**

**Hidden System Tasks**: Proactive intelligence runs through existing task infrastructure
- **User Tasks**: Visible task management for user
- **System Tasks**: Hidden tasks that trigger MAGIS proactive behaviors
- **Magic Preservation**: User experiences natural follow-ups without seeing scheduling machinery

**Example**: "Dentist appointment next Friday" creates hidden task "Follow up on dentist appointment" (due: day after)

### **✅ Technical Implementation Status**

#### **Foundation Complete**:
- ✅ **Modern Stack Stable**: React 19 + Next.js 15 + AI SDK 4.x working perfectly
- ✅ **Voyage Embeddings**: 1024-dimensional Voyage-3.5-lite embeddings working
- ✅ **Memory Extraction**: WHO/WHAT/WHEN/WHERE entity extraction operational
- ✅ **Database Schema**: Complete Life OS structure with embeddings and metadata

#### **🎯 Next Implementation Phase**:
**Three-Tier Intelligence System**: Implement classification-first processing with:
- Content classification into PROFILE/MEMORY/EXPERIENCE
- Specialized entity extraction per content type
- Date range resolution for temporal intelligence
- Hidden system task generation for proactive features

### **🎖️ Next Session Goals**

1. **Implement Three-Tier Classification**: Build classification-first memory processing
2. **Date Range Resolution**: "Next week" → proper date ranges with start/end
3. **Profile Integration**: "My birthday is Dec 29" → automatic profile updates
4. **Hidden Task System**: Generate proactive tasks without exposing scheduling machinery
5. **End-to-End Testing**: Validate complete intelligence pipeline

**Status**: Life OS architecture defined. Ready for three-tier intelligence implementation.