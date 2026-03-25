import { Response } from 'express';
import axios from 'axios';
import { Task, TaskDifficulty, TASK_XP } from '../models/Task';
import { DailyTaskStats } from '../models/DailyTaskStats';
import { AuthRequest } from '../middleware/auth';

const USER_SERVICE_URL = process.env.USER_SERVICE_URL as string;

// ── GET /api/tasks ──────────────────────────────────────────────
export async function getTasks(req: AuthRequest, res: Response) {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

        const tasks = await Task.find({ userId }).sort({ createdAt: -1 });
        return res.json({ success: true, data: tasks });
    } catch (err: any) {
        return res.status(500).json({ success: false, message: err.message });
    }
}

// ── POST /api/tasks ─────────────────────────────────────────────
export async function createTask(req: AuthRequest, res: Response) {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

        const { title, description, difficulty, priority, deadline, reminder, reminderAt } = req.body;
        if (!title) return res.status(400).json({ success: false, message: 'Title is required' });

        const diff: TaskDifficulty = Object.values(TaskDifficulty).includes(difficulty)
            ? difficulty
            : TaskDifficulty.MEDIUM;

        const task = await Task.create({
            userId, title, description, difficulty: diff,
            priority: priority || undefined,
            deadline: deadline ? new Date(deadline) : undefined,
            reminder: reminder ?? false,
            reminderAt: reminder && reminderAt ? new Date(reminderAt) : undefined,
        });
        return res.status(201).json({ success: true, data: task });
    } catch (err: any) {
        return res.status(400).json({ success: false, message: err.message });
    }
}


// ── POST /api/tasks/:taskId/complete ────────────────────────────
export async function completeTask(req: AuthRequest, res: Response) {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

        const { taskId } = req.params;
        const task = await Task.findOne({ _id: taskId, userId });
        if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
        if (task.isCompleted) return res.status(400).json({ success: false, message: 'Task already completed' });

        const xpEarned = TASK_XP[task.difficulty] ?? 10;
        task.isCompleted = true;
        task.completedAt = new Date();
        task.xpEarned = xpEarned;
        await task.save();

        // Persist daily stats (so they survive after task is cleared)
        const dateStr = new Date().toISOString().slice(0, 10);
        await DailyTaskStats.findOneAndUpdate(
            { userId, dateStr },
            { $inc: { completedCount: 1, xpEarned: xpEarned } },
            { upsert: true, new: true }
        );

        // Award XP to user via user-service (fire & forget, don't fail if service unavailable)
        try {
            await axios.put(
                `${USER_SERVICE_URL}/api/users/${userId}/xp`,
                { xpToAdd: xpEarned },
                { timeout: 5000 }
            );
        } catch (xpErr: any) {
            console.warn('[task-service] Failed to award XP:', xpErr.message);
        }

        return res.json({ success: true, data: { task, xpEarned } });
    } catch (err: any) {
        return res.status(500).json({ success: false, message: err.message });
    }
}

// ── DELETE /api/tasks/:taskId ───────────────────────────────────
export async function deleteTask(req: AuthRequest, res: Response) {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

        const { taskId } = req.params;
        const task = await Task.findOneAndDelete({ _id: taskId, userId });
        if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

        return res.json({ success: true, message: 'Task deleted' });
    } catch (err: any) {
        return res.status(500).json({ success: false, message: err.message });
    }
}

// ── DELETE /api/tasks/completed ──────────────────────────────────
export async function clearCompletedTasks(req: AuthRequest, res: Response) {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

        const result = await Task.deleteMany({ userId, isCompleted: true });
        return res.json({
            success: true,
            message: `Cleared ${result.deletedCount} completed task(s)`,
            deletedCount: result.deletedCount,
        });
    } catch (err: any) {
        return res.status(500).json({ success: false, message: err.message });
    }
}


// ── GET /api/tasks/stats ─────────────────────────────────────────
export async function getTaskStats(req: AuthRequest, res: Response) {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

        const dateStr = new Date().toISOString().slice(0, 10);

        const [total, pending, dailyStats] = await Promise.all([
            Task.countDocuments({ userId }),
            Task.countDocuments({ userId, isCompleted: false }),
            DailyTaskStats.findOne({ userId, dateStr }),
        ]);

        return res.json({
            success: true,
            data: {
                total,
                pending,
                completedToday: dailyStats?.completedCount ?? 0,
                xpEarnedToday: dailyStats?.xpEarned ?? 0,
            },
        });
    } catch (err: any) {
        return res.status(500).json({ success: false, message: err.message });
    }
}

// ── PUT /api/tasks/:taskId ───────────────────────────────────────
export async function updateTask(req: AuthRequest, res: Response) {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

        const { taskId } = req.params;
        const task = await Task.findOne({ _id: taskId, userId });
        if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
        if (task.isCompleted) return res.status(400).json({ success: false, message: 'Cannot edit a completed task' });

        const { title, description, difficulty, priority, deadline, reminder, reminderAt } = req.body;

        if (title !== undefined) {
            if (!title.trim()) return res.status(400).json({ success: false, message: 'Title cannot be empty' });
            task.title = title.trim();
        }
        if (description !== undefined) task.description = description.trim() || undefined;
        if (difficulty !== undefined && Object.values(TaskDifficulty).includes(difficulty)) task.difficulty = difficulty;
        if (priority !== undefined) task.priority = priority || undefined;
        if (deadline !== undefined) task.deadline = deadline ? new Date(deadline) : undefined;
        if (reminder !== undefined) task.reminder = reminder;
        if (reminderAt !== undefined) task.reminderAt = reminderAt ? new Date(reminderAt) : undefined;

        // If reminder is set but no deadline, clear both
        if (!task.deadline) { task.reminder = false; task.reminderAt = undefined; }

        await task.save();
        return res.json({ success: true, data: task });
    } catch (err: any) {
        return res.status(400).json({ success: false, message: err.message });
    }
}

