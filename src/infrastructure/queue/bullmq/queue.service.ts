import { Injectable, Logger } from '@nestjs/common';
import { Queue, Job } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';

export type QueueName = 'notifications' | 'uploads' | 'moderation' | 'privacy' | 'maintenance';

export interface QueueJobData {
  [key: string]: unknown;
}

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);

  constructor(
    @InjectQueue('notifications') private notificationsQueue: Queue,
    @InjectQueue('uploads') private uploadsQueue: Queue,
    @InjectQueue('moderation') private moderationQueue: Queue,
    @InjectQueue('privacy') private privacyQueue: Queue,
    @InjectQueue('maintenance') private maintenanceQueue: Queue,
  ) {}

  private getQueue(name: QueueName): Queue {
    switch (name) {
      case 'notifications':
        return this.notificationsQueue;
      case 'uploads':
        return this.uploadsQueue;
      case 'moderation':
        return this.moderationQueue;
      case 'privacy':
        return this.privacyQueue;
      case 'maintenance':
        return this.maintenanceQueue;
      default:
        throw new Error(`Unknown queue: ${name}`);
    }
  }

  async addJob<T extends QueueJobData>(
    queueName: QueueName,
    jobName: string,
    data: T,
    options?: { delay?: number; priority?: number; jobId?: string },
  ): Promise<Job<T>> {
    const queue = this.getQueue(queueName);
    const job = await queue.add(jobName, data, {
      delay: options?.delay,
      priority: options?.priority,
      jobId: options?.jobId,
    });

    this.logger.debug({ queueName, jobName, jobId: job.id }, 'Job added to queue');
    return job;
  }

  async addNotificationJob(jobName: string, data: QueueJobData, options?: { delay?: number }): Promise<Job> {
    return this.addJob('notifications', jobName, data, options);
  }

  async addUploadJob(jobName: string, data: QueueJobData, options?: { delay?: number }): Promise<Job> {
    return this.addJob('uploads', jobName, data, options);
  }

  async addModerationJob(jobName: string, data: QueueJobData, options?: { delay?: number }): Promise<Job> {
    return this.addJob('moderation', jobName, data, options);
  }

  async addPrivacyJob(jobName: string, data: QueueJobData, options?: { delay?: number }): Promise<Job> {
    return this.addJob('privacy', jobName, data, options);
  }

  async addMaintenanceJob(jobName: string, data: QueueJobData, options?: { delay?: number }): Promise<Job> {
    return this.addJob('maintenance', jobName, data, options);
  }

  async getJob(queueName: QueueName, jobId: string): Promise<Job | undefined> {
    const queue = this.getQueue(queueName);
    return queue.getJob(jobId);
  }

  async getQueueStats(queueName: QueueName): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  }> {
    const queue = this.getQueue(queueName);
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
      queue.getDelayedCount(),
    ]);

    return { waiting, active, completed, failed, delayed };
  }

  async pauseQueue(queueName: QueueName): Promise<void> {
    const queue = this.getQueue(queueName);
    await queue.pause();
  }

  async resumeQueue(queueName: QueueName): Promise<void> {
    const queue = this.getQueue(queueName);
    await queue.resume();
  }

  async cleanQueue(queueName: QueueName, grace: number = 86400000): Promise<void> {
    const queue = this.getQueue(queueName);
    await queue.clean(grace, 100, 'completed');
    await queue.clean(grace, 100, 'failed');
  }
}