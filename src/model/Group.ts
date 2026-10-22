import { Shape } from './Shape.ts';
export class Group extends Shape {
  private readonly nodes: Shape[] = [];
  constructor(id: string) { super(id, {}); }
  get type(): string { return 'g'; }
  get isContainer(): boolean { return true; }
  get children(): readonly Shape[] { return this.nodes.slice(); }
  insert(shape: Shape, index = this.nodes.length): void {
    if (shape === this || this.contains(shape, this)) throw new Error(`cannot add a container into its own descendant: ${shape.id}`);
    this.nodes.splice(index,0,shape);
  }
  private contains(root: Shape, target: Shape): boolean { return root.children.some(s => s === target || this.contains(s,target)); }
  remove(shape: Shape): void { const i = this.nodes.indexOf(shape); if (i < 0) throw new Error('shape is not a child'); this.nodes.splice(i,1); }
  clone(): Group { const g = this.copyInto(new Group(this.id)); for (const s of this.nodes) g.insert(s.clone()); return g; }
  move(dx: number, dy: number): void { for (const child of this.nodes) child.move(dx,dy); }
  scale(factor: number): void { super.scale(factor); for (const child of this.nodes) child.scale(factor); }
  summary(): string { return ''; }
}
