import { Ctx } from '../types';

export const defaultCtx: Ctx = {
	namespace: '',
	kind: '',
	locals: {},
	mutatesInScope: false,
	mutatesOutsideScope: false,
	fnCalls: {},
	childFns: [],
};
