import { PrismaClient } from '../generated/prisma/client.ts';

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
}

export const DatabaseManager = new CDatabaseManager();
