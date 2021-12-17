export type Ctx = {
	fnCalls: { [key: string]: { name: string; namespace: string } };
	locals: { [key: string]: { name: string; type: string } };
	mutatesInScope: boolean;
	mutatesOutsideScope: boolean;
	namespace: string;
};

export type ContextMap = Map<string, Ctx>;
