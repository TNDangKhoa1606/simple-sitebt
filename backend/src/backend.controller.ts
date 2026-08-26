import { BadGatewayException, Controller, Get } from '@nestjs/common';

@Controller()
export class BackendController {
  @Get('api/hello')
  getHello() {
    return {
      message: 'Hello from BE EC2&#x20;',
      service: 'backend',
      status: 'ok',
    };
  }

  @Get('api/backend2')
  async getBackend2() {
    const backend1Response = this.getHello();
    const backend2Url = process.env.BACKEND_2_URL;

    if (!backend2Url) {
      throw new BadGatewayException('BACKEND_2_URL is not configured');
    }

    try {
      const response = await fetch(backend2Url, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });

      if (!response.ok) {
        throw new Error(`Backend #2 returned HTTP ${response.status}`);
      }

      const backend2Response: unknown = await response.json();

      return {
        backend1: {
          source: 'Backend EC2 #1',
          response: backend1Response,
        },
        backend2: {
          source: 'Backend EC2 #2',
          url: backend2Url,
          response: backend2Response,
        },
      };
    } catch (error) {
      throw new BadGatewayException({
        backend1: {
          source: 'Backend EC2 #1',
          response: backend1Response,
        },
        backend2: {
          source: 'Backend EC2 #2',
          url: backend2Url,
          status: 'error',
          error: error instanceof Error ? error.message : String(error),
        },
      });
    }
  }

  @Get('health')
  getHealth() {
    return {
      status: 'ok',
    };
  }
}
