import { Response } from 'express';
import axios from 'axios';
import { Task, TaskDifficulty, TASK_XP } from '../models/Task';
import { AuthRequest } from '../middleware/auth';

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:3001';

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

        const { title, description, difficulty } = req.body;
        if (!title) return res.status(400).json({ success: false, message: 'Title is required' });

        const diff: TaskDifficulty = Object.values(TaskDifficulty).includes(difficulty)
            ? difficulty
            : TaskDifficulty.MEDIUM;

        const task = await Task.create({ userId, title, description, difficulty: diff });
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

        // Only remove tasks completed BEFORE today so today's XP/count stats stay intact
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const result = await Task.deleteMany({
            userId,
            isCompleted: true,
            completedAt: { $lt: todayStart },
        });
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

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const [total, completedToday, xpTodayAgg, pending] = await Promise.all([
            Task.countDocuments({ userId }),
            Task.countDocuments({ userId, isCompleted: true, completedAt: { $gte: today } }),
            Task.aggregate([
                { $match: { userId, isCompleted: true, completedAt: { $gte: today } } },
                { $group: { _id: null, total: { $sum: '$xpEarned' } } },
            ]),
            Task.countDocuments({ userId, isCompleted: false }),
        ]);

        const xpEarnedToday = xpTodayAgg[0]?.total ?? 0;

        return res.json({ success: true, data: { total, completedToday, xpEarnedToday, pending } });
    } catch (err: any) {
        return res.status(500).json({ success: false, message: err.message });
    }
}
