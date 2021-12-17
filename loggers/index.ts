import { ContextMap } from '../types';

export function logContext(context: ContextMap) {
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
