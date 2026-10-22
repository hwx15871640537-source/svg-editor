import { Shape } from "./Shape.ts";
export class Ellipse extends Shape {
  constructor(id: string, cx: number, cy: number, rx: number, ry: number) {
    super(id, { cx, cy, rx, ry });
  }
  get type(): string {
    return "ellipse";
  }
  clone(): Ellipse {
    return this.copyInto(
      new Ellipse(
        this.id,
        this.number("cx"),
        this.number("cy"),
        this.number("rx"),
        this.number("ry"),
      ),
    );
  }
  move(dx: number, dy: number): void {
    this.shift("cx", dx);
    this.shift("cy", dy);
  }
  position(): string {
    return this.point("cx", "cy");
  }
  summary(): string {
    return `cx=${this.number("cx")} cy=${this.number("cy")} rx=${this.number("rx")} ry=${this.number("ry")}`;
  }
}
