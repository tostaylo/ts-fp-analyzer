import { Ctx } from '../types';

export function createLocal(name: string, type = ''): Ctx['locals'] {
	return { [name]: { name, type } };
}

export function createLocals(currentLocals: Ctx['locals'], newLocals: [[string, string]]): Ctx['locals'] {
	return newLocals.reduce((acc, next) => {
		return { ...acc, ...createLocal(next[0], next[1]) };
	}, currentLocals);
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
