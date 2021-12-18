import * as ts from 'typescript';
import { ContextMap, Ctx } from '../types';
import { createCtx, createLocal, createFnCall } from '../utils';

export function processFiles(filenames: string[]): ContextMap {
	const context: ContextMap = new Map();
	context.set('global', createCtx({ namespace: 'global', kind: 'global' } as Ctx));

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
	// console.log(context);
	return context;
}

//namespace needs to be an array to show heirarchy
function checkNode(
	node: ts.Node,
	context: ContextMap,
	typeChecker: ts.TypeChecker,
	namespace = 'global',
	parent: ts.Node = {} as ts.Node
) {
	const ctx = context.get(namespace);
	if (!ctx) return;

	// const currentKind = ts.SyntaxKind[node.kind];
	// const parentKind = ts.SyntaxKind[parent.kind];
	// console.log({ currentKind, parentKind, text: node.getText(), namespace });

	if (ts.isFunctionDeclaration(node)) {
		// Handle function hoisting
		const calledFunction = ctx.fnCalls[namespace];
		if (calledFunction) {
			ctx.fnCalls[namespace] = { ...calledFunction, namespace };
		}

		const name = ts.getNameOfDeclaration(node)?.getText() || '';
		context.set(name, createCtx({ namespace, kind: ts.SyntaxKind[node.kind] } as Ctx));
		namespace = name;
	}

	if (ts.isArrowFunction(node)) {
		if (ts.isVariableDeclaration(parent)) {
			const name = ts.getNameOfDeclaration(parent)?.getText() || '';

			context.set(namespace, createCtx({ namespace, kind: ts.SyntaxKind[node.kind] } as Ctx));
			namespace = name;
		}
	}

	if (ts.isVariableDeclaration(node)) {
		const type = typeChecker.getTypeAtLocation(node);
		const typeName = typeChecker.typeToString(type, node);
		const name = ts.getNameOfDeclaration(node)?.getText() || '';
		const locals = ctx?.locals;
		const local = createLocal(name, getType(typeName));
		// node.forEachChild((child) => {
		// 	const syntaxKind = ts.SyntaxKind[child.kind];

		// });

		context.set(namespace, { ...ctx, locals: { ...locals, ...local } });
	}

	if (ts.isFunctionExpression(node)) {
		// need to detect hoisting here too?
		// I would need to keep checking nodes recursively here
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
		const fnCalls = ctx?.fnCalls;
		const fnCall = createFnCall(name, namespace);

		context.set(namespace, { ...ctx, fnCalls: { ...fnCalls, ...fnCall } });
	}

	node.forEachChild((child) => {
		checkNode(child, context, typeChecker, namespace, node);
	});
}

function getType(typeName: string): string {
	if (typeName.includes('[]')) {
		return 'Array';
	}
	return '';
}
