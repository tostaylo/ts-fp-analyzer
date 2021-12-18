const { processFiles } = require('../bin/src/extract');
const { createCtx, createLocals, createFnCalls } = require('../bin/utils/index');
const functionDeclaration = 'FunctionDeclaration';
const global = 'global';

describe('functions', () => {
	test('detects function declaration', () => {
		const expected = new Map();
		expected.set('global', createCtx({ namespace: 'global', kind: global }));
		expected.set('global.one', createCtx({ namespace: 'global', kind: functionDeclaration }));

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
			'global.one',
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
			'global.one',
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
			'global.two',
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
		expected.set('global.one', createCtx({ ...defaultCtx, namespace: 'global', kind: functionDeclaration }));
		expected.set(
			'global.two',
			createCtx({
				...defaultCtx,
				namespace: 'global',
				kind: functionDeclaration,
				fnCalls: createFnCalls({}, [['three', 'global.two']]),
			})
		);
		expected.set('global.two.three', createCtx({ ...defaultCtx, namespace: 'global.two', kind: functionDeclaration }));

		expect(processFiles(['subjects/hoisting.ts'])).toEqual(expected);
	});
});
