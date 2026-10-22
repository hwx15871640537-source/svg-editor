import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
test('actual CLI: prompt, script replay, errors are single-line and EOF exits',()=>{
 const p=spawnSync(process.execPath,['src/cli/Main.ts'],{cwd:new URL('..',import.meta.url),input:'# comment\ninit\ncreate text t 1 2 "hello world"\nmove t 2 3\nundo\nshow t\ncreate box b\nset t text "unfinished\ncanvas\n',encoding:'utf8'});
 assert.equal(p.status,0,p.stderr);assert.match(p.stdout,/svg-editor 0.1 — type 'help' for commands/);assert.match(p.stdout,/svg> canvas 800x600 created/);assert.match(p.stdout,/text#t moved to \(3,5\)/);assert.match(p.stdout,/text#t moved back to \(1,2\)/);assert.match(p.stdout,/text="hello world"/);assert.match(p.stdout,/error: unknown shape type: box \(is the plugin loaded\?\)/);assert.match(p.stdout,/error: unterminated quoted argument\nsvg> canvas 800x600/);
});
