export type FnCall = { name: string; namespace: string };
export type Local = { name: string; type: string };

export type Ctx = {
	fnCalls: { [key: string]: FnCall };
	locals: { [key: string]: Local };
	mutatesInScope: boolean;
	mutatesOutsideScope: boolean;
	namespace: string;
	kind: string;
	childFns: string[];
	returns: string[];
};

export type ContextMap = Map<string, Ctx>;
