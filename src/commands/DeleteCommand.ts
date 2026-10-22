import { Document } from '../model/Document.ts';
import { Command } from './Command.ts';
export class DeleteCommand extends Command {
  private readonly id:string;
  constructor(id:string){super();this.id=id;}
  protected apply(d:Document):{forward:string;backward:string}{
    const s=d.find(this.id),parent=d.parent(s);d.detach(s);
    return {forward:`${s.label} deleted`,backward:`${s.label} restored into ${parent?.label??'svg'}`};
  }
}
