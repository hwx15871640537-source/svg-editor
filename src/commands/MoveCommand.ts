import { Document } from "../model/Document.ts";
import { Command } from "./Command.ts";
export class MoveCommand extends Command {
  private readonly id: string;
  private readonly dx: number;
  private readonly dy: number;
  constructor(id: string, dx: number, dy: number) {
    super();
    this.id = id;
    this.dx = dx;
    this.dy = dy;
  }
  protected apply(d: Document): { forward: string; backward: string } {
    const s = d.find(this.id),
      before = s.position();
    s.move(this.dx, this.dy);
    return s.isContainer
      ? {
          forward: `${s.label} moved by (${this.dx},${this.dy})`,
          backward: `${s.label} moved back by (${-this.dx},${-this.dy})`,
        }
      : {
          forward: `${s.label} moved to ${s.position()}`,
          backward: `${s.label} moved back to ${before}`,
        };
  }
}
