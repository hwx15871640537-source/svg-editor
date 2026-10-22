import { Document } from "../model/Document.ts";
import { Command } from "./Command.ts";
export class GroupCommand extends Command {
  private readonly id: string;
  private readonly ids: string[];
  constructor(id: string, ids: string[]) {
    super();
    this.id = id;
    this.ids = ids.slice();
  }
  protected apply(d: Document): { forward: string; backward: string } {
    const g = d.regroup(this.id, this.ids);
    return {
      forward: `${g.label} created with ${g.children.length} children`,
      backward: `${g.label} grouping undone`,
    };
  }
}
