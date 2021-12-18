const { processFiles, createCtx } = require('../bin/src/extract');

describe('functions', () => {
	test('detects function declaration', () => {
		const expected = new Map();
		expected.set('global', createCtx({}));
		expected.set('one', createCtx({ namespace: 'one' }));

		expect(processFiles(['subjects/functionDec.ts'])).toEqual(expected);
	});
});

describe('variables', () => {
	test('detects variables', () => {
		const expected = new Map();
		expected.set(
			'global',
			createCtx({ locals: { first: { name: 'first', type: '' }, second: { name: 'second', type: '' } } })
		);

		expected.set('one', createCtx({ namespace: 'one', locals: { third: { name: 'third', type: '' } } }));

		expect(processFiles(['subjects/variables.ts'])).toEqual(expected);
	});
});
