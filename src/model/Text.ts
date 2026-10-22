import { Shape } from './Shape.ts';
export class Text extends Shape {
  private value: string;
  constructor(id: string, x: number, y: number, content: string) { super(id, {x,y}); this.value = content; }
  get type(): string { return 'text'; }
  clone(): Text { return this.copyInto(new Text(this.id, this.number('x'), this.number('y'), this.value)); }
  move(dx: number, dy: number): void { this.shift('x', dx); this.shift('y', dy); }
  position(): string { return this.point('x','y'); }
  summary(): string { return `${this.position()} ${JSON.stringify(this.value)}`; }
  get content(): string { return this.value; }
  set(attr: string, value: string): void { if (attr === 'text') this.value = value; else super.set(attr,value); }
}
