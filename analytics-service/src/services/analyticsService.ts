import axios from 'axios';

const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:3001';
const HABIT_SERVICE_URL = process.env.HABIT_SERVICE_URL || 'http://localhost:3002';

/**
 * Get user dashboard data
 */
export async function getUserDashboard(userId: string, token: string) {
    try {
        // Fetch user profile from user-service
        const userResponse = await axios.get(`${USER_SERVICE_URL}/api/users/profile`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const user = userResponse.data.data;

        // Fetch habits from habit-service
        const habitsResponse = await axios.get(`${HABIT_SERVICE_URL}/api/habits`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const habits = habitsResponse.data.data;

        // Calculate statistics
        const totalHabits = habits.length;
        const activeHabits = habits.filter((h: any) => h.isActive !== false).length;

        // Get habit stats for each habit
        const habitStatsPromises = habits.map((habit: any) =>
            axios.get(`${HABIT_SERVICE_URL}/api/gamification/${habit._id}/stats`, {
                headers: { 'Authorization': `Bearer ${token}` }
            }).catch(() => null)
        );

        const habitStatsResponses = await Promise.all(habitStatsPromises);
        const habitStats = habitStatsResponses
            .filter(r => r !== null)
            .map(r => r!.data.data);

        // Calculate aggregates
        const totalCompletions = habitStats.reduce((sum, stat) => sum + (stat.totalCompletions || 0), 0);
        const currentStreak = Math.max(...habitStats.map(s => s.currentStreak || 0), 0);
        const longestStreak = Math.max(...habitStats.map(s => s.longestStreak || 0), 0);

        // Calculate completion rate (last 7 days)
        const completionRate = totalHabits > 0
            ? (totalCompletions / (totalHabits * 7)) * 100
            : 0;

        return {
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                mode: user.mode,
                xp: user.xp,
                level: user.level
            },
            stats: {
                totalHabits,
                activeHabits,
                totalCompletions,
                completionRate: Math.min(completionRate, 100).toFixed(1),
                currentStreak,
                longestStreak
            },
            habits: habits.map((habit: any, index: number) => ({
                ...habit,
                stats: habitStats[index] || {}
            }))
        };
    } catch (error: any) {
        throw new Error(`Failed to fetch dashboard data: ${error.message}`);
    }
}

/**
 * Get habit trends
 */
export async function getHabitTrends(userId: string, token: string, period: 'DAILY' | 'WEEKLY' | 'MONTHLY' = 'WEEKLY') {
    try {
        // Fetch habits
        const habitsResponse = await axios.get(`${HABIT_SERVICE_URL}/api/habits`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const habits = habitsResponse.data.data;

        // Get logs for each habit
        const logsPromises = habits.map((habit: any) =>
            axios.get(`${HABIT_SERVICE_URL}/api/gamification/${habit._id}/logs`, {
                headers: { 'Authorization': `Bearer ${token}` }
            }).catch(() => ({ data: { data: [] } }))
        );

        const logsResponses = await Promise.all(logsPromises);

        // Process trends
        const trends = habits.map((habit: any, index: number) => {
            const logs = logsResponses[index].data.data;

            // Group by period
            const groupedLogs = groupLogsByPeriod(logs, period);

            return {
                habitId: habit._id,
                habitName: habit.name,
                category: habit.category,
                period,
                data: groupedLogs
            };
        });

        return trends;
    } catch (error: any) {
        throw new Error(`Failed to fetch trends: ${error.message}`);
    }
}

/**
 * Group logs by time period
 */
function groupLogsByPeriod(logs: any[], period: string) {
    const grouped: { [key: string]: number } = {};

    logs.forEach(log => {
        const date = new Date(log.completedAt);
        let key: string;

        if (period === 'DAILY') {
            key = date.toISOString().split('T')[0];
        } else if (period === 'WEEKLY') {
            const weekStart = new Date(date);
            weekStart.setDate(date.getDate() - date.getDay());
            key = weekStart.toISOString().split('T')[0];
        } else {
            key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        }

        grouped[key] = (grouped[key] || 0) + 1;
    });

    return Object.entries(grouped).map(([date, count]) => ({
        date,
        completions: count
    })).sort((a, b) => a.date.localeCompare(b.date));
}
