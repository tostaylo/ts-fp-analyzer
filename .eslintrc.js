module.exports = {
	root: true,
	env: {
		node: true,
		browser: true,
	},
	ignorePatterns: ['bin/**', 'subjects/**', 'tests/**'],
	parser: '@typescript-eslint/parser',
	plugins: ['@typescript-eslint'],
	extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
};
