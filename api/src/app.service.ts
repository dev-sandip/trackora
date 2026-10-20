import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  home() {
    return {
      message: 'Welcome to the Realtime Agent Tracking API',
      status: 'Running',
    };
  }
}
