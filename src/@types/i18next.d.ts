import 'i18next';
import en from '../generated/en-US.json';

declare module 'i18next'
{
	interface CustomTypeOptions
	{
		defaultNS: 'translation';
		resources: {
			translation: typeof en;
		};
	}
}
