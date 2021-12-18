const { processFiles } = require('../bin/src/extract');
const { createCtx, createLocals, createFnCalls } = require('../bin/utils/index');
const { defaultCtx } = require('../bin/models/index');

const functionDeclarationKind = 'FunctionDeclaration';
const globalKind = 'global';

describe('functions', () => {
	test('detects function declaration', () => {
		const expected = new Map();
		expected.set('global', createCtx({ namespace: 'global', kind: globalKind }));
		expected.set('global.one', createCtx({ namespace: 'global', kind: functionDeclarationKind }));

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
			createCtx({ namespace: 'global', kind: functionDeclarationKind, locals: { third: { name: 'third', type: '' } } })
		);

		expect(processFiles(['subjects/variables.ts'])).toEqual(expected);
	});
});

describe('mutations', () => {
	test('detects mutations', () => {
		const expected = new Map();
		expected.set(
			'global',
			createCtx({
				...defaultCtx,
				namespace: 'global',
				kind: globalKind,
				mutatesInScope: true,
				locals: createLocals({}, [{ name: 'a', type: '' }]),
			})
		);
		expected.set(
			'global.one',
			createCtx(
				createCtx({
					...defaultCtx,
					namespace: 'global',
					kind: functionDeclarationKind,
					mutatesInScope: true,
					mutatesOutsideScope: true,
					locals: createLocals({}, [{ name: 'b', type: '' }]),
				})
			)
		);
		expected.set(
			'global.two',
			createCtx(
				createCtx({
					...defaultCtx,
					namespace: 'global',
					kind: functionDeclarationKind,
					mutatesInScope: true,
					locals: createLocals({}, [{ name: 'a', type: '' }]),
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
				kind: globalKind,
				fnCalls: createFnCalls({}, [
					{ name: 'one', namespace: 'global' },
					{ name: 'two', namespace: 'global' },
				]),
			})
		);
		expected.set('global.one', createCtx({ ...defaultCtx, namespace: 'global', kind: functionDeclarationKind }));
		expected.set(
			'global.two',
			createCtx({
				...defaultCtx,
				namespace: 'global',
				kind: functionDeclarationKind,
				fnCalls: createFnCalls({}, [{ name: 'three', namespace: 'global.two' }]),
			})
		);
		expected.set(
			'global.two.three',
			createCtx({ ...defaultCtx, namespace: 'global.two', kind: functionDeclarationKind })
		);

		expect(processFiles(['subjects/hoisting.ts'])).toEqual(expected);
	});
});
