export interface DomainEvent {
  eventId: string;
  eventType: string;
  aggregateId: string;
  occurredAt: Date;
  payload: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface EventHandler<T extends DomainEvent = DomainEvent> {
  handle(event: T): Promise<void>;
}

export class EventBus {
  private handlers: Map<string, EventHandler[]> = new Map();

  subscribe(eventType: string, handler: EventHandler): void {
    const handlers = this.handlers.get(eventType) || [];
    handlers.push(handler);
    this.handlers.set(eventType, handlers);
  }

  async publish(event: DomainEvent): Promise<void> {
    const handlers = this.handlers.get(event.eventType) || [];
    await Promise.all(handlers.map((handler) => handler.handle(event)));
  }

  async publishAll(events: DomainEvent[]): Promise<void> {
    await Promise.all(events.map((event) => this.publish(event)));
  }
}

export const eventBus = new EventBus();

export function createDomainEvent<T extends Record<string, unknown>>(
  eventType: string,
  aggregateId: string,
  payload: T,
  metadata?: Record<string, unknown>,
): DomainEvent {
  return {
    eventId: crypto.randomUUID(),
    eventType,
    aggregateId,
    occurredAt: new Date(),
    payload,
    metadata,
  };
}