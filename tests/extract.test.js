const { processFiles } = require('../bin/src/extract');
const { createCtx, createLocals } = require('../bin/utils/index');

describe('functions', () => {
	test('detects function declaration', () => {
		const expected = new Map();
		expected.set('global', createCtx({ namespace: 'global' }));
		expected.set('one', createCtx({ namespace: 'one' }));

		expect(processFiles(['subjects/functions.ts'])).toEqual(expected);
	});
});

describe('variables', () => {
	test('detects variables', () => {
		const expected = new Map();
		expected.set(
			'global',
			createCtx({
				namespace: 'global',
				locals: { first: { name: 'first', type: '' }, second: { name: 'second', type: '' } },
			})
		);

		expected.set('one', createCtx({ namespace: 'one', locals: { third: { name: 'third', type: '' } } }));

		expect(processFiles(['subjects/variables.ts'])).toEqual(expected);
	});
});

function createFn(namespace, locals, mutatesInScope, mutatesOutsideScope, fnCalls) {
	return {
		namespace,
		mutatesInScope,
		mutatesOutsideScope,
		locals: createLocals(locals),
		fnCalls,
	};
}

describe('mutations', () => {
	test('detects mutations', () => {
		const expected = new Map();
		expected.set('global', createCtx(createFn('global', [['a']], true, false, {})));
		expected.set('one', createCtx(createFn('one', [['b']], true, true, {})));
		expected.set('two', createCtx(createFn('two', [['a']], true, false, {})));

		expect(processFiles(['subjects/mutations.ts'])).toEqual(expected);
	});
});
