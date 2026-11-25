import { Injectable } from '@nestjs/common';
import { AppName } from '@test-chat-app/utils/constants.js';

@Injectable()
export class AppService {
  getHello(): string {
    return AppName;
  }
}
