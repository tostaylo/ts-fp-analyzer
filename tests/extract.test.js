const { processFiles, createDefaultCtx } = require('../bin/src/extract');

const def = new Map();
def.set('global', createDefaultCtx());
def.set('one', createDefaultCtx('one'));

test('detects function declaration', () => {
	expect(processFiles(['subjects/functionDec.ts'])).toEqual(def);
});
