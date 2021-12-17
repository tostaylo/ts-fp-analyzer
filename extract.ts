import * as ts from 'typescript';

function createDefaultCtx(namespace: string = '') {
	return { namespace, fnCalls: {}, locals: {}, mutatesInScope: false, mutatesOutsideScope: false };
}

type Context = { fnCalls: any; locals: any; mutatesInScope: boolean; mutatesOutsideScope: boolean };

const context: Map<string, Context> = new Map();

context.set('global', createDefaultCtx());

export function processFiles(filenames: string[]) {
	filenames.forEach((filename) => {
		const program = ts.createProgram([filename], {});
		const sourceFile = program.getSourceFile(filename);
		const typeChecker = program.getTypeChecker();

		// let codeAsString = fs.readFileSync(filename).toString();
		// const sourceFile: ts.SourceFile = ts.createSourceFile(filename, codeAsString, ts.ScriptTarget.Latest);

		sourceFile?.forEachChild((node: ts.Node) => {
			checkNode(node, typeChecker);
		});

		logContext();
	});
}

function checkNode(node: ts.Node, typeChecker: ts.TypeChecker, namespace: string = 'global') {
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
		context.set(namespace, createDefaultCtx(namespace));
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
		checkNode(child, typeChecker, namespace);
	});
}

function getType(typeName: string): string {
	if (typeName.includes('[]')) {
		return 'Array';
	}
	return '';
}

// for each function determine if there are any other function calls, mutations
// if function calls or mutations determine if those are local or outside the scope of the function
// will need to keep track of local variables of function to determine if mutating.

// if no function calls and we return a value it is a calculation

// if function returns something and it's inner function calls do not have side effects it is a calculation

//get local variables
//determine if any local variables are reassigned

function logContext() {
	context.forEach((value, key) => {
		console.log('--------------------------------------');
		console.log({ namespace: key, context: value });
		console.log('locals');
		console.log(
			Object.entries(value.locals).forEach(([key, val]) => {
				console.log(key, val);
			})
		);
		console.log('fnCalls');
		console.log(
			Object.entries(value.fnCalls).forEach(([key, val]) => {
				console.log(key, val);
			})
		);
		console.log('--------------------------------------');
	});
}
