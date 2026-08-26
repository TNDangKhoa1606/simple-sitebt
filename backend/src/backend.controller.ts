import { Controller, Get } from '@nestjs/common';

@Controller()
export class BackendController {
  @Get('api/hello')
  getHello() {
    return {
      message: 'Hello from Tenant A backend',
      service: 'backend',
      status: 'ok',
    };
  }

  @Get('health')
  getHealth() {
    return {
      status: 'ok',
    };
  }
}
