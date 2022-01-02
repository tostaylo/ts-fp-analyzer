import { ContextMap, Ctx, FnCall, Local, Param } from '../types';

export function createFnCall({ name, namespace, lib = false, mutates = false }: FnCall): Ctx['fnCalls'] {
	return { [`${namespace}.${name}`]: { name, namespace, lib, mutates } };
}

export function createFnCalls(currentFnCalls: Ctx['fnCalls'], newFnCalls: FnCall[]): Ctx['fnCalls'] {
	return newFnCalls.reduce((acc, { name, namespace, lib, mutates }) => {
		return { ...acc, ...createFnCall({ name, namespace, lib, mutates }) };
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

export function createParam({ name, type }: Param): Ctx['params'] {
	return { [name]: { name, type } };
}

export function createParams(currentLocals: Ctx['params'], newLocals: Param[]): Ctx['params'] {
	return newLocals.reduce((acc, { name, type }) => {
		return { ...acc, ...createParam({ name, type }) };
	}, currentLocals);
}

export function createCtx({
	// don't provide defaults because these values are required
	namespace,
	kind,
	// optional
	fnCalls = {},
	locals = {},
	params = {},
	childFns = [],
	returns = [],
	mutates = { inScope: false, outsideScope: false },
	accesses = { inScope: false, outsideScope: false },
}: Ctx): Ctx {
	return { namespace, kind, fnCalls, locals, params, mutates, childFns, accesses, returns };
}

export function setNewContext(context: ContextMap, contextName: string, ctx: Ctx) {
	context.set(contextName, createCtx(ctx));
}

export function addToCtx(context: ContextMap, namespace: string, currentCtx: Ctx, newCtx: Partial<Ctx>) {
	context.set(namespace, { ...currentCtx, ...newCtx });
}
