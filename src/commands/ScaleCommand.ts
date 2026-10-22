import { Document } from "../model/Document.ts";
import { Command } from "./Command.ts";
export class ScaleCommand extends Command {
  private readonly id: string;
  private readonly factor: number;
  constructor(id: string, factor: number) {
    super();
    this.id = id;
    this.factor = factor;
  }
  protected apply(d: Document): { forward: string; backward: string } {
    const s = d.find(this.id);
    s.scale(this.factor);
    return {
      forward: `${s.label} scaled by ${this.factor}`,
      backward: `${s.label} scale restored`,
    };
  }
}
