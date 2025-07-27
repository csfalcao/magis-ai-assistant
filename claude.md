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

### **🧬 The Sims Framework Implementation**
Inspired by The Sims' universal needs system (health, hunger, sleep), MAGIS implements universal **Life Needs**:

- **🏥 Health Maintenance**: Dentist (6mo), doctor (12mo), prescriptions, checkups
- **💰 Financial Cycles**: Bills, insurance, taxes, budget reviews  
- **🚗 Asset Maintenance**: Car service, home maintenance, tech updates
- **💼 Professional Development**: Skills, networking, career planning

**Progressive Enhancement Strategy**:
1. **Health Module First** (universal, predictable, non-controversial)
2. **Asset Maintenance** (car, home, technology)  
3. **Financial Management** (bills, planning, optimization)
4. **Professional Growth** (skills, network, career)
5. **MCP Integration** (calendar, health systems, project management)

### **✅ Technical Implementation Status**

#### **Foundation Complete**:
- ✅ **Modern Stack Stable**: React 19 + Next.js 15 + AI SDK 4.x working perfectly
- ✅ **Build Process**: Zero TypeScript errors, clean compilation
- ✅ **Convex Integration**: Functions deployed, authentication working
- ✅ **Chat Interface**: Natural AI responses, streaming working

#### **Life OS Memory System**:
- ✅ **WHO/WHAT/WHEN/WHERE Framework**: Implemented in `convex/memoryExtraction.ts`
- ✅ **AI-Powered Entity Extraction**: Claude/GPT integration with intelligent fallbacks
- ✅ **Life OS Structure**: Memory categorization for life management
- ✅ **Database Schema**: Sophisticated memory storage with entities and metadata

#### **⚠️ Debug Required (Next Session Priority)**:
**Issue**: Chat messages recorded in DB ✅, but Life OS memory extraction not creating memory/experience/task records ❌

**Root Cause**: Complex processing chain `processMessageForProactive()` → experience detection → memory extraction may be failing silently

**Debug Plan**:
1. Check development console error logs
2. Test `api.ai.extractStructuredData` dependency 
3. Isolate memory extraction function testing
4. Fix processing chain to ensure Life OS extraction works
5. Verify "I need to go to the dentist next month" creates WHO/WHAT/WHEN/WHERE memory

### **🎯 Life OS Implementation Roadmap**

#### **Phase 1: Memory Foundation** (90% complete - debugging needed)
- Restore sophisticated WHO/WHAT/WHEN/WHERE extraction
- Test: "I need to go to the dentist next month" → Creates structured memory
- Verify: Memory retrieval in chat responses

#### **Phase 2: Health OS Module** (ready to implement)
- Health need detection and lifecycle tracking  
- Universal health cycles (dental 6mo, physical 12mo)
- Health maintenance records with urgency calculation

#### **Phase 3: Validation Testing** (planned)
- 20-question health scenario test battery
- 90%+ accuracy target for health need detection
- Robust edge case handling

#### **Phase 4: Life OS Expansion** (framework ready)
- Asset maintenance module (car, home, tech)
- Financial cycles module (bills, insurance, planning)
- Professional development module (skills, networking)

#### **Phase 5: MCP Integration** (strategic planning)
- Calendar integration for appointment scheduling
- Health system connections (pharmacy, providers)
- Project management tools (Asana, Trello, Monday.com)

### **🏆 Strategic Advantages of Life OS Positioning**

1. **Unique Market Position**: First "Life Operating System" - new product category
2. **Natural Moat**: Complex life pattern understanding, hard to replicate
3. **High Switching Cost**: Once MAGIS manages life cycles, difficult to leave
4. **Universal Appeal**: Everyone has same basic life maintenance needs
5. **Clear Expansion Path**: Systematic framework for adding new life modules

### **📋 Process Improvements Implemented**

- ✅ **User Confirmation Required**: Each phase must be approved before proceeding
- ✅ **Commit After Approval**: Only commit after user confirms phase success
- ✅ **No Downgrades**: Never revert functionality - only build forward
- ✅ **Decision Escalation**: Any bugs/scenarios → ASK USER to decide
- ✅ **TodoWrite Tracking**: All progress systematically tracked

### **🎖️ Next Session Goals**

1. **Debug Memory Extraction**: Fix the processing chain to enable Life OS memory creation
2. **Complete Phase 1**: Verify WHO/WHAT/WHEN/WHERE extraction working end-to-end
3. **Begin Health OS Module**: Implement first Life OS need detection system
4. **Test Validation**: Prove concept with dentist appointment lifecycle tracking

**Status**: Life OS foundation 90% complete. Final debugging needed for breakthrough to world's first Life Operating System.

Let's build the future of personal AI assistance! 🎯