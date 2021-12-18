import { Ctx } from '../types';

export function createFnCall(name: string, namespace: string): Ctx['fnCalls'] {
	return { [name]: { name, namespace } };
}

export function createFnCalls(currentFnCalls: Ctx['fnCalls'], newFnCalls: [[string, string]]): Ctx['fnCalls'] {
	return newFnCalls.reduce((acc, next) => {
		return { ...acc, ...createFnCall(next[0], next[1]) };
	}, currentFnCalls);
}

export function createLocal(name: string, type = ''): Ctx['locals'] {
	return { [name]: { name, type } };
}

export function createLocals(currentLocals: Ctx['locals'], newLocals: [[string, string]]): Ctx['locals'] {
	return newLocals.reduce((acc, next) => {
		return { ...acc, ...createLocal(next[0], next[1]) };
	}, currentLocals);
}

export function createCtx({
	namespace,
	kind,
	fnCalls = {},
	locals = {},
	mutatesInScope = false,
	mutatesOutsideScope = false,
}: Ctx): Ctx {
	return { namespace, kind, fnCalls, locals, mutatesInScope, mutatesOutsideScope };
}
