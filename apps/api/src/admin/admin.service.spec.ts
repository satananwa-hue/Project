import { AdminService } from './admin.service';

describe('AdminService', () => {
  it('authenticates with configured admin credentials', async () => {
    const service = new AdminService(
      {
        user: {
          count: jest.fn().mockResolvedValue(3),
        },
        invite: {
          count: jest.fn().mockResolvedValue(8),
        },
        venue: {
          count: jest.fn().mockResolvedValue(12),
        },
      } as any,
      {
        signAsync: jest.fn().mockResolvedValue('token-123'),
      } as any,
      {
        getOrThrow: jest.fn((key: string) =>
          key === 'ADMIN_USERNAME' ? 'admin' : 'secret',
        ),
      } as any,
    );

    const result = await service.authenticate('admin', 'secret');

    expect(result).toEqual({
      accessToken: 'token-123',
      user: {
        username: 'admin',
        stats: { reviewers: 3, invites: 8, venues: 12 },
      },
    });
  });
});
