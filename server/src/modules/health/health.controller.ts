import { Controller, Get } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  @SkipThrottle()
  @Get()
  @ApiOperation({ summary: 'Health check' })
  check() {
    return { status: 'ok' };
  }
}
