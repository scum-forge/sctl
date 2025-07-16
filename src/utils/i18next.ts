import i18next from 'i18next';
import Backend from 'i18next-fs-backend';
import { join } from 'node:path';

export async function initI18n(language = 'en-US')
{
	await i18next
		.use(Backend)
		.init({
			lng: language,
			fallbackLng: 'en-US',
			defaultNS: 'translation',
			backend: {
				loadPath: join(import.meta.dirname, '..', '..', 'locales/{{lng}}.yml'),
			},
			interpolation: {
				escapeValue: false,
			},
			debug: false,
		});
}
