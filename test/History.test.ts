import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Document } from '../src/model/Document.ts';
import { History } from '../src/commands/History.ts';
import { CreateCommand } from '../src/commands/CreateCommand.ts';
import { MoveCommand } from '../src/commands/MoveCommand.ts';
import { GroupCommand } from '../src/commands/GroupCommand.ts';
import { SetCommand } from '../src/commands/SetCommand.ts';
test('one group command is one undo unit; redo branch and failure atomicity',()=>{
 const h=new History();let d=new Document();
 for(const id of ['a','b'])d=h.execute(new CreateCommand('rect',id,['0.1','0.2','3','4']),d).document;
 d=h.execute(new GroupCommand('g',['b','a']),d).document;
 assert.equal(d.children.length,1);d=h.undo().document;assert.deepEqual(d.children.map(s=>s.id),['a','b']);d=h.redo().document;
 d=h.execute(new MoveCommand('g',0.2,0.3),d).document;d=h.undo().document;
 assert.equal(d.find('a').attributes().x,'0.1');
 assert.throws(()=>h.execute(new SetCommand('a','wrong','x'),d),/unknown attribute/);
 d=h.redo().document;assert.equal(d.find('a').attributes().x,'0.30000000000000004');
 d=h.undo().document;d=h.execute(new SetCommand('g','fill','red'),d).document;
 assert.throws(()=>h.redo(),/nothing to redo/);assert.equal(d.find('g').attributes().fill,'red');
});
test('I/O blocks undo and redo until successful edit',()=>{
 const h=new History();let d=new Document();h.barrier();
 assert.throws(()=>h.undo(),/^Error: undo not allowed after io command$/);
 assert.throws(()=>h.redo(),/^Error: undo not allowed after io command$/);
 assert.throws(()=>h.execute(new MoveCommand('bad',1,2),d));assert.throws(()=>h.undo(),/io command/);
 d=h.execute(new CreateCommand('g','g',[]),d).document;assert.equal(h.undo().document.children.length,0);
});
