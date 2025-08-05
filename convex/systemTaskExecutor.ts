import { v } from "convex/values";
import { action, mutation, query } from "./_generated/server";
import { api } from "./_generated/api";
import { auth } from "./auth";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";

/**
 * System Task Executor for Three-Tier Intelligence System
 * Executes hidden system tasks for proactive follow-ups
 */

// Get pending system tasks ready for execution
export const getPendingSystemTasks = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error('Not authenticated');
    }

    const limit = args.limit || 10;
    const now = Date.now();

    // Get tasks that are pending and ready to trigger
    const tasks = await ctx.db
      .query('system_tasks')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .filter((q) => 
        q.and(
          q.eq(q.field('status'), 'pending'),
          q.lte(q.field('triggerDate'), now)
        )
      )
      .take(limit);

    return tasks;
  },
});

// Execute a system task
export const executeSystemTask = action({
  args: {
    taskId: v.id('system_tasks'),
  },
  handler: async (ctx, args) => {
    const task = await ctx.runQuery(api.systemTaskExecutor.getSystemTask, {
      taskId: args.taskId,
    });

    if (!task) {
      throw new Error('Task not found');
    }

    if (task.status !== 'pending') {
      console.log(`Task ${args.taskId} already ${task.status}`);
      return { success: false, reason: `Task already ${task.status}` };
    }

    try {
      console.log(`🎯 Executing system task: ${task.description}`);

      let result: any = null;

      switch (task.taskType) {
        case 'proactive_followup':
          result = await executeProactiveFollowup(ctx, task);
          break;
        
        case 'contact_completion':
          result = await executeContactCompletion(ctx, task);
          break;
        
        case 'recurring_reminder':
          result = await executeRecurringReminder(ctx, task);
          break;
        
        default:
          console.error(`Unknown task type: ${task.taskType}`);
          throw new Error(`Unknown task type: ${task.taskType}`);
      }

      // Mark task as executed
      await ctx.runMutation(api.systemTaskExecutor.markTaskExecuted, {
        taskId: args.taskId,
        result: result,
      });

      console.log(`✅ System task executed successfully`);
      return { success: true, result };

    } catch (error) {
      console.error(`❌ System task execution failed:`, error);
      
      // Mark task as failed
      await ctx.runMutation(api.systemTaskExecutor.markTaskFailed, {
        taskId: args.taskId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },
});

// Execute proactive follow-up task
async function executeProactiveFollowup(ctx: any, task: any): Promise<any> {
  const metadata = task.metadata || {};
  const question = metadata.question || generateDefaultFollowUpQuestion(task);

  console.log(`💬 Generating proactive follow-up: ${question}`);

  // Here you would typically:
  // 1. Create a proactive conversation
  // 2. Send a notification to the user
  // 3. Queue the message for delivery

  // For now, we'll just create a proactive message record
  const proactiveMessageId = await ctx.runMutation(api.proactive.createProactiveMessage, {
    experienceId: task.experienceId,
    message: question,
    messageType: 'follow_up',
  });

  return {
    proactiveMessageId,
    message: question,
    timestamp: Date.now(),
  };
}

// Execute contact completion task
async function executeContactCompletion(ctx: any, task: any): Promise<any> {
  const metadata = task.metadata || {};
  
  console.log(`📋 Executing contact completion task`);

  // Generate a natural request for missing information
  const message = metadata.message || "I noticed I don't have complete information about someone you mentioned. Would you like to tell me more?";

  const proactiveMessageId = await ctx.runMutation(api.proactive.createProactiveMessage, {
    contactId: metadata.contactId,
    message: message,
    messageType: 'contact_completion',
  });

  return {
    proactiveMessageId,
    message: message,
    timestamp: Date.now(),
  };
}

// Execute recurring reminder task
async function executeRecurringReminder(ctx: any, task: any): Promise<any> {
  const metadata = task.metadata || {};
  
  console.log(`⏰ Executing recurring reminder`);

  const message = metadata.message || task.description;

  // Create next occurrence if this is recurring
  if (metadata.recurrence) {
    const nextTriggerDate = calculateNextRecurrence(task.triggerDate, metadata.recurrence);
    
    await ctx.runMutation(api.systemTaskExecutor.createSystemTask, {
      userId: task.userId,
      taskType: 'recurring_reminder',
      description: task.description,
      priority: task.priority,
      triggerDate: nextTriggerDate,
      metadata: metadata,
      isHidden: true,
    });
  }

  return {
    message: message,
    timestamp: Date.now(),
    nextOccurrence: metadata.recurrence ? calculateNextRecurrence(task.triggerDate, metadata.recurrence) : null,
  };
}

// Helper functions
function generateDefaultFollowUpQuestion(task: any): string {
  const followUpType = task.metadata?.followUpType || 'general';
  
  const templates = {
    job_transition: "How's everything going with the new role?",
    location_change: "How are you settling into the new place?",
    health_appointment: "How did your appointment go?",
    social_event: "How was it? Did you enjoy yourself?",
    general: "How did that go?",
  };

  return templates[followUpType as keyof typeof templates] || templates.general;
}

function calculateNextRecurrence(currentDate: number, recurrence: string): number {
  const date = new Date(currentDate);
  
  switch (recurrence) {
    case 'daily':
      date.setDate(date.getDate() + 1);
      break;
    case 'weekly':
      date.setDate(date.getDate() + 7);
      break;
    case 'monthly':
      date.setMonth(date.getMonth() + 1);
      break;
    case 'yearly':
      date.setFullYear(date.getFullYear() + 1);
      break;
    default:
      // No recurrence
      return 0;
  }
  
  return date.getTime();
}

// Mutations for task management
export const createSystemTask = mutation({
  args: {
    userId: v.id('users'),
    experienceId: v.optional(v.id('experiences')),
    taskType: v.string(),
    description: v.string(),
    priority: v.string(),
    triggerDate: v.number(),
    metadata: v.optional(v.any()),
    isHidden: v.boolean(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert('system_tasks', {
      ...args,
      status: 'pending',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const markTaskExecuted = mutation({
  args: {
    taskId: v.id('system_tasks'),
    result: v.any(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.taskId, {
      status: 'executed',
      executedAt: Date.now(),
      updatedAt: Date.now(),
      metadata: args.result,
    });
  },
});

export const markTaskFailed = mutation({
  args: {
    taskId: v.id('system_tasks'),
    error: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.taskId, {
      status: 'failed',
      executedAt: Date.now(),
      updatedAt: Date.now(),
      metadata: { error: args.error },
    });
  },
});

export const getSystemTask = query({
  args: { taskId: v.id('system_tasks') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.taskId);
  },
});

// Scheduled function to process pending tasks
export const processScheduledTasks = action({
  args: {},
  handler: async (ctx) => {
    console.log('🔄 Processing scheduled system tasks...');
    
    // This would typically be called by a cron job or scheduled function
    // For now, it can be called manually or from the frontend
    
    // Get all users with pending tasks
    const pendingTasks = await ctx.runQuery(api.systemTaskExecutor.getAllPendingTasks, {});
    
    console.log(`Found ${pendingTasks.length} pending tasks`);
    
    const results = [];
    for (const task of pendingTasks) {
      const result = await ctx.runAction(api.systemTaskExecutor.executeSystemTask, {
        taskId: task._id,
      });
      results.push({ taskId: task._id, ...result });
    }
    
    console.log(`✅ Processed ${results.length} tasks`);
    return results;
  },
});

// Get all pending tasks (admin function)
export const getAllPendingTasks = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    
    // Get tasks that are pending and ready to trigger
    const tasks = await ctx.db
      .query('system_tasks')
      .filter((q) => 
        q.and(
          q.eq(q.field('status'), 'pending'),
          q.lte(q.field('triggerDate'), now)
        )
      )
      .collect();

    return tasks;
  },
});