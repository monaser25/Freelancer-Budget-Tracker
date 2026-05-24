import { extractBearerToken, getUserId, mapSupabaseUser } from './auth';

describe('auth helpers', () => {
  it('extracts a bearer token from an authorization header', () => {
    expect(extractBearerToken('Bearer abc.def.ghi')).toBe('abc.def.ghi');
  });

  it('rejects missing or non-bearer authorization headers', () => {
    expect(extractBearerToken()).toBeNull();
    expect(extractBearerToken('Basic abc')).toBeNull();
    expect(extractBearerToken('Bearer')).toBeNull();
  });

  it('returns the authenticated user id', () => {
    expect(getUserId({ id: 'user-1' })).toBe('user-1');
  });

  it('throws when a route tries to read a missing authenticated user id', () => {
    expect(() => getUserId({} as never)).toThrow('Authentication required');
  });

  it('maps Supabase users to API user context without exposing token data', () => {
    expect(mapSupabaseUser({ id: 'supabase-user', email: 'user@example.com' } as never)).toEqual({
      id: 'supabase-user',
      email: 'user@example.com',
    });
  });
});
