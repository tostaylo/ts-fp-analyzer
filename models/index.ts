import { Ctx } from '../types';

export const defaultCtx: Ctx = {
	namespace: '',
	kind: '',
	locals: {},
	params: {},
	mutatesInScope: false,
	mutatesOutsideScope: false,
	accesses: { inScope: false, outsideScope: false },
	fnCalls: {},
	childFns: [],
	returns: [],
};
