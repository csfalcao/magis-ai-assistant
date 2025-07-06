/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as auth from "../auth.js";
import type * as conversations from "../conversations.js";
import type * as embeddings from "../embeddings.js";
import type * as http from "../http.js";
import type * as memory from "../memory.js";
import type * as memoryConnections from "../memoryConnections.js";
import type * as memoryPipeline from "../memoryPipeline.js";
import type * as profile from "../profile.js";
import type * as profileFromMemory from "../profileFromMemory.js";
import type * as users from "../users.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  conversations: typeof conversations;
  embeddings: typeof embeddings;
  http: typeof http;
  memory: typeof memory;
  memoryConnections: typeof memoryConnections;
  memoryPipeline: typeof memoryPipeline;
  profile: typeof profile;
  profileFromMemory: typeof profileFromMemory;
  users: typeof users;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
