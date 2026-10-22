import { Shape } from "./Shape.ts";
export class Circle extends Shape {
  constructor(id: string, cx: number, cy: number, r: number) {
    super(id, { cx, cy, r });
  }
  get type(): string {
    return "circle";
  }
  clone(): Circle {
    return this.copyInto(
      new Circle(
        this.id,
        this.number("cx"),
        this.number("cy"),
        this.number("r"),
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
    return `cx=${this.number("cx")} cy=${this.number("cy")} r=${this.number("r")}`;
  }
}
