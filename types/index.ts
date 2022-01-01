export type FnCall = { name: string; namespace: string };
export type Local = { name: string; type: string };
export type Param = { name: string; type: string };

export type Ctx = {
	fnCalls: { [key: string]: FnCall };
	locals: { [key: string]: Local };
	params: { [key: string]: Param };
	mutatesInScope: boolean;
	mutatesOutsideScope: boolean;
	accesses: { inScope: boolean; outsideScope: boolean };
	namespace: string;
	kind: string;
	childFns: string[];
	returns: string[];
};

export type ContextMap = Map<string, Ctx>;
