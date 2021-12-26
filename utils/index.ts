import { ContextMap, Ctx, FnCall, Local } from '../types';

export function createFnCall({ name, namespace }: FnCall): Ctx['fnCalls'] {
	return { [`${namespace}.${name}`]: { name, namespace } };
}

export function createFnCalls(currentFnCalls: Ctx['fnCalls'], newFnCalls: FnCall[]): Ctx['fnCalls'] {
	return newFnCalls.reduce((acc, { name, namespace }) => {
		return { ...acc, ...createFnCall({ name, namespace }) };
	}, currentFnCalls);
}

export function createLocal({ name, type }: Local): Ctx['locals'] {
	return { [name]: { name, type } };
}

export function createLocals(currentLocals: Ctx['locals'], newLocals: Local[]): Ctx['locals'] {
	return newLocals.reduce((acc, { name, type }) => {
		return { ...acc, ...createLocal({ name, type }) };
	}, currentLocals);
}

export function createCtx({
	// don't provide defaults because these values are required
	namespace,
	kind,
	// optional
	fnCalls = {},
	locals = {},
	mutatesInScope = false,
	mutatesOutsideScope = false,
	childFns = [],
	returns = [],
}: Ctx): Ctx {
	return { namespace, kind, fnCalls, locals, mutatesInScope, mutatesOutsideScope, childFns, returns };
}

export function setNewContext(context: ContextMap, contextName: string, ctx: Ctx) {
	context.set(contextName, createCtx(ctx));
}

export function addToCtx(context: ContextMap, namespace: string, currentCtx: Ctx, newCtx: Partial<Ctx>) {
	context.set(namespace, { ...currentCtx, ...newCtx });
}
