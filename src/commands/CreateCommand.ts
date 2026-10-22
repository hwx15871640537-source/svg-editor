import { Document } from "../model/Document.ts";
import { ShapeFactory } from "../model/ShapeFactory.ts";
import { Command } from "./Command.ts";
export class CreateCommand extends Command {
  private readonly factory = new ShapeFactory();
  private readonly kind: string;
  private readonly id: string;
  private readonly params: string[];
  private readonly parentId?: string;
  constructor(kind: string, id: string, params: string[], parentId?: string) {
    super();
    this.kind = kind;
    this.id = id;
    this.params = params.slice();
    this.parentId = parentId;
  }
  protected apply(d: Document): { forward: string; backward: string } {
    d.ensureFree(this.id);
    const s = this.factory.create(this.kind, this.id, this.params);
    const parent =
      this.parentId === undefined ? undefined : d.container(this.parentId);
    d.insert(s, parent);
    return {
      forward: `${s.label} created${parent ? " in " + parent.label : ""}`,
      backward: `${s.label} deleted`,
    };
  }
}
