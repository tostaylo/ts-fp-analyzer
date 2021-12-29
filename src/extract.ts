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
		console.log(ts.SyntaxKind[node.getFirstToken()?.kind as any], 'first token kind');
		console.log(ts.SyntaxKind[node.getChildAt(0).kind], 'child kind');
		const name = node.getFirstToken()?.getText() as string;
		const isLocal = ctx?.locals[name];

		if (isLocal) {
			addToCtx(context, namespace, ctx, { mutatesInScope: true });
		} else {
			addToCtx(context, namespace, ctx, { mutatesOutsideScope: true });
		}
	}

	// if (ts.isPropertyAccessExpression(node)) {
	// 	console.log({ node, parent, parentKind: ts.SyntaxKind[parent.kind] });
	// }

	// isParam that we are mutating?
	// can I get param type when I collect Params? if param is object and we are mutating then we are //////////mutating a global variable. Else if number or string then we are reassigning the parameter
	// Probably can't do type but need to know if firstchild is propertyaccess expression

	// also need to detect mutating array. either by elementAccessExpression or by mutating arraymethods which would be maybe last Identifier of one of the below. and element is arraytype but the mutating array method will not occur in a binaryexpression
	//    CallExpression
	// PropertyAccessExpression
	// Identifier
	// Identifier

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
