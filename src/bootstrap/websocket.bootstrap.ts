import { INestApplication } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions } from 'socket.io';
import { logger } from '../infrastructure/telemetry/logger';

export class WebSocketAdapter extends IoAdapter {
  createIOServer(port: number, options?: ServerOptions): any {
    const server = super.createIOServer(port, {
      ...options,
      cors: {
        origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
        credentials: true,
      },
      transports: ['websocket', 'polling'],
      pingTimeout: 60000,
      pingInterval: 25000,
    });

    server.engine.on('connection_error', (err: Error) => {
      logger.warn({ err: err.message }, 'WebSocket connection error');
    });

    return server;
  }
}

export function setupWebSocket(app: INestApplication): void {
  app.useWebSocketAdapter(new WebSocketAdapter(app));
  logger.info('✅ WebSocket server configured');
}