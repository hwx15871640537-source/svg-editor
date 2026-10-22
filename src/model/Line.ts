import { Shape } from './Shape.ts';
export class Line extends Shape {
  constructor(id: string, x1: number, y1: number, x2: number, y2: number) { super(id, { x1, y1, x2, y2 }); }
  get type(): string { return 'line'; }
  clone(): Line { return this.copyInto(new Line(this.id, this.number('x1'), this.number('y1'), this.number('x2'), this.number('y2'))); }
  move(dx: number, dy: number): void { this.shift('x1', dx); this.shift('y1', dy); this.shift('x2', dx); this.shift('y2', dy); }
  position(): string { return this.point('x1','y1'); }
  summary(): string { return `${this.point('x1','y1')} -> ${this.point('x2','y2')}`; }
}
