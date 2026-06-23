import { AppError, NotFoundError, UnauthorizedError, BadRequestError, ConflictError } from '../../src/utils/AppError';

describe('AppError classes', () => {
  it('AppError sets statusCode and message', () => {
    const err = new AppError('test error', 422);
    expect(err.statusCode).toBe(422);
    expect(err.message).toBe('test error');
    expect(err.isOperational).toBe(true);
  });

  it('NotFoundError returns 404', () => {
    const err = new NotFoundError('Order');
    expect(err.statusCode).toBe(404);
    expect(err.message).toContain('Order');
  });

  it('UnauthorizedError returns 401', () => {
    const err = new UnauthorizedError();
    expect(err.statusCode).toBe(401);
  });

  it('BadRequestError returns 400', () => {
    const err = new BadRequestError('bad data');
    expect(err.statusCode).toBe(400);
  });

  it('ConflictError returns 409', () => {
    const err = new ConflictError('already exists');
    expect(err.statusCode).toBe(409);
  });
});
