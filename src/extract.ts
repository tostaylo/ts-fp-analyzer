import * as ts from 'typescript';
import { ContextMap, Ctx } from '../types';
import { createLocal, createFnCall, addToCtx, setNewContext, createParam } from '../utils';

// add a child pointer to the parent node

export function processFiles(filenames: string[]): ContextMap {
	const context: ContextMap = new Map();

	setNewContext(context, 'global', { namespace: 'global', kind: 'global' } as Ctx);

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
		const contextName = `${namespace}.${name}`;

		const childFns = [...ctx.childFns];
		childFns.push(name);

		setNewContext(context, contextName, { namespace, kind: ts.SyntaxKind[node.kind] } as Ctx);
		addToCtx(context, namespace, ctx, { childFns });
		namespace = contextName;
	}

	if (ts.isArrowFunction(node) || ts.isFunctionExpression(node)) {
		if (ts.isVariableDeclaration(parent)) {
			const name = ts.getNameOfDeclaration(parent)?.getText() || '';
			const contextName = `${namespace}.${name}`;

			const childFns = [...ctx.childFns];
			childFns.push(name);

			setNewContext(context, contextName, { namespace, kind: ts.SyntaxKind[node.kind] } as Ctx);
			addToCtx(context, namespace, ctx, { childFns });
			namespace = contextName;
		}
	}

	if (ts.isVariableDeclaration(node)) {
		const type = typeChecker.getTypeAtLocation(node);
		const typeName = typeChecker.typeToString(type, node);
		const name = ts.getNameOfDeclaration(node)?.getText() || '';
		const locals = ctx?.locals;
		const local = createLocal({ name, type: typeName });

		addToCtx(context, namespace, ctx, { locals: { ...locals, ...local } });
	}

	if (ts.isBinaryExpression(node)) {
		const child = node.getChildAt(0);
		const firstToken = node.getFirstToken();
		const name = firstToken?.getText() as string;
		const isLocal = ctx?.locals[name];
		const isParam = ctx?.params[name];

		if (
			(isParam && child.kind === ts.SyntaxKind.PropertyAccessExpression) ||
			child.kind === ts.SyntaxKind.ElementAccessExpression
		) {
			// handle object and array assignment from params - mutates from a outer scope
			// a.hi = "bye"  b[0] = 2
			addToCtx(context, namespace, ctx, { mutatesOutsideScope: true });
		} else if (isParam) {
			// handle primitives variable reassignment from params like strings or numbers
			// a = 2
			addToCtx(context, namespace, ctx, { mutatesInScope: true });
		} else if (isLocal) {
			addToCtx(context, namespace, ctx, { mutatesInScope: true });
		} else {
			addToCtx(context, namespace, ctx, { mutatesOutsideScope: true });
		}
	}

	// How to detect reads from outside scope??????
	// Do I care?
	//

	// How to detect actions vs calculations
	// An action has side effects
	// A calculation does not cause side effects directly or through calling functions, must not read from out of scope???, and must a return a value

	// if (ts.isPropertyAccessExpression(node)) {
	// 	console.log({ node, parent, parentKind: ts.SyntaxKind[parent.kind] });
	// }

	// if (ts.isElementAccessExpression(node)) {
	// 	console.log({ node, parent, parentKind: ts.SyntaxKind[parent.kind] });
	// }

	if (ts.isParameter(node)) {
		const type = typeChecker.getTypeAtLocation(node);
		const typeName = typeChecker.typeToString(type, node);
		const name = ts.getNameOfDeclaration(node)?.getText() || '';
		const params = ctx?.params;
		const param = createParam({ name, type: typeName });

		addToCtx(context, namespace, ctx, { params: { ...params, ...param } });
	}

	if (ts.isCallExpression(node)) {
		const name = node.expression.getText();
		const fnCalls = ctx?.fnCalls;
		const fnCall = createFnCall({ name, namespace });

		addToCtx(context, namespace, ctx, { fnCalls: { ...fnCalls, ...fnCall } });
	}

	if (ts.isReturnStatement(node)) {
		const returns = ctx?.returns;
		returns.push(node.expression?.getText() || 'no expression text');

		addToCtx(context, namespace, ctx, { returns });
	}

	node.forEachChild((child) => {
		checkNode(child, context, typeChecker, namespace, node);
	});
}
