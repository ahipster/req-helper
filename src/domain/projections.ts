import { z } from "zod";
import { TaskStatus, TaskType } from "./schemas.js";

/**
 * Read-optimized projection for the current user's My Work screen.
 * The authoritative Task remains under its Delivery Subject. Backend services
 * update this projection when task assignment/status changes.
 */
export const InboxTaskProjectionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  deliverySubjectId: z.string(),
  taskId: z.string(),
  taskType: TaskType,
  taskStatus: TaskStatus,
  title: z.string(),
  perspectiveId: z.string().optional(),
  blocking: z.boolean(),
  deliverySubjectTitle: z.string(),
  deliverySubjectRevision: z.number().int().nonnegative(),
  updatedAt: z.string(),
});

export type InboxTaskProjection = z.infer<typeof InboxTaskProjectionSchema>;
