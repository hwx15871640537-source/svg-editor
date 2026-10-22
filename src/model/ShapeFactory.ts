import { Shape } from './Shape.ts';
import { Rect } from './Rect.ts';
import { Circle } from './Circle.ts';
import { Ellipse } from './Ellipse.ts';
import { Line } from './Line.ts';
import { Text } from './Text.ts';
import { Group } from './Group.ts';
type Definition = { keys: string[]; required: number; style?: string; build: (id:string,n:number[],p:string[])=>Shape };
export class ShapeFactory {
  // Name dispatch site 2/2: replace built-in registry with ShapeProvider in a later phase.
  private readonly definitions = new Map<string,Definition>([
    ['rect',{keys:['x','y','width','height'],required:4,style:'fill',build:(id,n)=>new Rect(id,n[0],n[1],n[2],n[3])}],
    ['circle',{keys:['cx','cy','r'],required:3,style:'fill',build:(id,n)=>new Circle(id,n[0],n[1],n[2])}],
    ['ellipse',{keys:['cx','cy','rx','ry'],required:4,style:'fill',build:(id,n)=>new Ellipse(id,n[0],n[1],n[2],n[3])}],
    ['line',{keys:['x1','y1','x2','y2'],required:4,style:'stroke',build:(id,n)=>new Line(id,n[0],n[1],n[2],n[3])}],
    ['text',{keys:['x','y'],required:3,build:(id,n,p)=>new Text(id,n[0],n[1],p[2])}],
    ['g',{keys:[],required:0,build:(id)=>new Group(id)}]
  ]);
  private definition(type:string):Definition {
    const d=this.definitions.get(type);if(!d)throw new Error(`unknown shape type: ${type} (is the plugin loaded?)`);return d;
  }
  create(type:string,id:string,params:string[]):Shape {
    const d=this.definition(type);
    if(params.length<d.required||params.length>d.required+(d.style?1:0))throw new Error(`invalid arguments for create ${type}`);
    const nums=d.keys.map((key,i)=>{const v=params[i]?.trim()===''?NaN:Number(params[i]);if(!Number.isFinite(v))throw new Error(`invalid number: ${key}`);return v;});
    const s=d.build(id,nums,params);if(d.style&&params.length>d.required)s.set(d.style,params[d.required]);return s;
  }
  fromAttributes(type:string,id:string,attrs:Record<string,string>,text:string):Shape {
    const d=this.definition(type);
    const params=d.keys.map(k=>attrs[k]??'0');if(type==='text')params.push(text);
    const s=this.create(type,id,params);
    for(const k of ['fill','stroke','stroke-width'])if(attrs[k]!==undefined)s.set(k,attrs[k]);
    return s;
  }
}
