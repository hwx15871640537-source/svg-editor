import { Document } from "../model/Document.ts";
import { Command } from "./Command.ts";
export class ReorderCommand extends Command {
  private readonly id: string;
  private readonly front: boolean;
  constructor(id: string, front: boolean) {
    super();
    this.id = id;
    this.front = front;
  }
  protected apply(d: Document): { forward: string; backward: string } {
    const label = d.find(this.id).label;
    d.reorder(this.id, this.front);
    return {
      forward: `${label} moved to ${this.front ? "front" : "back"}`,
      backward: `${label} order restored`,
    };
  }
}
