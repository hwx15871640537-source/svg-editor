import { Shape } from './Shape.ts';
import { Group } from './Group.ts';
export class Document {
  private w: number;
  private h: number;
  private readonly rootNodes: Shape[] = [];
  constructor(width = 800, height = 600) { this.w = width; this.h = height; this.resize(width,height); }
  get width(): number { return this.w; }
  get height(): number { return this.h; }
  get children(): readonly Shape[] { return this.rootNodes.slice(); }
  resize(w: number,h: number): void {
    if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) throw new Error('canvas dimensions must be positive');
    this.w=w; this.h=h;
  }
  all(): Shape[] {
    const out: Shape[]=[];
    const walk=(nodes: readonly Shape[]):void=>{ for(const n of nodes){ out.push(n); walk(n.children); } };
    walk(this.children); return out;
  }
  find(id: string): Shape { const s=this.all().find(s=>s.id===id); if(!s)throw new Error(`no such shape: ${id}`); return s; }
  container(id: string): Group {
    const s=this.all().find(s=>s.id===id);
    if(!s)throw new Error(`no such container: ${id}`);
    if(!(s instanceof Group))throw new Error(`not a container: ${id}`);
    return s;
  }
  ensureFree(id: string): void { if(this.all().some(s=>s.id===id))throw new Error(`id already exists: ${id}`); }
  parent(shape: Shape): Group | undefined { return this.all().find(s=>s.children.includes(shape)) as Group | undefined; }
  siblings(shape: Shape): readonly Shape[] { return this.parent(shape)?.children ?? this.children; }
  insert(shape: Shape,parent?: Group,index?: number): void {
    const incoming: Shape[]=[];
    const walk=(s:Shape):void=>{incoming.push(s);for(const c of s.children)walk(c);}; walk(shape);
    const seen=new Set<string>();
    for(const s of incoming){this.ensureFree(s.id);if(seen.has(s.id))throw new Error(`id already exists: ${s.id}`);seen.add(s.id);}
    if(parent)parent.insert(shape,index);else this.rootNodes.splice(index??this.rootNodes.length,0,shape);
  }
  detach(shape: Shape): void {
    const parent=this.parent(shape);
    if(parent)parent.remove(shape);else {const i=this.rootNodes.indexOf(shape);if(i<0)throw new Error('shape is not in document');this.rootNodes.splice(i,1);}
  }
  isAncestor(a: Shape,b: Shape): boolean { return a.children.some(c=>c===b||this.isAncestor(c,b)); }
  regroup(id: string,ids: string[]): Group {
    this.ensureFree(id);
    if(!ids.length)throw new Error('group requires at least one shape');
    if(new Set(ids).size!==ids.length)throw new Error('duplicate group member');
    const selected=ids.map(i=>this.find(i));
    for(const s of selected)if(selected.some(t=>t!==s&&this.isAncestor(s,t)))throw new Error(`cannot group a container into its own descendant: ${s.id}`);
    const ordered=this.all().filter(s=>selected.includes(s));
    const first=ordered[0], parent=this.parent(first), index=this.siblings(first).indexOf(first);
    for(const s of ordered)this.detach(s);
    const group=new Group(id);for(const s of ordered)group.insert(s);
    this.insert(group,parent,index);return group;
  }
  ungroup(id: string): void {
    const g=this.container(id),parent=this.parent(g);
    if(!parent)throw new Error(`cannot ungroup top-level container: ${id}`);
    const index=parent.children.indexOf(g), children=g.children;
    this.detach(g);for(const c of children)g.remove(c);
    children.forEach((c,i)=>this.insert(c,parent,index+i));
  }
  addTo(gid: string,id: string): void {
    const g=this.container(gid),s=this.find(id);
    if(g===s||this.isAncestor(s,g))throw new Error(`cannot add a container into its own descendant: ${id}`);
    this.detach(s);this.insert(s,g);
  }
  reorder(id: string,front: boolean): void {
    const s=this.find(id),p=this.parent(s);this.detach(s);this.insert(s,p,front?undefined:0);
  }
  clone(): Document { const d=new Document(this.w,this.h);for(const s of this.rootNodes)d.insert(s.clone());return d; }
}
