import * as ts from 'typescript';
import { ContextMap, Ctx } from '../types';
import { createLocal, createFnCall, addToCtx, setNewContext, createParam } from '../utils';

const arrayMutators = {
	push: true,
	pop: true,
	shift: true,
	unshift: true,
	reverse: true,
	sort: true,
	splice: true,
};

function detectMethod(
	node: ts.CallExpression,
	typeChecker: ts.TypeChecker
): { lib: boolean; mutates: boolean; name: string; accessNames: string[] } {
	const firstChild = node.getChildAt(0);

	if (ts.isPropertyAccessExpression(firstChild)) {
		const symbol = typeChecker.getSymbolAtLocation(firstChild);

		// This will not work for strings
		// need to detect type of data the method is acting on before checking for Method Signature

		// method on object literal is PropertyAssignment
		// method on custom class is MethodDeclaration
		if (symbol?.valueDeclaration?.kind === ts.SyntaxKind.MethodSignature) {
			const firstToken = firstChild.getFirstToken();
			const type = typeChecker.getTypeAtLocation(firstToken as ts.Node);
			const typeName = typeChecker.typeToString(type, node);

			if (typeName === 'ObjectConstructor') {
				if (symbol.escapedName === 'assign') {
					const firstArg = node.arguments[0].getText().split('.')[0];
					const secondArg = node.arguments[1].getText().split('.')[0];
					const name = node.expression.getText();

					return { lib: true, mutates: true, name, accessNames: [firstArg, secondArg] };
				}
			}
			if (arrayMutators[symbol.escapedName as keyof typeof arrayMutators]) {
				const name = node.expression.getText();
				const accessNames = [name.split('.')[0]];

				return { lib: true, mutates: true, name, accessNames };
			}
		}
	}
	const name = node.expression.getText();
	const accessNames = [name.split('.')[0]];

	return { lib: false, mutates: false, name, accessNames };
}

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

	return context;
}

function checkNode(
	node: ts.Node,
	context: ContextMap,
	typeChecker: ts.TypeChecker,
	namespace = 'global',
	parent: ts.Node = {} as ts.Node
) {
	const ctx = context.get(namespace);
	if (!ctx) return;

	if (ts.isFunctionDeclaration(node)) {
		// Handle function hoisting
		const calledFunction = ctx.fnCalls[namespace];
		if (calledFunction) {
			ctx.fnCalls[namespace] = { ...calledFunction, namespace };
		}

		const name = ts.getNameOfDeclaration(node)?.getText() || 'no-name-declaration';
		const contextName = `${namespace}.${name}`;

		const childFns = [...ctx.childFns];
		childFns.push(name);

		setNewContext(context, contextName, { namespace, kind: ts.SyntaxKind[node.kind] } as Ctx);
		addToCtx(context, namespace, ctx, { childFns });
		namespace = contextName;
	}

	if (ts.isArrowFunction(node) || ts.isFunctionExpression(node)) {
		if (ts.isVariableDeclaration(parent)) {
			const name = ts.getNameOfDeclaration(parent)?.getText() || 'no-name-declaration';
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

		// handle object and array assignment from params - mutates from a outer scope
		// a.hi = "bye"  b[0] = 2
		if (
			(isParam && child.kind === ts.SyntaxKind.PropertyAccessExpression) ||
			child.kind === ts.SyntaxKind.ElementAccessExpression
		) {
			addToCtx(context, namespace, ctx, {
				mutates: { ...ctx.mutates, outsideScope: true },
				accesses: { ...ctx.accesses, outsideScope: true },
			});
		}
		// handle primitives variable reassignment from params like strings or numbers
		// a = 2
		else if (isParam) {
			addToCtx(context, namespace, ctx, {
				mutates: { ...ctx.mutates, inScope: true },
				accesses: { ...ctx.accesses, inScope: true },
			});
		} else if (isLocal) {
			addToCtx(context, namespace, ctx, {
				mutates: { ...ctx.mutates, inScope: true },
				accesses: { ...ctx.accesses, inScope: true },
			});
		} else {
			addToCtx(context, namespace, ctx, {
				mutates: { ...ctx.mutates, outsideScope: true },
				accesses: { ...ctx.accesses, outsideScope: true },
			});
		}
	}

	// may need to add OR here for Element Access Expression
	if (ts.isPropertyAccessExpression(node)) {
		const firstToken = node.getFirstToken();
		const type = typeChecker.getTypeAtLocation(firstToken as ts.Node);
		const typeName = typeChecker.typeToString(type, node);

		if (typeName === 'ObjectConstructor') return;

		const name = firstToken?.getText() as string;
		const isLocal = ctx?.locals[name];

		if (isLocal) {
			addToCtx(context, namespace, ctx, { accesses: { ...ctx.accesses, inScope: true } });
		} else {
			addToCtx(context, namespace, ctx, { accesses: { ...ctx.accesses, outsideScope: true } });
		}
	}

	if (ts.isParameter(node)) {
		const type = typeChecker.getTypeAtLocation(node);
		const typeName = typeChecker.typeToString(type, node);
		const name = ts.getNameOfDeclaration(node)?.getText() || '';
		const params = ctx?.params;
		const param = createParam({ name, type: typeName });

		addToCtx(context, namespace, ctx, { params: { ...params, ...param } });
	}

	if (ts.isCallExpression(node)) {
		// can I get type of variable being accessed right here?
		// detectMethod needs to know. Or I could change to
		// detectArrayMethod, detectStringMethod, detectObjectMethod, detectObjectConstructorMethod
		const { mutates, lib, name, accessNames } = detectMethod(node, typeChecker);

		const fnCall = createFnCall({ name, namespace, mutates, lib });
		const fnCalls = ctx?.fnCalls;
		const isLocal = Object.keys(ctx?.locals).some((item) => accessNames.includes(item));
		const scope = isLocal ? { inScope: true } : { outsideScope: true };
		const accesses = isLocal ? { inScope: true } : { outsideScope: true };

		if (mutates) {
			addToCtx(context, namespace, ctx, {
				mutates: { ...ctx.mutates, ...scope },
				accesses: { ...ctx.accesses, ...accesses },
				fnCalls: { ...fnCalls, ...fnCall },
			});
		} else {
			addToCtx(context, namespace, ctx, {
				accesses: { ...ctx.accesses, ...accesses },
				fnCalls: { ...fnCalls, ...fnCall },
			});
		}
	}

	// TODO: Handle returns from arrow functions
	if (ts.isReturnStatement(node)) {
		const returns = ctx?.returns;
		returns.push(node.expression?.getText() || 'no expression text');

		addToCtx(context, namespace, ctx, { returns });
	}

	node.forEachChild((child) => {
		checkNode(child, context, typeChecker, namespace, node);
	});
}
