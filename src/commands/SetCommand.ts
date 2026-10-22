import { Document } from '../model/Document.ts';
import { Command } from './Command.ts';
export class SetCommand extends Command {
  private readonly id:string;private readonly attr:string;private readonly value:string;
  constructor(id:string,attr:string,value:string){super();this.id=id;this.attr=attr;this.value=value;}
  protected apply(d:Document):{forward:string;backward:string}{
    const s=d.find(this.id),before=this.attr==='text'?s.content:s.attributes()[this.attr];s.set(this.attr,this.value);
    const display=(v:string|undefined):string=>v===undefined?'(unset)':this.attr==='text'?JSON.stringify(v):v;
    return {forward:`${s.label} updated: ${this.attr}=${display(this.value)}`,backward:`${s.label} updated: ${this.attr}=${display(before)}`};
  }
}
