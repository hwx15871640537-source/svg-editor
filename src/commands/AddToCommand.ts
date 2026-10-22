import { Document } from "../model/Document.ts";
import { Command } from "./Command.ts";
export class AddToCommand extends Command {
  private readonly gid: string;
  private readonly id: string;
  constructor(gid: string, id: string) {
    super();
    this.gid = gid;
    this.id = id;
  }
  protected apply(d: Document): { forward: string; backward: string } {
    const s = d.find(this.id),
      parent = d.parent(s);
    d.addTo(this.gid, this.id);
    return {
      forward: `${s.label} added to g#${this.gid}`,
      backward: `${s.label} restored into ${parent?.label ?? "svg"}`,
    };
  }
}
