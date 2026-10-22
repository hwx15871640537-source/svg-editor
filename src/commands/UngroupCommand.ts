import { Document } from "../model/Document.ts";
import { Command } from "./Command.ts";
export class UngroupCommand extends Command {
  private readonly id: string;
  constructor(id: string) {
    super();
    this.id = id;
  }
  protected apply(d: Document): { forward: string; backward: string } {
    const label = d.find(this.id).label;
    d.ungroup(this.id);
    return { forward: `${label} ungrouped`, backward: `${label} restored` };
  }
}
