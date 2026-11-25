import { Injectable, NestMiddleware } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ResponseHandler } from '../dtos/response.dto.js';
import { InvalidAPIKey } from '../utils/string.constants.js';

@Injectable()
export class ApiKeyMiddleware implements NestMiddleware {
  constructor(private readonly configService: ConfigService) {}

  use(req: any, _res: any, next: () => void) {
    const apiKey = req.headers['x-api-key'];
    const serverApiKey = this.configService.get<string>('serverApiKey');

    if (!apiKey || apiKey !== serverApiKey) {
      throw ResponseHandler.sendUnAuthorised(InvalidAPIKey);
    }

    next();
  }
}
