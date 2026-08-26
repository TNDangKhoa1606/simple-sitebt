import { BackendController } from './backend.controller';

describe('BackendController', () => {
  const controller = new BackendController();

  it('returns the Tenant A greeting', () => {
    expect(controller.getHello()).toEqual({
      message: 'Hello from Tenant A backend',
      service: 'backend',
      status: 'ok',
    });
  });

  it('returns backend health', () => {
    expect(controller.getHealth()).toEqual({ status: 'ok' });
  });
});
