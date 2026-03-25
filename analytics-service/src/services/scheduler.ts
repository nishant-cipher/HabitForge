import cron from 'node-cron';
import { dailyHabitChecker } from '@habitforge/shared';

export class SchedulerService {
    private jobs: Map<string, cron.ScheduledTask> = new Map();
    private jobRunning: Map<string, boolean> = new Map();

    constructor() {
        this.initializeScheduler();
    }

    private initializeScheduler(): void {
        console.log('[SchedulerService] Initializing scheduled jobs...');
        
        // Daily habit check at 00:30 AM every day
        const dailyCheckJob = cron.schedule('30 0 * * *', async () => {
            console.log('[SchedulerService] Running daily habit check...');
            try {
                await dailyHabitChecker.performDailyCheck();
                console.log('[SchedulerService] Daily habit check completed successfully');
            } catch (error) {
                console.error('[SchedulerService] Daily habit check failed:', error);
            }
        }, {
            scheduled: false,
            timezone: "UTC"
        });

        this.jobs.set('dailyHabitCheck', dailyCheckJob);
        
        // Start all jobs
        this.startAllJobs();
    }

    public startAllJobs(): void {
        console.log('[SchedulerService] Starting all scheduled jobs...');
        this.jobs.forEach((job, name) => {
            job.start();
            this.jobRunning.set(name, true);
            console.log(`[SchedulerService] Started job: ${name}`);
        });
    }

    public stopAllJobs(): void {
        console.log('[SchedulerService] Stopping all scheduled jobs...');
        this.jobs.forEach((job, name) => {
            job.stop();
            this.jobRunning.set(name, false);
            console.log(`[SchedulerService] Stopped job: ${name}`);
        });
    }

    public triggerDailyCheck(): Promise<void> {
        console.log('[SchedulerService] Manually triggering daily habit check...');
        return dailyHabitChecker.performDailyCheck();
    }

    public getJobStatus(): Record<string, boolean> {
        const status: Record<string, boolean> = {};
        this.jobs.forEach((_job, name) => {
            status[name] = this.jobRunning.get(name) ?? false;
        });
        return status;
    }
}

export const schedulerService = new SchedulerService();