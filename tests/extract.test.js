const { processFiles } = require('../bin/src/extract');
const { createCtx, createLocals, createFnCalls } = require('../bin/utils/index');
const functionDeclaration = 'FunctionDeclaration';
const global = 'global';

describe('functions', () => {
	test('detects function declaration', () => {
		const expected = new Map();
		expected.set('global', createCtx({ namespace: 'global', kind: global }));
		expected.set('one', createCtx({ namespace: 'global', kind: functionDeclaration }));

		expect(processFiles(['subjects/functions.ts'])).toEqual(expected);
	});
});

describe('arrow functions', () => {
	xtest('detects arrow function declaration', () => {
		const expected = new Map();
		// expected.set('global', createCtx({ namespace: 'global' }));
		// expected.set('one', createCtx({ namespace: 'one' }));

		expect(processFiles(['subjects/arrowFns.ts'])).toEqual(expected);
	});
});

describe('variables', () => {
	test('detects variables', () => {
		const expected = new Map();
		expected.set(
			'global',
			createCtx({
				namespace: 'global',
				kind: 'global',
				locals: { first: { name: 'first', type: '' }, second: { name: 'second', type: '' } },
			})
		);

		expected.set(
			'one',
			createCtx({ namespace: 'global', kind: functionDeclaration, locals: { third: { name: 'third', type: '' } } })
		);

		expect(processFiles(['subjects/variables.ts'])).toEqual(expected);
	});
});

const defaultCtx = {
	namespace: '',
	kind: '',
	locals: {},
	mutatesInScope: false,
	mutatesOutsideScope: false,
	fnCalls: {},
};
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
		expected.set(
			'global',
			createCtx({
				...defaultCtx,
				namespace: 'global',
				kind: global,
				mutatesInScope: true,
				locals: createLocals({}, [['a']]),
			})
		);
		expected.set(
			'one',
			createCtx(
				createCtx({
					...defaultCtx,
					namespace: 'global',
					kind: functionDeclaration,
					mutatesInScope: true,
					mutatesOutsideScope: true,
					locals: createLocals({}, [['b']]),
				})
			)
		);
		expected.set(
			'two',
			createCtx(
				createCtx({
					...defaultCtx,
					namespace: 'global',
					kind: functionDeclaration,
					mutatesInScope: true,
					locals: createLocals({}, [['a']]),
				})
			)
		);

		expect(processFiles(['subjects/mutations.ts'])).toEqual(expected);
	});
});

// how to detect function calls with recursion? kinda edge case since the call name would have to match another global /// function name. maybe namespace is an array which is pushed into?

describe('hoisting', () => {
	test('detects hoisted functions', () => {
		const expected = new Map();
		expected.set(
			'global',
			createCtx({
				...defaultCtx,
				namespace: 'global',
				kind: global,
				fnCalls: createFnCalls({}, [
					['one', 'global'],
					['two', 'global'],
				]),
			})
		);
		expected.set('one', createCtx({ ...defaultCtx, namespace: 'global', kind: functionDeclaration }));
		expected.set(
			'two',
			createCtx({
				...defaultCtx,
				namespace: 'global',
				kind: functionDeclaration,
				fnCalls: createFnCalls({}, [['three', 'two']]),
			})
		);
		expected.set('three', createCtx({ ...defaultCtx, namespace: 'two', kind: functionDeclaration }));

		expect(processFiles(['subjects/hoisting.ts'])).toEqual(expected);
	});
});
