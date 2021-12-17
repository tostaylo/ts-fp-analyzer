module.exports = {
	root: true,
	env: {
		node: true,
	},
	ignorePatterns: ['bin/**', '*.tst.ts', 'tests/**'],
	parser: '@typescript-eslint/parser',
	plugins: ['@typescript-eslint'],
	extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
};
