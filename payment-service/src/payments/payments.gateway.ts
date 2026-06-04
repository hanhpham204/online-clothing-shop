import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { IncomingMessage } from 'http';
import { WebSocket, Server } from 'ws';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  path: '/payments/ws',
})
export class PaymentsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(PaymentsGateway.name);
  // Map paymentId -> Set of WebSocket clients (supports multiple tabs/connections per payment)
  private clients = new Map<string, Set<WebSocket>>();

  @WebSocketServer()
  server: Server;

  handleConnection(client: WebSocket, request: IncomingMessage) {
    try {
      const url = new URL(request.url || '', 'http://localhost');
      const paymentId = url.searchParams.get('paymentId');

      if (!paymentId) {
        this.logger.warn('Client connected without paymentId. Closing connection.');
        client.close(1008, 'paymentId is required');
        return;
      }

      if (!this.clients.has(paymentId)) {
        this.clients.set(paymentId, new Set());
      }
      this.clients.get(paymentId)!.add(client);
      this.logger.log(`Client connected and subscribed to paymentId: ${paymentId}`);

      client.on('error', (err) => {
        this.logger.error(`WebSocket error for paymentId ${paymentId}: ${err.message}`);
      });
    } catch (err) {
      this.logger.error(`Error in handleConnection: ${(err as Error).message}`);
      client.close(1011, 'Internal server error');
    }
  }

  handleDisconnect(client: WebSocket) {
    for (const [paymentId, wsSet] of this.clients.entries()) {
      if (wsSet.has(client)) {
        wsSet.delete(client);
        this.logger.log(`Client disconnected for paymentId: ${paymentId}`);
        if (wsSet.size === 0) {
          this.clients.delete(paymentId);
        }
        break;
      }
    }
  }

  sendPaymentStatus(paymentId: string, status: string) {
    const wsSet = this.clients.get(paymentId);
    if (wsSet && wsSet.size > 0) {
      const message = JSON.stringify({ event: 'payment_status', data: { status } });
      let sentCount = 0;
      for (const client of wsSet) {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message);
          sentCount++;
        }
      }
      this.logger.log(`Notification sent to ${sentCount} client(s) for paymentId: ${paymentId} -> ${status}`);
    } else {
      this.logger.debug(`No active WebSocket client subscribed to paymentId: ${paymentId}`);
    }
  }
}
