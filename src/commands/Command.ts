import { Document } from '../model/Document.ts';
export abstract class Command {
  private before?: Document;
  private after?: Document;
  private forward = '';
  private backward = '';
  protected abstract apply(document: Document): {forward:string; backward:string};
  execute(document: Document): {document:Document; message:string} {
    const candidate=document.clone();
    const messages=this.apply(candidate);
    this.before=document.clone();this.after=candidate.clone();
    this.forward=messages.forward;this.backward=messages.backward;
    return {document:candidate,message:this.forward};
  }
  undo(): {document:Document;message:string} {
    if(!this.before)throw new Error('command has not executed');
    return {document:this.before.clone(),message:this.backward};
  }
  redo(): {document:Document;message:string} {
    if(!this.after)throw new Error('command has not executed');
    return {document:this.after.clone(),message:this.forward};
  }
}
