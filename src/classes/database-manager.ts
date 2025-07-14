import { Prisma, PrismaClient } from '../generated/prisma/client.ts';
import type { ExtractedUserId } from '../utils/utils.ts';

type UserProfileFindFirstArgs = Prisma.Args<typeof DatabaseManager.user_profile, 'findFirst'>;
type UserProfileFindUniqueArgs = Prisma.Args<typeof DatabaseManager.user_profile, 'findUnique'>;
type UserProfileFindFirstResult<T extends UserProfileFindFirstArgs> = Prisma.Result<typeof DatabaseManager.user_profile, T, 'findFirst'>;
type UserProfileFindUniqueResult<T extends UserProfileFindUniqueArgs> = Prisma.Result<typeof DatabaseManager.user_profile, T, 'findUnique'>;

class CDatabaseManager extends PrismaClient
{
	initialized = false;

	init = async () =>
	{
		await this.$connect();
		this.initialized = true;
	};

	disconnect = async () =>
	{
		await this.$disconnect();
		this.initialized = false;
	};

	getUserProfileIds = async (steamId: string) => this.user_profile.findMany({
		where: {
			user_id: steamId,
		},
		select: {
			id: true,
		},
	});

	getUserSteamId = async (id: number) => this.user_profile.findUnique({
		where: {
			id,
		},
		select: {
			user_id: true,
		},
	});

	findProfile<T extends UserProfileFindUniqueArgs>(id: ExtractedUserId, args: T): Promise<UserProfileFindUniqueResult<T>>;
	findProfile<T extends UserProfileFindFirstArgs>(id: ExtractedUserId, args: T): Promise<UserProfileFindFirstResult<T>>;
	findProfile(id: ExtractedUserId, args: UserProfileFindFirstArgs | UserProfileFindUniqueArgs)
	{
		if (typeof id === 'number')
		{
			return this.user_profile.findUnique({
				...args,
				where: { id },
			});
		}

		return this.user_profile.findFirst({
			...args,
			where: { user_id: id },
			orderBy: { id: 'desc' },
		});
	}
}

export const DatabaseManager = new CDatabaseManager();
