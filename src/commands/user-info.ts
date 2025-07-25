import { Command } from '@commander-js/extra-typings';
import i18next from 'i18next';
import { err, ok } from 'neverthrow';
import { DatabaseManager } from '../classes/database-manager.ts';
import { Logger } from '../classes/log-manager.ts';
import { actionWrapper, parseUserId, type ExtractedUserId } from '../utils/utils.ts';

export async function getUserInfo(id: ExtractedUserId)
{
	const profile = await DatabaseManager.findProfile(id, {
		select: {
			id: true,
			user_id: true,
			name: true,
			fake_name: true,
			creation_time: true,
			last_login_time: true,
			last_logout_time: true,
			last_name_change: true,
			user: {
				select: {
					id: true,
					name: true,
					is_banned: true,
					creation_time: true,
					last_login_time: true,
				},
			},
			user_profiles_marked_for_deletion: {
				select: {
					user_profile_id: true,
				},
			},
		},
	});

	if (!profile) return err(i18next.t('errors.userNotFound'));

	const elevated = profile.user_id != null
		? await DatabaseManager.elevated_users.findUnique({ where: { user_id: profile.user_id } })
		: null;

	return ok({
		profile: {
			id: profile.id,
			// userId: profile.user_id,
			name: profile.name,
			fakeName: profile.fake_name,
			createdOn: profile.creation_time,
			lastLogin: profile.last_login_time,
			lastLogout: profile.last_logout_time,
			lastNameChange: profile.last_name_change,
		},

		user: {
			id: profile.user?.id,
			name: profile.user?.name,
			banned: !!profile.user?.is_banned,
			createdOn: profile.user?.creation_time,
			lastLogin: profile.user?.last_login_time,
		},

		elevated: !!elevated,
		markedForDeletion: profile.user_profiles_marked_for_deletion.length !== 0,
	});
}

export const getUserInfoCommand = () => new Command()
	.name('user-info')
	.description(i18next.t('program.commands.get.commands.user-info.description'))
	.addHelpText('after', i18next.t('program.commands.get.idHelp'))
	.argument('<id>', i18next.t('program.commands.get.commands.user-info.id'), parseUserId)
	.action(async (id) => await actionWrapper(async () =>
	{
		const ret = await getUserInfo(id);
		if (ret.isOk())
		{
			Logger.info(i18next.t('commands.user-info.ok'));
			console.table(ret.value);
		}
		else Logger.error(ret.error);
	}));
