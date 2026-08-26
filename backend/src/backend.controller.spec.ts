import { BackendController } from './backend.controller';

describe('BackendController', () => {
  const controller = new BackendController();

  it('returns the Tenant A greeting', () => {
    expect(controller.getHello()).toEqual({
      message: 'Hello from BE EC2&#x20;',
      service: 'backend',
      status: 'ok',
    });
  });

  it('returns backend health', () => {
    expect(controller.getHealth()).toEqual({ status: 'ok' });
  });

  it('calls Backend EC2 #2 and returns both responses', async () => {
    const backend2Url = 'http://backend2.test:4000/api/hello';
    process.env.BACKEND_2_URL = backend2Url;
    const backend2Response = {
      message: 'Hello from BE EC2 #2',
      service: 'backend',
      status: 'ok',
    };
    const fetchMock = jest
      .spyOn(global, 'fetch')
      .mockResolvedValueOnce(
        new Response(JSON.stringify(backend2Response), { status: 200 }),
      );

    await expect(controller.getBackend2()).resolves.toEqual({
      backend1: {
        source: 'Backend EC2 #1',
        response: controller.getHello(),
      },
      backend2: {
        source: 'Backend EC2 #2',
        url: backend2Url,
        response: backend2Response,
      },
    });
    expect(fetchMock).toHaveBeenCalledWith(
      backend2Url,
      expect.objectContaining({ method: 'GET' }),
    );

    fetchMock.mockRestore();
    delete process.env.BACKEND_2_URL;
  });
});
