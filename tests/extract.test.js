const { processFiles } = require('../bin/src/extract');
const { createCtx, createLocals, createFnCalls } = require('../bin/utils/index');

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

// remove this. adding a property to ctx type will break tests. The downside will be the tests will be more verbose
function createFn(namespace, locals = [], mutatesInScope = false, mutatesOutsideScope = false, fnCalls = []) {
	return {
		namespace,
		mutatesInScope,
		mutatesOutsideScope,
		locals: createLocals({}, locals),
		fnCalls: createFnCalls({}, fnCalls),
	};
}

describe('mutations', () => {
	test('detects mutations', () => {
		const expected = new Map();
		expected.set('global', createCtx(createFn('global', [['a']], true, false)));
		expected.set('one', createCtx(createFn('one', [['b']], true, true)));
		expected.set('two', createCtx(createFn('two', [['a']], true, false)));

		expect(processFiles(['subjects/mutations.ts'])).toEqual(expected);
	});
});

// how to detect function calls with recursion? kinda edge case since the call name would have to match another global /// function name. maybe namespace is an array which is pushed into?

describe('hoisting', () => {
	test('detects hoisted functions', () => {
		const expected = new Map();
		expected.set(
			'global',
			createCtx(
				createFn('global', [], false, false, [
					['one', 'global'],
					['two', 'global'],
				])
			)
		);
		expected.set('one', createCtx(createFn('one')));
		expected.set('two', createCtx(createFn('two', [], false, false, [['one', 'two']])));

		expect(processFiles(['subjects/hoisting.ts'])).toEqual(expected);
	});
});
