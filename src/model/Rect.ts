import { Shape } from "./Shape.ts";
export class Rect extends Shape {
  constructor(id: string, x: number, y: number, width: number, height: number) {
    super(id, { x, y, width, height });
  }
  get type(): string {
    return "rect";
  }
  clone(): Rect {
    return this.copyInto(
      new Rect(
        this.id,
        this.number("x"),
        this.number("y"),
        this.number("width"),
        this.number("height"),
      ),
    );
  }
  move(dx: number, dy: number): void {
    this.shift("x", dx);
    this.shift("y", dy);
  }
  position(): string {
    return this.point("x", "y");
  }
  summary(): string {
    return `x=${this.number("x")} y=${this.number("y")} w=${this.number("width")} h=${this.number("height")}`;
  }
}
