// @ts-check

/* eslint-disable import-x/no-extraneous-dependencies */
import { configs } from '@snowyyd/eslint-config';
import tseslint from 'typescript-eslint';

export default tseslint.config(
	configs.recommended,
	configs.esm,
	{
		ignores: ['dist/**'],
		languageOptions: {
			parserOptions: {
				projectService: true,
				tsconfigRootDir: import.meta.dirname,
			},
		},
	},
);
