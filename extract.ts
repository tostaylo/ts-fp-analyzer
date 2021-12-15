import * as ts from 'typescript';

let locals = new Map();

export function processFiles(filenames: string[]) {
	filenames.forEach((filename) => {
		const program = ts.createProgram([filename], {});
		const sourceFile = program.getSourceFile(filename);
		const typeChecker = program.getTypeChecker();
		const rootNodes: ts.Node[] = [];

		// let codeAsString = fs.readFileSync(filename).toString();
		// const sourceFile: ts.SourceFile = ts.createSourceFile(filename, codeAsString, ts.ScriptTarget.Latest);

		sourceFile.forEachChild((child: ts.Node) => {
			rootNodes.push(child);
		});

		rootNodes.forEach((node: ts.Node) => {
			checkNodes(node, typeChecker);
		});
		console.log({ locals });
	});
}

function checkNodes(node: ts.Node, typeChecker: ts.TypeChecker) {
	node.forEachChild((child) => {
		const syntaxKind = ts.SyntaxKind[child.kind];
		console.log({ syntaxKind, text: child.getText() });

		if (ts.isVariableDeclaration(child)) {
			const type = typeChecker.getTypeAtLocation(child);
			const typeName = typeChecker.typeToString(type, child);
			const name = ts.getNameOfDeclaration(child).getText();

			locals.set(name, getType(typeName));
		}

		if (ts.isBinaryExpression(child)) {
			if (locals.has(child.getFirstToken().getText())) {
				console.log('local');
			}
			// switch (child.getFirstToken().kind) {
			// 	case ts.SyntaxKind.ElementAccessExpression: {
			// 	}
			// 	case ts.SyntaxKind.PropertyAccessExpression: {
			// 	}
			// 	case ts.SyntaxKind.Identifier: {
			// 	}
			// }
		}

		checkNodes(child, typeChecker);
	});
}

function getType(typeName: string) {
	if (typeName.includes('[]')) {
		return 'Array';
	}
}

// for each function determine if there are any other function calls, mutations
// if function calls or mutations determine if those are local or outside the scope of the function
// will need to keep track of local variables of function to determine if mutating.

// if no function calls and we return a value it is a calculation

// if function returns something and it's inner function calls do not have side effects it is a calculation

//get local variables
//determine if any local variables are reassigned
