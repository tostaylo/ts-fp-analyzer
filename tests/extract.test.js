const { processFiles, createDefaultCtx } = require('../bin/extract');

const def = new Map();
def.set('global', createDefaultCtx());
def.set('one', createDefaultCtx('one'));

test('detects function declaration', () => {
	expect(processFiles(['testfile.ts'])).toEqual(def);
});