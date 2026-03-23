import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
@Injectable()
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger = new Logger('EventsGateway');

  handleConnection(client: Socket) {
    this.logger.debug(`Frontend WebSocket conectado: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.debug(`Frontend WebSocket desconectado: ${client.id}`);
  }

  // Método público para que los consumidores de dominio hagan broadcast
  broadcast(eventName: string, payload: any) {
    this.server.emit(eventName, payload);
    this.logger.log(`📡 Broadcast Público: ${eventName}`);
  }
}
