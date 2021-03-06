const { processFiles } = require('../bin/src/extract');
const { createCtx, createLocals, createFnCalls, createParams } = require('../bin/utils/index');
const { defaultCtx } = require('../bin/models/index');

const functionDeclarationKind = 'FunctionDeclaration';
const functionExpressionKind = 'FunctionExpression';
const arrowFunctionKind = 'ArrowFunction';
const globalKind = 'global';
const globalNamespace = 'global';

describe('functions', () => {
	test('given a function declaration, function expression, and arrow function, should detect', () => {
		const expected = new Map();
		expected.set(
			globalNamespace,
			createCtx({
				...defaultCtx,
				namespace: globalNamespace,
				kind: globalKind,
				childFns: ['one', 'two', 'three'],
				locals: createLocals({}, [
					{ name: 'two', type: '() => void' },
					{ name: 'three', type: '() => void' },
				]),
			})
		);
		expected.set(
			`${globalNamespace}.one`,
			createCtx({ ...defaultCtx, namespace: globalNamespace, kind: functionDeclarationKind })
		);
		expected.set(
			`${globalNamespace}.two`,
			createCtx({
				...defaultCtx,
				namespace: globalNamespace,
				kind: functionExpressionKind,
			})
		);
		expected.set('global.three', createCtx({ ...defaultCtx, namespace: globalNamespace, kind: arrowFunctionKind }));

		expect(processFiles(['subjects/functions.ts'])).toEqual(expected);
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
				locals: createLocals({}, [
					{ name: 'first', type: '"first"' },
					{ name: 'second', type: 'string' },
				]),
				childFns: ['one'],
			})
		);

		expected.set(
			`${globalNamespace}.one`,
			createCtx({
				...defaultCtx,
				namespace: globalNamespace,
				kind: functionDeclarationKind,
				locals: createLocals({}, [{ name: 'third', type: '"third"' }]),
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
				mutates: { inScope: true, outsideScope: false },
				locals: createLocals({}, [{ name: 'a', type: 'number' }]),
				childFns: ['one', 'two'],
				accesses: { inScope: true, outsideScope: false },
			})
		);
		expected.set(
			`${globalNamespace}.one`,
			createCtx(
				createCtx({
					...defaultCtx,
					namespace: globalNamespace,
					kind: functionDeclarationKind,
					mutates: { inScope: true, outsideScope: true },
					locals: createLocals({}, [{ name: 'b', type: 'number' }]),
					accesses: { inScope: true, outsideScope: true },
				})
			)
		);
		expected.set(
			`${globalNamespace}.two`,
			createCtx(
				createCtx({
					...defaultCtx,
					namespace: globalNamespace,
					kind: functionDeclarationKind,
					mutates: { inScope: true, outsideScope: false },
					locals: createLocals({}, [{ name: 'a', type: 'number' }]),
					accesses: { inScope: true, outsideScope: false },
				})
			)
		);

		expect(processFiles(['subjects/mutations/numbers.ts'])).toEqual(expected);
	});

	test('should detect param mutations', () => {
		const expected = new Map();
		expected.set(
			globalNamespace,
			createCtx({
				...defaultCtx,
				namespace: globalNamespace,
				kind: globalKind,
				childFns: ['one', 'two', 'three'],
			})
		);
		expected.set(
			`${globalNamespace}.one`,
			createCtx({
				...defaultCtx,
				namespace: globalNamespace,
				kind: functionDeclarationKind,
				mutates: { inScope: false, outsideScope: true },
				params: createParams({}, [{ name: 'a', type: 'any' }]),
				accesses: { inScope: false, outsideScope: true },
			})
		);
		expected.set(
			`${globalNamespace}.two`,
			createCtx({
				...defaultCtx,
				namespace: globalNamespace,
				kind: functionDeclarationKind,
				mutates: { inScope: false, outsideScope: true },
				params: createParams({}, [{ name: 'b', type: 'any' }]),
				accesses: { inScope: false, outsideScope: true },
			})
		);
		expected.set(
			'global.three',
			createCtx({
				...defaultCtx,
				namespace: globalNamespace,
				kind: functionDeclarationKind,
				mutates: { inScope: true, outsideScope: false },
				params: createParams({}, [{ name: 'c', type: 'any' }]),
				accesses: { inScope: true, outsideScope: false },
			})
		);

		expect(processFiles(['subjects/mutations/params.ts'])).toEqual(expected);
	});
});

describe('call expressions', () => {
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
		expected.set(
			`${globalNamespace}.one`,
			createCtx({ ...defaultCtx, namespace: globalNamespace, kind: functionDeclarationKind })
		);
		expected.set(
			`${globalNamespace}.two`,
			createCtx({
				...defaultCtx,
				namespace: globalNamespace,
				kind: functionDeclarationKind,
				fnCalls: createFnCalls({}, [{ name: 'three', namespace: `${globalNamespace}.two` }]),
				childFns: ['three'],
			})
		);
		expected.set(
			'global.two.three',
			createCtx({ ...defaultCtx, namespace: `${globalNamespace}.two`, kind: functionDeclarationKind })
		);

		expect(processFiles(['subjects/calls/hoisting.ts'])).toEqual(expected);
	});

	test('given a call expression should detect array methods mutate status if is known mutator', () => {
		const expected = new Map();
		expected.set(
			globalNamespace,
			createCtx({
				...defaultCtx,
				namespace: globalNamespace,
				kind: globalKind,
				locals: createLocals({}, [{ name: 'one', type: '{ a: { push: () => any; }; b: number[]; }' }]),
				fnCalls: createFnCalls({}, [
					{ name: 'one.a.push', namespace: globalNamespace, lib: false, mutates: false },
					{ name: 'one.b.push', namespace: globalNamespace, lib: true, mutates: true },
				]),
				mutates: { inScope: true, outsideScope: false },
				accesses: { inScope: true, outsideScope: false },
			})
		);

		expect(processFiles(['subjects/calls/methods/arrays.ts'])).toEqual(expected);
	});

	test('given a call expression should detect object methods mutate status if is known mutator', () => {
		const expected = new Map();

		expected.set(
			globalNamespace,
			createCtx({
				...defaultCtx,
				namespace: globalNamespace,
				kind: globalKind,
				locals: createLocals({}, [{ name: 'a', type: '{}' }]),
				childFns: ['one', 'two'],
			})
		);

		expected.set(
			`${globalNamespace}.one`,
			createCtx({
				...defaultCtx,
				namespace: globalNamespace,
				kind: functionDeclarationKind,
				mutates: { inScope: false, outsideScope: true },
				accesses: { inScope: false, outsideScope: true },
				fnCalls: createFnCalls({}, [
					{ name: 'Object.assign', namespace: `${globalNamespace}.one`, lib: true, mutates: true },
				]),
			})
		);

		expected.set(
			`${globalNamespace}.two`,
			createCtx({
				...defaultCtx,
				namespace: globalNamespace,
				kind: functionDeclarationKind,
				mutates: { inScope: true, outsideScope: false },
				accesses: { inScope: true, outsideScope: false },
				fnCalls: createFnCalls({}, [
					{ name: 'Object.assign', namespace: `${globalNamespace}.two`, lib: true, mutates: true },
				]),
				locals: createLocals({}, [
					{ name: 'b', type: '{}' },
					{ name: 'c', type: '{}' },
				]),
			})
		);

		expect(processFiles(['subjects/calls/methods/objects.ts'])).toEqual(expected);
	});
});

describe('property accesss', () => {
	test('given property access should detect inScope or outsideScope', () => {
		const expected = new Map();

		expected.set(
			globalNamespace,
			createCtx({
				...defaultCtx,
				namespace: globalNamespace,
				kind: globalKind,
				locals: createLocals({}, [{ name: 'a', type: '{ b: number; }' }]),
				childFns: ['one'],
			})
		);
		expected.set(
			`${globalNamespace}.one`,
			createCtx({
				...defaultCtx,
				namespace: globalNamespace,
				kind: functionDeclarationKind,
				childFns: ['two'],
				accesses: { inScope: false, outsideScope: true },
			})
		);
		expected.set(
			'global.one.two',
			createCtx({
				...defaultCtx,
				namespace: `${globalNamespace}.one`,
				kind: functionDeclarationKind,
				locals: createLocals({}, [{ name: 'a', type: '{ b: number; }' }]),
				accesses: { inScope: true, outsideScope: false },
			})
		);

		expect(processFiles(['subjects/access.ts'])).toEqual(expected);
	});
});

describe('returns', () => {
	test('given a return should detect', () => {
		const expected = new Map();
		expected.set(
			globalNamespace,
			createCtx({
				...defaultCtx,
				namespace: globalNamespace,
				kind: globalKind,
				childFns: ['one'],
			})
		);
		expected.set(
			`${globalNamespace}.one`,
			createCtx({ ...defaultCtx, namespace: globalNamespace, kind: functionDeclarationKind, returns: ['1'] })
		);

		expect(processFiles(['subjects/returns.ts'])).toEqual(expected);
	});

	describe('params', () => {
		test('given a param should detect', () => {
			const expected = new Map();
			expected.set(
				globalNamespace,
				createCtx({
					...defaultCtx,
					namespace: globalNamespace,
					kind: globalKind,
					childFns: ['one'],
				})
			);
			expected.set(
				`${globalNamespace}.one`,
				createCtx({
					...defaultCtx,
					namespace: globalNamespace,
					kind: functionDeclarationKind,
					returns: ['{ a, b }'],
					params: createParams({}, [
						{ name: 'a', type: 'string' },
						{ name: 'b', type: 'string' },
					]),
				})
			);

			expect(processFiles(['subjects/params.ts'])).toEqual(expected);
		});
	});
});
