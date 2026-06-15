import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from './jwt-auth.guard';

function contextFor(handler: () => void): ExecutionContext {
  return {
    getHandler: () => handler,
    getClass: () => class {},
    switchToHttp: () => ({
      getRequest: () => ({}),
      getResponse: () => ({}),
      getNext: () => ({}),
    }),
  } as unknown as ExecutionContext;
}

describe('JwtAuthGuard', () => {
  it('should be defined', () => {
    expect(new JwtAuthGuard(new Reflector())).toBeDefined();
  });

  it('allows the request without authentication when the route is @Public', () => {
    const reflector = new Reflector();
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);

    const guard = new JwtAuthGuard(reflector);

    expect(guard.canActivate(contextFor(() => {}))).toBe(true);
  });

  it('delegates to passport authentication when the route is not public', () => {
    const reflector = new Reflector();
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);

    const guard = new JwtAuthGuard(reflector);
    const superCanActivate = jest
      .spyOn(
        Object.getPrototypeOf(Object.getPrototypeOf(guard)) as {
          canActivate: () => boolean;
        },
        'canActivate',
      )
      .mockReturnValue(true);

    expect(guard.canActivate(contextFor(() => {}))).toBe(true);
    expect(superCanActivate).toHaveBeenCalled();
  });
});
