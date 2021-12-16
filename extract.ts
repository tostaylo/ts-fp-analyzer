import * as ts from 'typescript';

type Context = { locals: any; mutatesInScope: boolean; mutatesOutsideScope: boolean };
const context: Map<string, Context> = new Map();
//TODO: default Context object needed. Class instance perhaps
context.set('global', { locals: {}, mutatesInScope: false, mutatesOutsideScope: false });

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

		console.log({ context });
	});
}

function checkNode(node: ts.Node, typeChecker: ts.TypeChecker, namespace: string = 'global') {
	// const syntaxKind = ts.SyntaxKind[node.kind];
	// console.log({ syntaxKind, text: node.getText(), namespace });

	if (ts.isFunctionDeclaration(node)) {
		namespace = ts.getNameOfDeclaration(node)?.getText() || namespace;
		context.set(namespace, { locals: {}, mutatesInScope: false, mutatesOutsideScope: false });
	}

	if (ts.isVariableDeclaration(node)) {
		const type = typeChecker.getTypeAtLocation(node);
		const typeName = typeChecker.typeToString(type, node);
		const name = ts.getNameOfDeclaration(node)?.getText() || '';

		const ctx = context.get(namespace);
		const locals = ctx?.locals;
		locals[name] = { type: getType(typeName) };
		context.set(namespace, { ...ctx, locals } as Context);
	}

	if (ts.isBinaryExpression(node)) {
		const name = node.getFirstToken()?.getText();
		const ctx = context.get(namespace);
		const isLocal = ctx?.locals[name as string];
		if (isLocal) {
			console.log({ isLocal: true, namespace, name });
			console.log('mutation in scope');
		} else {
			console.log({ isLocal: false, namespace, name });
			console.log('mutation out of scope');
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
