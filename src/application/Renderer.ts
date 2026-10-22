import { Document } from '../model/Document.ts';
import { Shape } from '../model/Shape.ts';
export class Renderer {
  tree(document:Document,id?:string):string {
    const root=id===undefined?undefined:document.find(id),lines:string[]=[];
    const nodes=root?[root]:document.all();const width=Math.max(0,...nodes.map(s=>s.label.length))+2;
    const description=(s:Shape):string=>{
      const detail=[s.summary(),s.styleSummary()].filter(Boolean).join(' ');
      return detail?s.label.padEnd(width)+detail:s.label;
    };
    const walk=(children:readonly Shape[],prefix:string):void=>{
      children.forEach((s,i)=>{const last=i===children.length-1;lines.push(prefix+(last?'└── ':'├── ')+description(s));walk(s.children,prefix+(last?'    ':'│   '));});
    };
    if(root){lines.push(description(root));walk(root.children,'');}
    else {lines.push(`svg (${document.width}x${document.height})`);walk(document.children,'');}
    return lines.join('\n');
  }
  show(document:Document,id:string):string {
    const s=document.find(id),a=s.attributes(),geometry=Object.entries(a).filter(([k])=>!['id','fill','stroke','stroke-width'].includes(k)).map(([k,v])=>`${k}=${v}`).join(' ');
    const lines=[`${s.label}  parent=${document.parent(s)?.label??'svg'}`];
    if(geometry)lines.push('  '+geometry);if(s.content!==undefined)lines.push('  text='+JSON.stringify(s.content));if(s.styleSummary())lines.push('  '+s.styleSummary());
    return lines.join('\n');
  }
}
