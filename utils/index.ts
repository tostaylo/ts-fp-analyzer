import { Ctx } from '../types';

type FnCall = { name: string; namespace: string };
type Local = { name: string; type: string };

export function createFnCall({ name, namespace }: FnCall): Ctx['fnCalls'] {
	return { [name]: { name, namespace } };
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
	namespace,
	kind,
	fnCalls = {},
	locals = {},
	mutatesInScope = false,
	mutatesOutsideScope = false,
}: Ctx): Ctx {
	return { namespace, kind, fnCalls, locals, mutatesInScope, mutatesOutsideScope };
}
