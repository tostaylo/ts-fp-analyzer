import { Ctx } from '../types';

export const defaultCtx: Ctx = {
	namespace: '',
	kind: '',
	locals: {},
	params: {},
	mutates: { inScope: false, outsideScope: false },
	accesses: { inScope: false, outsideScope: false },
	fnCalls: {},
	childFns: [],
	returns: [],
};
