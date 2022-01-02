export type FnCall = { name: string; namespace: string; mutates: boolean; lib: boolean };
export type Local = { name: string; type: string };
export type Param = { name: string; type: string };

export type Ctx = {
	fnCalls: { [key: string]: FnCall };
	locals: { [key: string]: Local };
	params: { [key: string]: Param };
	mutates: { inScope: boolean; outsideScope: boolean };
	accesses: { inScope: boolean; outsideScope: boolean };
	namespace: string;
	kind: string;
	childFns: string[];
	returns: string[];
};

export type ContextMap = Map<string, Ctx>;
