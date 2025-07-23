# MAGIS Proactive Conversation Testing Guide

## 🎯 **Overview**

This guide provides comprehensive testing procedures for MAGIS's proactive conversation system - the feature that enables natural follow-up conversations after user experiences.

**System Status**: ✅ **IMPLEMENTED** - Ready for testing  
**Components**: Experience monitoring, follow-up scheduling, AI message generation, background processing

---

## 🏗️ **Architecture Overview**

### **Core Components**
1. **Experience Monitoring** (`convex/experienceMonitoring.ts`)
   - Time-based completion detection
   - User message analysis for completion indicators
   - Automatic experience status updates

2. **Proactive Conversations** (`convex/proactiveConversations.ts`)
   - Follow-up timing calculation
   - Natural message generation
   - Delivery scheduling and tracking

3. **Background Processing** (`app/api/background/process-proactive/route.ts`)
   - Automated follow-up delivery
   - Experience completion detection
   - Scheduled via Vercel Cron (every 15 minutes)

4. **Chat Integration** (`components/ChatInterface.tsx`)
   - Visual distinction for proactive messages
   - Controls and statistics display
   - Development testing tools

---

## 🧪 **Testing Scenarios**

### **Scenario 1: Healthcare Appointment Follow-up**
**Expected Flow**:
1. User mentions: "I need to go to the dentist next month"
2. System extracts experience and schedules it
3. Time-based completion detection triggers after scheduled time + 1 hour
4. Follow-up scheduled for 4 hours after completion
5. Proactive message: "Hope your dentist appointment went well! How are you feeling?"

**Test Steps**:
```typescript
// 1. Create test experience
await convex.mutation(api.proactiveTest.createTestExperience, {
  userId: "test_user_id",
  title: "Dentist appointment with Dr. Smith",
  experienceType: "health",
  scheduledAt: Date.now() - (4 * 60 * 60 * 1000), // 4 hours ago
  context: "personal",
  importance: 8,
});

// 2. Trigger completion detection
await convex.action(api.experienceMonitoring.detectTimeBasedCompletions, {
  checkLimit: 10,
});

// 3. Process pending follow-ups
await convex.action(api.proactiveConversations.processPendingFollowUps, {});
```

**Expected Results**:
- Experience marked as "completed"
- Follow-up scheduled with "health_check_in" type
- Natural, caring message generated
- Message appears in chat with proactive indicator

### **Scenario 2: Restaurant Experience Follow-up**
**Expected Flow**:
1. User mentions: "Had dinner at Luigi's last night"
2. System detects completion from message content
3. Follow-up scheduled for next morning (16 hours later)
4. Proactive message: "How was dinner at Luigi's? Did you try anything new?"

**Test Steps**:
```typescript
// 1. Create recent restaurant experience
const experienceId = await convex.mutation(api.proactiveTest.createTestExperience, {
  userId: "test_user_id",
  title: "Dinner at Luigi's Italian Restaurant",
  experienceType: "meal",
  scheduledAt: Date.now() - (20 * 60 * 60 * 1000), // Last night
});

// 2. Simulate user message about completion
await convex.action(api.experienceMonitoring.detectCompletionFromMessages, {
  userId: "test_user_id",
  messageContent: "Had a great dinner at Luigi's last night, the pasta was amazing!",
  conversationId: "conversation_id",
});
```

### **Scenario 3: Work Meeting Follow-up**
**Expected Flow**:
1. System detects completed work meeting
2. Follow-up scheduled for 2 hours after completion
3. Context-aware message: "How did your meeting with Sarah go?"

### **Scenario 4: Travel Experience Follow-up**
**Expected Flow**:
1. User mentions completed travel
2. Follow-up scheduled for 24 hours later
3. Message: "Welcome back! How was your trip?"

---

## 🛠️ **Testing Tools**

### **1. Development UI Testing**
The chat interface includes development testing buttons when `NODE_ENV === 'development'`:

```jsx
// In ProactiveControls component
<TestScenarioButton scenarioType="dentist" userId={currentUser._id} />
<TestScenarioButton scenarioType="restaurant" userId={currentUser._id} />
<TestScenarioButton scenarioType="meeting" userId={currentUser._id} />
```

### **2. API Testing Endpoints**

**Background Processing**: `POST /api/background/process-proactive`
```bash
curl -X POST http://localhost:3000/api/background/process-proactive \
  -H "Content-Type: application/json"
```

**Test Scenario Creation**: `POST /api/test/proactive-scenario`
```bash
curl -X POST http://localhost:3000/api/test/proactive-scenario \
  -H "Content-Type: application/json" \
  -d '{"scenarioType": "dentist", "userId": "test_user_id"}'
```

**Health Check**: `GET /api/background/process-proactive`
```bash
curl http://localhost:3000/api/background/process-proactive
```

### **3. Direct Convex Testing**

**Create Test Experience**:
```typescript
await convex.mutation(api.proactiveTest.createTestExperience, {
  userId: "test_user_id",
  title: "Test Experience",
  experienceType: "health",
  scheduledAt: Date.now() - (2 * 60 * 60 * 1000), // 2 hours ago
});
```

**Simulate Completion**:
```typescript
await convex.action(api.proactiveTest.simulateExperienceCompletion, {
  experienceId: "experience_id",
  completionTime: Date.now(),
});
```

**Generate Test Message**:
```typescript
await convex.action(api.proactiveTest.testFollowUpGeneration, {
  experienceType: "health",
  experienceTitle: "Dentist appointment",
  userId: "test_user_id",
  userPreferences: {
    communicationStyle: "friendly",
    responseLength: "brief",
    humor: true,
  },
});
```

---

## 📊 **Testing Metrics**

### **Success Criteria**
- ✅ **Experience Detection**: Automatically detects when experiences are completed
- ✅ **Timing Accuracy**: Follow-ups scheduled at appropriate times based on experience type
- ✅ **Message Quality**: AI generates natural, caring messages (not robotic)
- ✅ **Visual Integration**: Proactive messages visually distinct in chat
- ✅ **Background Processing**: Automated delivery works reliably
- ✅ **User Preferences**: Respects user communication preferences

### **Key Metrics to Track**
```typescript
// Available via api.proactiveConversations.getFollowUpStats
{
  total: number,           // Total follow-ups in period
  delivered: number,       // Successfully delivered
  scheduled: number,       // Currently scheduled
  failed: number,          // Failed deliveries
  successRate: number,     // delivered / total
  avgResponseTime: number, // User response time (future)
}
```

### **Experience Monitoring Stats**
```typescript
// Available via api.experienceMonitoring.getMonitoringStats
{
  total: number,                    // Total experiences
  scheduled: number,                // Still scheduled
  completed: number,                // Completed
  timeBasedCompletions: number,     // Auto-detected by time
  userReportedCompletions: number,  // Detected from messages
  followUpsEnabled: number,         // With follow-up enabled
  followUpsCompleted: number,       // Follow-ups delivered
}
```

---

## 🔍 **Testing Checklist**

### **Phase 1: Component Testing**
- [ ] Experience creation and storage
- [ ] Time-based completion detection
- [ ] Message-based completion detection
- [ ] Follow-up timing calculation
- [ ] AI message generation
- [ ] Follow-up scheduling
- [ ] Message delivery

### **Phase 2: Integration Testing**
- [ ] End-to-end experience flow
- [ ] Chat interface integration
- [ ] Background processing
- [ ] Error handling and fallbacks
- [ ] User preference integration
- [ ] Cross-context memory integration

### **Phase 3: User Experience Testing**
- [ ] Message naturalness and tone
- [ ] Timing appropriateness
- [ ] Visual design and indicators
- [ ] User control and preferences
- [ ] Performance and reliability

### **Phase 4: Edge Case Testing**
- [ ] Multiple overlapping experiences
- [ ] Failed AI generation (fallback messages)
- [ ] User not responding to follow-ups
- [ ] Disabled proactive preferences
- [ ] System downtime recovery

---

## 🐛 **Common Issues and Solutions**

### **Issue: Follow-ups not triggering**
**Causes**: 
- Experience not marked as completed
- Follow-up timing not reached
- Background processing not running

**Solutions**:
- Check experience status in database
- Verify scheduled time calculation
- Manually trigger background processing
- Check Vercel Cron configuration

### **Issue: Poor message quality**
**Causes**:
- AI generation failing
- Poor prompt construction
- Missing user preferences

**Solutions**:
- Review generated prompts
- Test fallback message system
- Verify user profile data
- Adjust AI temperature/parameters

### **Issue: Messages not appearing in chat**
**Causes**:
- Conversation ID mismatch
- Message not saved to database
- Frontend not updating

**Solutions**:
- Check conversation creation
- Verify message insertion
- Test React Query updates

---

## 🚀 **Production Deployment Checklist**

### **Environment Variables**
```env
# Required for background processing
BACKGROUND_PROCESS_TOKEN=your-secure-token

# AI Services (already configured)
OPENAI_API_KEY=sk-your-openai-key
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key

# Convex (already configured)
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
```

### **Vercel Configuration**
```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/background/process-proactive",
      "schedule": "*/15 * * * *"
    }
  ]
}
```

### **Monitoring Setup**
- Set up error tracking for background processing
- Monitor follow-up delivery success rates
- Track user engagement with proactive messages
- Alert on high failure rates

---

## 📈 **Performance Expectations**

### **Response Times**
- Follow-up scheduling: < 2 seconds
- Message generation: < 5 seconds
- Background processing: < 30 seconds per batch
- Experience detection: < 1 second

### **Accuracy Targets**
- Time-based completion detection: 95%+
- Message-based completion detection: 80%+
- Follow-up delivery success: 98%+
- Message quality (user satisfaction): 85%+

### **Scale Limits**
- Concurrent follow-up processing: 50 per batch
- Maximum pending follow-ups: 1000
- Background processing frequency: Every 15 minutes
- Maximum experiences per user: 1000 active

---

## 🎯 **Success Metrics for Milestone 2**

**Milestone 2 Target**: Complete proactive conversation system with natural follow-ups

### **Technical Success Criteria**
- ✅ All test scenarios pass
- ✅ Background processing runs reliably
- ✅ Message generation produces natural output
- ✅ Integration with existing memory system works
- ✅ UI clearly shows proactive messages

### **User Experience Success Criteria**
- ✅ Follow-ups feel natural and caring
- ✅ Timing feels appropriate for each experience type
- ✅ Users can easily control proactive features
- ✅ Messages add value rather than feeling spammy
- ✅ System learns from user preferences

### **Quantitative Goals**
- **Follow-up delivery rate**: > 95%
- **User engagement**: > 70% of users respond to follow-ups
- **Message quality**: > 4/5 average user rating
- **System reliability**: < 1% error rate

**This completes the proactive conversation system implementation - MAGIS now naturally follows up on user experiences like a caring friend who truly remembers and cares about your life.**