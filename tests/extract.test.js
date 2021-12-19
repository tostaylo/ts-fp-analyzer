const { processFiles } = require('../bin/src/extract');
const { createCtx, createLocals, createFnCalls } = require('../bin/utils/index');
const { defaultCtx } = require('../bin/models/index');

const functionDeclarationKind = 'FunctionDeclaration';
const arrowFunctionKind = 'ArrowFunction';
const globalKind = 'global';
const globalNamespace = 'global';

describe('functions', () => {
	test('given a single function declaration, should detect function declaration', () => {
		const expected = new Map();
		expected.set(
			globalNamespace,
			createCtx({ ...defaultCtx, namespace: globalNamespace, kind: globalKind, childFns: ['one'] })
		);
		expected.set('global.one', createCtx({ ...defaultCtx, namespace: globalNamespace, kind: functionDeclarationKind }));

		expect(processFiles(['subjects/functions.ts'])).toEqual(expected);
	});
});

describe('arrow functions', () => {
	test('given a single arrow function, should detect arrow function declaration', () => {
		const expected = new Map();
		expected.set(
			globalNamespace,
			createCtx({
				...defaultCtx,
				namespace: globalNamespace,
				kind: globalKind,
				childFns: ['one'],
				locals: createLocals({}, [{ name: 'one', type: '() => void' }]),
			})
		);
		expected.set('global.one', createCtx({ ...defaultCtx, namespace: globalNamespace, kind: arrowFunctionKind }));

		expect(processFiles(['subjects/arrowFns.ts'])).toEqual(expected);
	});
});

describe('variables', () => {
	test('given a global variable and a function scoped variable, should detect variables', () => {
		const expected = new Map();
		expected.set(
			globalNamespace,
			createCtx({
				...defaultCtx,
				namespace: globalNamespace,
				kind: globalNamespace,
				locals: { first: { name: 'first', type: '"first"' }, second: { name: 'second', type: 'string' } },
				childFns: ['one'],
			})
		);

		expected.set(
			'global.one',
			createCtx({
				...defaultCtx,
				namespace: globalNamespace,
				kind: functionDeclarationKind,
				locals: { third: { name: 'third', type: '"third"' } },
			})
		);

		expect(processFiles(['subjects/variables.ts'])).toEqual(expected);
	});
});

describe('mutations', () => {
	test('given variables declared with "let" and mutations occur globally and locally, should detect mutations', () => {
		const expected = new Map();
		expected.set(
			globalNamespace,
			createCtx({
				...defaultCtx,
				namespace: globalNamespace,
				kind: globalKind,
				mutatesInScope: true,
				locals: createLocals({}, [{ name: 'a', type: 'number' }]),
				childFns: ['one', 'two'],
			})
		);
		expected.set(
			'global.one',
			createCtx(
				createCtx({
					...defaultCtx,
					namespace: globalNamespace,
					kind: functionDeclarationKind,
					mutatesInScope: true,
					mutatesOutsideScope: true,
					locals: createLocals({}, [{ name: 'b', type: 'number' }]),
				})
			)
		);
		expected.set(
			'global.two',
			createCtx(
				createCtx({
					...defaultCtx,
					namespace: globalNamespace,
					kind: functionDeclarationKind,
					mutatesInScope: true,
					locals: createLocals({}, [{ name: 'a', type: 'number' }]),
				})
			)
		);

		expect(processFiles(['subjects/mutations.ts'])).toEqual(expected);
	});
});

describe('hoisting', () => {
	test('given a function executed before declaration, it detects hoisted functions and binds the correct namespace', () => {
		const expected = new Map();
		expected.set(
			globalNamespace,
			createCtx({
				...defaultCtx,
				namespace: globalNamespace,
				kind: globalKind,
				fnCalls: createFnCalls({}, [
					{ name: 'one', namespace: globalNamespace },
					{ name: 'two', namespace: globalNamespace },
				]),
				childFns: ['one', 'two'],
			})
		);
		expected.set('global.one', createCtx({ ...defaultCtx, namespace: globalNamespace, kind: functionDeclarationKind }));
		expected.set(
			'global.two',
			createCtx({
				...defaultCtx,
				namespace: globalNamespace,
				kind: functionDeclarationKind,
				fnCalls: createFnCalls({}, [{ name: 'three', namespace: 'global.two' }]),
				childFns: ['three'],
			})
		);
		expected.set(
			'global.two.three',
			createCtx({ ...defaultCtx, namespace: 'global.two', kind: functionDeclarationKind })
		);

		expect(processFiles(['subjects/hoisting.ts'])).toEqual(expected);
	});
});
