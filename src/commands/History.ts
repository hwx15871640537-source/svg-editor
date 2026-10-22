import { Document } from "../model/Document.ts";
import { Command } from "./Command.ts";
export class History {
  private past: Command[] = [];
  private future: Command[] = [];
  private blocked = false;
  barrier(): void {
    this.past = [];
    this.future = [];
    this.blocked = true;
  }
  execute(
    command: Command,
    document: Document,
  ): { document: Document; message: string } {
    const result = command.execute(document);
    this.past.push(command);
    this.future = [];
    this.blocked = false;
    return result;
  }
  undo(): { document: Document; message: string } {
    if (this.blocked) throw new Error("undo not allowed after io command");
    const c = this.past.at(-1);
    if (!c) throw new Error("nothing to undo");
    const result = c.undo();
    this.past.pop();
    this.future.push(c);
    return result;
  }
  redo(): { document: Document; message: string } {
    if (this.blocked) throw new Error("undo not allowed after io command");
    const c = this.future.at(-1);
    if (!c) throw new Error("nothing to redo");
    const result = c.redo();
    this.future.pop();
    this.past.push(c);
    return result;
  }
}
