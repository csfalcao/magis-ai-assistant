# MAGIS Proactive Conversations System

## 🗣️ **Proactive Intelligence Overview**

The Proactive Conversations system is what transforms MAGIS from a reactive chatbot into a genuinely caring personal assistant. Instead of waiting for users to ask questions, MAGIS proactively follows up on experiences, checks in on users, and builds authentic relationships through natural conversation timing.

### **What Makes This Revolutionary**
- **Natural Timing**: Follows up at psychologically appropriate moments
- **Conversational Intelligence**: Asks "How did it go?" instead of "Rate 1-5"
- **Emotional Intelligence**: Adapts tone and response based on user's emotional state
- **Cross-Context Learning**: Applies insights from one experience to future recommendations
- **Relationship Building**: Creates genuine connection through consistent care

## 🎯 **Experience Tracking System**

### **Experience Types & Timing**
```typescript
// Different experiences need different follow-up timing
const FOLLOW_UP_TIMING = {
  // Medical/Health
  'dentist_appointment': 4 * HOURS,        // Same day, evening
  'doctor_appointment': 4 * HOURS,         // Same day, important health
  'therapy_session': 24 * HOURS,          // Next day, give processing time
  'medical_procedure': 48 * HOURS,        // 2 days, recovery time
  
  // Food & Dining
  'restaurant_dinner': 18 * HOURS,        // Next morning
  'restaurant_lunch': 6 * HOURS,          // Same day evening
  'food_delivery': 2 * HOURS,             // Quick feedback
  'special_occasion_meal': 24 * HOURS,    // Next day reflection
  
  // Entertainment & Events
  'movie': 3 * HOURS,                     // Right after
  'concert': 24 * HOURS,                  // Next day
  'theater_show': 4 * HOURS,              // Same evening
  'sports_event': 2 * HOURS,              // Right after game
  
  // Services & Appointments
  'haircut': 24 * HOURS,                  // Next day to see if they like it
  'car_service': 4 * HOURS,               // Same day
  'home_service': 24 * HOURS,             // Next day
  'shopping': 48 * HOURS,                 // Few days later
  
  // Travel
  'flight': 2 * HOURS,                    // After landing
  'hotel_checkin': 24 * HOURS,            // After first night
  'vacation_end': 48 * HOURS,             // After settling back
  
  // Work & Professional
  'important_meeting': 2 * HOURS,         // Same day
  'job_interview': 4 * HOURS,             // Same day
  'presentation': 1 * HOURS,              // Quick feedback
  'conference': 24 * HOURS,               // Next day reflection
  
  // Personal & Social
  'first_date': 24 * HOURS,               // Next day
  'family_gathering': 12 * HOURS,        // Same day evening
  'friend_meetup': 6 * HOURS,             // Later same day
  'workout_class': 3 * HOURS,             // Post-workout
};
```

### **Experience Tracking Schema**
```typescript
// convex/schema.ts - Experience tracking
experienceTracking: defineTable({
  userId: v.id('users'),
  type: v.string(),                       // 'dentist_appointment', 'restaurant', etc.
  title: v.string(),                      // "Dentist appointment with Dr. Mary"
  provider: v.optional(v.string()),       // "Dr. Mary Johnson", "Tony's Pizza"
  location: v.optional(v.string()),       // "Downtown Dental", "123 Main St"
  scheduledTime: v.number(),
  completedTime: v.optional(v.number()),
  status: v.union(
    v.literal('scheduled'),
    v.literal('completed'),
    v.literal('cancelled'),
    v.literal('no_show')
  ),
  followUpScheduled: v.optional(v.number()),
  followUpCompleted: v.optional(v.boolean()),
  context: v.string(),                    // work, personal, family
  
  // Natural review from conversation
  naturalReview: v.optional(v.object({
    conversationId: v.id('conversations'),
    userResponse: v.string(),             // User's natural response
    extractedInsights: v.object({
      overallSentiment: v.string(),       // positive, negative, neutral, mixed
      rating: v.optional(v.number()),     // 1-5 if naturally mentioned
      recommendation: v.optional(v.boolean()), // Would recommend?
      highlights: v.array(v.string()),    // What they liked
      issues: v.array(v.string()),        // What they didn't like
      specificFeedback: v.array(v.string()), // Detailed comments
      emotionalTone: v.string(),          // excited, disappointed, satisfied, etc.
    }),
    generatedReview: v.string(),          // AI-generated review summary
    timestamp: v.number(),
    followUpConversation: v.optional(v.array(v.object({
      question: v.string(),
      answer: v.string(),
      timestamp: v.number(),
    }))),
  })),
  
  // Provider/service metadata
  providerInfo: v.optional(v.object({
    name: v.string(),
    type: v.string(),                     // restaurant, medical, service, etc.
    location: v.string(),
    phone: v.optional(v.string()),
    website: v.optional(v.string()),
    averageRating: v.optional(v.number()),
    priceRange: v.optional(v.string()),
  })),
})
.index('by_user', ['userId'])
.index('by_user_status', ['userId', 'status'])
.index('by_follow_up_time', ['followUpScheduled'])
.index('by_provider', ['provider']);
```

## 💬 **Natural Conversation Generation**

### **Context-Aware Follow-Up Templates**
```typescript
// convex/proactiveGeneration.ts
const CONVERSATION_TEMPLATES = {
  // Dental appointments
  dentist_positive: [
    "Hey! How did your dentist appointment go? Hope Dr. {provider} took good care of you! 🦷",
    "Just thinking about you - how was your visit with {provider}? Everything go smoothly?",
    "Hope your dentist appointment went well! {provider} seemed to have great reviews. How was your experience?"
  ],
  
  dentist_followup: [
    "Glad the cleaning went well! Did {provider} mention when you should come back?",
    "That's great that it didn't hurt! Some dentists have such a gentle touch. Any follow-up needed?",
    "Love finding a good dentist! Did they give you any recommendations for at-home care?"
  ],

  // Restaurant experiences  
  restaurant_casual: [
    "So... how was dinner at {provider} last night? Worth the trip? 🍕",
    "Hope you enjoyed your meal at {provider}! Would you go back?",
    "How was the food at {provider}? I'm always curious about new spots!"
  ],
  
  restaurant_special: [
    "How was your special dinner at {provider}? Hope it was as amazing as you hoped! ✨",
    "Did {provider} make your {occasion} memorable? Those special nights deserve perfect restaurants!",
    "Hope your celebration dinner was incredible! How was {provider}?"
  ],

  // Medical appointments
  doctor_checkup: [
    "How did your doctor's appointment go? Hope everything checked out okay! 🏥",
    "Thinking about you - how was your visit with {provider}? Got the answers you needed?",
    "Hope your appointment went smoothly! How are you feeling about everything?"
  ],
  
  doctor_concerned: [
    "How did your appointment go today? I know you were a bit worried about it.",
    "Hope your visit with {provider} went well and put your mind at ease.",
    "Thinking of you after your appointment. How did everything go?"
  ],

  // Service appointments
  haircut_excited: [
    "Ooh, how's the new haircut? Hope you love what {provider} did! ✂️",
    "Just saw it's been a day since your hair appointment - are you happy with how it turned out?",
    "How did the haircut go? Sometimes it takes a day or two to decide if we love it, right? 😄"
  ],
  
  service_repair: [
    "How did the {service_type} go? Hope {provider} got everything sorted out!",
    "Did {provider} take care of the {issue}? These service calls can be hit or miss.",
    "Hope your {service_type} appointment went smoothly! Everything working properly now?"
  ],

  // Events and entertainment
  concert_excited: [
    "How was the concert?! Hope {artist} was incredible live! 🎵",
    "Did you have an amazing time at the {event}? I love hearing about great shows!",
    "Hope the concert was everything you hoped for! How was {venue}?"
  ],
  
  movie_casual: [
    "How was {movie_title}? Worth seeing or should I skip it? 🎬",
    "Did you enjoy the movie? I've been curious about {movie_title}!",
    "Movie night! How was {movie_title}? Good choice or meh?"
  ],

  // Work events
  meeting_important: [
    "How did the big meeting go? Hope the presentation landed well!",
    "Did the client meeting go as planned? These important ones can be nerve-wracking!",
    "Hope your meeting with {client} went smoothly! Good outcome?"
  ],
  
  interview: [
    "How did the interview go? Hope you felt good about it!",
    "Did the interview at {company} go well? These things can be so stressful!",
    "Hope your interview went great! How was the team you met?"
  ],

  // Travel experiences  
  flight_arrival: [
    "Hope you landed safely! How was the flight?",
    "Did your flight go smoothly? Travel days can be such a mixed bag!",
    "Hope you made it to {destination} without any drama! How was {airline}?"
  ],
  
  hotel_checkin: [
    "How's the hotel? Hope {hotel_name} is treating you well!",
    "Did you get settled in okay? How's your room at {hotel_name}?",
    "Hope you're enjoying {destination}! How's the hotel situation?"
  ]
};

export const generateNaturalFollowUp = action({
  args: {
    experienceId: v.id('experienceTracking'),
  },
  handler: async (ctx, args) => {
    const experience = await ctx.db.get(args.experienceId);
    if (!experience) return null;

    // Select appropriate template based on experience details
    const template = selectConversationTemplate(experience);
    
    // Personalize the template
    const personalizedMessage = personalizeTemplate(template, experience);
    
    // Add contextual emoji and tone
    const finalMessage = addContextualTone(personalizedMessage, experience);
    
    return finalMessage;
  },
});

function selectConversationTemplate(experience: any): string {
  const { type, context, title, providerInfo } = experience;
  
  // Determine emotional context
  const isSpecialOccasion = title.toLowerCase().includes('birthday') || 
                           title.toLowerCase().includes('anniversary') ||
                           title.toLowerCase().includes('celebration');
  
  const isFirstTime = title.toLowerCase().includes('first') ||
                     title.toLowerCase().includes('new');
  
  const isImportant = title.toLowerCase().includes('important') ||
                     context === 'work' && type.includes('meeting');

  // Select template category
  let templateKey = type;
  
  if (type.includes('restaurant')) {
    templateKey = isSpecialOccasion ? 'restaurant_special' : 'restaurant_casual';
  } else if (type.includes('doctor')) {
    templateKey = isImportant ? 'doctor_concerned' : 'doctor_checkup';
  } else if (type.includes('haircut')) {
    templateKey = 'haircut_excited';
  } else if (type.includes('meeting')) {
    templateKey = isImportant ? 'meeting_important' : 'meeting_casual';
  }
  
  // Get templates for this category
  const templates = CONVERSATION_TEMPLATES[templateKey] || CONVERSATION_TEMPLATES.generic;
  
  // Randomly select a template
  return templates[Math.floor(Math.random() * templates.length)];
}

function personalizeTemplate(template: string, experience: any): string {
  return template
    .replace('{provider}', experience.provider || 'your provider')
    .replace('{location}', experience.location || 'the location')
    .replace('{service_type}', extractServiceType(experience.type))
    .replace('{artist}', extractArtistName(experience.title))
    .replace('{event}', experience.title)
    .replace('{movie_title}', extractMovieTitle(experience.title))
    .replace('{client}', extractClientName(experience.title))
    .replace('{company}', extractCompanyName(experience.title))
    .replace('{destination}', extractDestination(experience.title))
    .replace('{hotel_name}', experience.provider || 'your hotel')
    .replace('{airline}', extractAirline(experience.title))
    .replace('{occasion}', extractOccasion(experience.title));
}

function addContextualTone(message: string, experience: any): string {
  const { context, type } = experience;
  
  // Add context-appropriate sign-offs
  if (context === 'work') {
    // More professional tone
    return message.replace('Hope you', 'I hope you').replace('!', '.');
  } else if (context === 'family') {
    // Warmer, more caring tone
    if (!message.includes('❤️') && !message.includes('🤗')) {
      return message + ' ❤️';
    }
  }
  
  return message;
}

// Helper functions for template personalization
function extractServiceType(type: string): string {
  if (type.includes('car')) return 'car service';
  if (type.includes('home')) return 'home repair';
  if (type.includes('tech')) return 'tech support';
  return 'service appointment';
}

function extractArtistName(title: string): string {
  // Extract artist name from concert titles
  const match = title.match(/concert[:\s]+(.+)/i) || title.match(/(.+)\s+concert/i);
  return match ? match[1].trim() : 'the artist';
}

function extractMovieTitle(title: string): string {
  const match = title.match(/movie[:\s]+(.+)/i) || title.match(/(.+)\s+movie/i);
  return match ? match[1].trim() : 'the movie';
}
```

## 🧠 **Conversation Intelligence & Insight Extraction**

### **Natural Language Analysis**
```typescript
// convex/conversationAnalysis.ts
export const analyzeFollowUpResponse = action({
  args: {
    experienceId: v.id('experienceTracking'),
    userResponse: v.string(),
    conversationHistory: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    // Extract insights from natural conversation
    const insights = await extractConversationalInsights(
      args.userResponse,
      args.conversationHistory
    );
    
    // Store the natural review
    await ctx.runMutation(internal.proactive.updateExperienceReview, {
      experienceId: args.experienceId,
      naturalReview: {
        userResponse: args.userResponse,
        extractedInsights: insights,
        generatedReview: await generateReviewSummary(insights, args.userResponse),
        timestamp: Date.now(),
      }
    });
    
    // Generate contextual follow-up
    const followUpResponse = await generateContextualResponse(insights, args.userResponse);
    
    // Learn from this experience for future recommendations
    await updateProviderReputation(ctx, args.experienceId, insights);
    
    return {
      insights,
      followUpResponse,
      shouldContinueConversation: shouldAskFollowUpQuestions(insights),
    };
  },
});

async function extractConversationalInsights(userResponse: string, history: string[]) {
  const analysisPrompt = `
Analyze this natural conversation about a user's experience. Extract structured insights:

User's response: "${userResponse}"
Previous context: ${history.join(' ')}

Extract and return JSON:
{
  "overallSentiment": "positive|negative|neutral|mixed",
  "emotionalTone": "excited|satisfied|disappointed|frustrated|neutral|happy|angry",
  "rating": number|null (1-5 if naturally mentioned),
  "recommendation": boolean|null (would they recommend?),
  "highlights": ["positive aspect 1", "positive aspect 2"],
  "issues": ["problem 1", "problem 2"],
  "specificFeedback": ["detailed comment 1", "detailed comment 2"],
  "valueDrivers": ["what they cared most about"],
  "surpriseFactors": ["unexpected good/bad elements"],
  "comparisonMentions": ["if they compared to other experiences"],
  "futureIntent": "will_return|avoid|unsure|conditional",
  "keyQuotes": ["memorable quotes from their response"]
}

Focus on nuanced understanding, not just positive/negative.
`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4-turbo',
    messages: [
      { 
        role: 'system', 
        content: 'You are an expert at analyzing customer feedback and extracting nuanced insights from natural conversation.' 
      },
      { role: 'user', content: analysisPrompt }
    ],
    temperature: 0.1,
    max_tokens: 800,
  });

  try {
    return JSON.parse(response.choices[0].message.content || '{}');
  } catch (error) {
    console.error('Failed to parse conversation insights:', error);
    return getDefaultInsights();
  }
}

async function generateContextualResponse(insights: any, originalResponse: string): Promise<string> {
  const responsePrompt = `
Based on this analysis of a user's experience, generate a natural, empathetic follow-up response:

Sentiment: ${insights.overallSentiment}
Emotional tone: ${insights.emotionalTone}
Highlights: ${insights.highlights.join(', ')}
Issues: ${insights.issues.join(', ')}
User's original response: "${originalResponse}"

Generate a response that:
1. Acknowledges their experience appropriately
2. Shows genuine interest and empathy
3. Responds to their emotional tone
4. Asks relevant follow-up questions if appropriate
5. Offers help if they had problems
6. Sounds natural and conversational

Avoid:
- Robotic or formal language
- Immediately jumping to ratings or surveys
- Generic responses that don't match their tone
- Overwhelming them with questions

Response style should match their emotional state:
- Excited → enthusiastic and celebratory
- Disappointed → empathetic and supportive
- Satisfied → warm and affirming
- Frustrated → understanding and helpful
`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4-turbo',
    messages: [
      { 
        role: 'system', 
        content: 'You are MAGIS, a caring personal AI assistant. Respond naturally and empathetically.' 
      },
      { role: 'user', content: responsePrompt }
    ],
    temperature: 0.7,
    max_tokens: 200,
  });

  return response.choices[0].message.content || 'Thanks for letting me know how it went!';
}

function shouldAskFollowUpQuestions(insights: any): boolean {
  // Continue conversation if:
  // - They had issues (offer help)
  // - They were very positive (get more details)
  // - They made comparisons (learn preferences)
  // - Their response was brief (get more context)
  
  return (
    insights.issues.length > 0 ||
    insights.overallSentiment === 'very_positive' ||
    insights.comparisonMentions.length > 0 ||
    insights.specificFeedback.length < 2
  );
}

async function updateProviderReputation(ctx: any, experienceId: string, insights: any) {
  const experience = await ctx.db.get(experienceId);
  if (!experience || !experience.provider) return;

  // Update provider reputation in user's personal database
  await ctx.runMutation(internal.providers.updateProviderRating, {
    userId: experience.userId,
    providerName: experience.provider,
    type: experience.type,
    insights: {
      sentiment: insights.overallSentiment,
      rating: insights.rating,
      recommendation: insights.recommendation,
      highlights: insights.highlights,
      issues: insights.issues,
      timestamp: Date.now(),
    }
  });
}
```

## ⏰ **Smart Timing & Scheduling System**

### **Proactive Conversation Scheduler**
```typescript
// convex/proactiveScheduling.ts
export const scheduleProactiveFollowUps = action({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    
    // Find experiences ready for follow-up
    const readyExperiences = await ctx.runQuery(internal.proactive.getReadyForFollowUp, {
      currentTime: now
    });
    
    for (const experience of readyExperiences) {
      await initiateProactiveConversation(ctx, experience);
    }
    
    // Schedule next check
    await ctx.scheduler.runAfter(15 * 60 * 1000, internal.proactive.scheduleProactiveFollowUps, {});
  },
});

async function initiateProactiveConversation(ctx: any, experience: any) {
  // Generate natural follow-up message
  const followUpMessage = await ctx.runAction(internal.proactive.generateNaturalFollowUp, {
    experienceId: experience._id
  });
  
  if (!followUpMessage) return;

  // Find or create appropriate conversation
  const conversationId = await findBestConversationForFollowUp(ctx, experience);
  
  // Send proactive message
  await ctx.runMutation(internal.conversations.addMessage, {
    conversationId,
    content: followUpMessage,
    role: 'assistant',
    metadata: {
      type: 'proactive_follow_up',
      experienceId: experience._id,
      timing: 'scheduled',
      timestamp: Date.now(),
    }
  });
  
  // Mark follow-up as sent
  await ctx.runMutation(internal.proactive.markFollowUpSent, {
    experienceId: experience._id,
    conversationId
  });
  
  // Notify user (push notification, email, etc.)
  await sendProactiveNotification(ctx, experience.userId, followUpMessage);
}

async function findBestConversationForFollowUp(ctx: any, experience: any): Promise<string> {
  // Look for recent conversation in the same context
  const recentConversations = await ctx.runQuery(internal.conversations.getRecentByContext, {
    userId: experience.userId,
    context: experience.context,
    limit: 3,
    maxAge: 24 * 60 * 60 * 1000 // Last 24 hours
  });

  if (recentConversations.length > 0) {
    // Use the most recent conversation
    return recentConversations[0]._id;
  }

  // Create new conversation for this follow-up
  return await ctx.runMutation(internal.conversations.create, {
    userId: experience.userId,
    title: `Follow-up: ${experience.title}`,
    context: experience.context
  });
}

// Intelligent timing based on experience type and user patterns
export const calculateOptimalFollowUpTime = (experience: any, userPreferences: any): number => {
  const baseDelay = FOLLOW_UP_TIMING[experience.type] || (6 * HOURS);
  
  // Adjust based on user patterns
  let adjustedDelay = baseDelay;
  
  // Time of day preferences
  if (userPreferences.preferredContactTimes) {
    const preferredHour = userPreferences.preferredContactTimes.evening || 18;
    const scheduleTime = new Date(experience.completedTime + baseDelay);
    scheduleTime.setHours(preferredHour, 0, 0, 0);
    
    // If that time has passed, schedule for next preferred time
    if (scheduleTime.getTime() < Date.now()) {
      scheduleTime.setDate(scheduleTime.getDate() + 1);
    }
    
    adjustedDelay = scheduleTime.getTime() - experience.completedTime;
  }
  
  // Context-based adjustments
  if (experience.context === 'work') {
    // Avoid weekends for work follow-ups
    const followUpDate = new Date(experience.completedTime + adjustedDelay);
    if (followUpDate.getDay() === 0 || followUpDate.getDay() === 6) {
      // Move to Monday
      followUpDate.setDate(followUpDate.getDate() + (8 - followUpDate.getDay()));
      adjustedDelay = followUpDate.getTime() - experience.completedTime;
    }
  }
  
  // Don't follow up too late at night or too early
  const followUpTime = new Date(experience.completedTime + adjustedDelay);
  const hour = followUpTime.getHours();
  
  if (hour < 8) {
    followUpTime.setHours(9, 0, 0, 0);
    adjustedDelay = followUpTime.getTime() - experience.completedTime;
  } else if (hour > 22) {
    followUpTime.setDate(followUpTime.getDate() + 1);
    followUpTime.setHours(9, 0, 0, 0);
    adjustedDelay = followUpTime.getTime() - experience.completedTime;
  }
  
  return adjustedDelay;
};
```

## 📱 **Notification & Delivery System**

### **Multi-Channel Proactive Delivery**
```typescript
// convex/proactiveNotifications.ts
export const sendProactiveNotification = action({
  args: {
    userId: v.id('users'),
    message: v.string(),
    experienceId: v.id('experienceTracking'),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return;

    const notificationPrefs = user.preferences.notifications || {};
    
    // Send via preferred channels
    if (notificationPrefs.pushNotifications !== false) {
      await sendPushNotification(args.userId, args.message);
    }
    
    if (notificationPrefs.email && notificationPrefs.emailFollowUps) {
      await sendEmailNotification(user.email, args.message);
    }
    
    // Always ensure it appears in the chat interface
    await markConversationAsUnread(ctx, args.userId);
  },
});

async function sendPushNotification(userId: string, message: string) {
  // Integration with push notification service
  // This would use service like Firebase Cloud Messaging, OneSignal, etc.
  console.log(`Push notification to ${userId}: ${message}`);
}

async function sendEmailNotification(email: string, message: string) {
  // Integration with email service
  // This would use service like SendGrid, Mailgun, etc.
  console.log(`Email to ${email}: ${message}`);
}
```

## 📊 **Learning & Optimization**

### **Conversation Pattern Analysis**
```typescript
// convex/proactiveLearning.ts
export const analyzeConversationPatterns = action({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    // Analyze user's response patterns to optimize timing
    const followUpHistory = await ctx.runQuery(internal.proactive.getFollowUpHistory, {
      userId: args.userId,
      limit: 50
    });
    
    const patterns = {
      responseRate: calculateResponseRate(followUpHistory),
      averageResponseTime: calculateAverageResponseTime(followUpHistory),
      preferredTimes: identifyPreferredTimes(followUpHistory),
      engagementByType: analyzeEngagementByType(followUpHistory),
      sentimentPatterns: analyzeSentimentPatterns(followUpHistory),
    };
    
    // Update user preferences based on patterns
    await ctx.runMutation(internal.users.updateProactivePreferences, {
      userId: args.userId,
      patterns
    });
    
    return patterns;
  },
});

function calculateResponseRate(history: any[]): number {
  const responded = history.filter(h => h.naturalReview !== null).length;
  return history.length > 0 ? responded / history.length : 0;
}

function identifyPreferredTimes(history: any[]): any {
  const responseTimes = history
    .filter(h => h.naturalReview)
    .map(h => {
      const followUpTime = new Date(h.followUpScheduled);
      const responseTime = new Date(h.naturalReview.timestamp);
      return {
        hour: followUpTime.getHours(),
        responseDelay: responseTime.getTime() - followUpTime.getTime(),
      };
    });
    
  // Find times with fastest responses
  const hourlyStats = responseTimes.reduce((acc, time) => {
    const hour = time.hour;
    if (!acc[hour]) acc[hour] = [];
    acc[hour].push(time.responseDelay);
    return acc;
  }, {} as any);
  
  const preferredHours = Object.entries(hourlyStats)
    .map(([hour, delays]: [string, number[]]) => ({
      hour: parseInt(hour),
      avgDelay: delays.reduce((a, b) => a + b, 0) / delays.length,
      count: delays.length,
    }))
    .sort((a, b) => a.avgDelay - b.avgDelay)
    .slice(0, 3)
    .map(h => h.hour);
    
  return preferredHours;
}
```

This proactive conversation system transforms MAGIS from a reactive tool into a genuinely caring companion that remembers to check in, learns from every interaction, and builds authentic relationships over time! 🗣️💝