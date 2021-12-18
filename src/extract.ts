import * as ts from 'typescript';
import { Ctx, ContextMap } from '../types';

export function createLocal(name: string, type = ''): Ctx['locals'] {
	return { [name]: { name, type } };
}

export function createLocals(locals: [[string, string]]): Ctx['locals'] {
	return locals.reduce((acc, next) => {
		return { ...acc, ...createLocal(next[0], next[1]) };
	}, {});
}

export function createCtx({
	namespace = '',
	fnCalls = {},
	locals = {},
	mutatesInScope = false,
	mutatesOutsideScope = false,
}): Ctx {
	return { namespace, fnCalls, locals, mutatesInScope, mutatesOutsideScope };
}

export function processFiles(filenames: string[]): ContextMap {
	const context: ContextMap = new Map();
	context.set('global', createCtx({ namespace: 'global' }));

	filenames.forEach((filename) => {
		const program = ts.createProgram([filename], {});
		const sourceFile = program.getSourceFile(filename);
		const typeChecker = program.getTypeChecker();

		// let codeAsString = fs.readFileSync(filename).toString();
		// const sourceFile: ts.SourceFile = ts.createSourceFile(filename, codeAsString, ts.ScriptTarget.Latest);

		sourceFile?.forEachChild((node: ts.Node) => {
			checkNode(node, context, typeChecker);
		});
	});

	return context;
}

function checkNode(node: ts.Node, context: ContextMap, typeChecker: ts.TypeChecker, namespace = 'global') {
	const ctx = context.get(namespace);
	if (!ctx) return;
	// const syntaxKind = ts.SyntaxKind[node.kind];
	// console.log({ syntaxKind, text: node.getText(), namespace });

	if (ts.isFunctionDeclaration(node)) {
		// Handle function hoisting
		const calledFunction = ctx.fnCalls[namespace];
		if (calledFunction) {
			ctx.fnCalls[namespace] = { ...calledFunction, namespace };
		}

		namespace = ts.getNameOfDeclaration(node)?.getText() || namespace;
		context.set(namespace, createCtx({ namespace }));
	}

	if (ts.isVariableDeclaration(node)) {
		const type = typeChecker.getTypeAtLocation(node);
		const typeName = typeChecker.typeToString(type, node);
		const name = ts.getNameOfDeclaration(node)?.getText() || '';
		const locals = ctx?.locals;

		locals[name] = { name, type: getType(typeName) };
		context.set(namespace, { ...ctx, locals });
	}

	if (ts.isBinaryExpression(node)) {
		const name = node.getFirstToken()?.getText() as string;
		const isLocal = ctx?.locals[name];

		if (isLocal) {
			context.set(namespace, { ...ctx, mutatesInScope: true });
		} else {
			context.set(namespace, { ...ctx, mutatesOutsideScope: true });
		}
		// switch (node.getFirstToken().kind) {
		// 	case ts.SyntaxKind.ElementAccessExpression: {
		// 	}
		// 	case ts.SyntaxKind.PropertyAccessExpression: {
		// 	}
		// 	case ts.SyntaxKind.Identifier: {
		// 	}
		// }
	}

	if (ts.isCallExpression(node)) {
		const name = node.expression.getText();
		context.set(namespace, { ...ctx, fnCalls: { [name]: { name, namespace } } });
	}

	node.forEachChild((child) => {
		checkNode(child, context, typeChecker, namespace);
	});
}

function getType(typeName: string): string {
	if (typeName.includes('[]')) {
		return 'Array';
	}
	return '';
}
