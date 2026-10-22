import { readFileSync, writeFileSync, renameSync, unlinkSync, lstatSync } from 'node:fs';
import { dirname, basename, join } from 'node:path';
import { randomUUID } from 'node:crypto';
export class FileStore {
  read(path:string):string {
    try{return readFileSync(path,'utf8');}catch{throw new Error(`cannot read file: ${path}`);}
  }
  write(path:string,source:string):void {
    const temporary=join(dirname(path),`.${basename(path)}.${randomUUID()}.tmp`);
    try {
      let mode:number|undefined;
      try{const stat=lstatSync(path);if(!stat.isFile()||!(stat.mode&0o222))throw new Error('not a writable regular file');mode=stat.mode;}catch(error){if((error as NodeJS.ErrnoException).code!=='ENOENT')throw error;}
      writeFileSync(temporary,source,{encoding:'utf8',flag:'wx',mode});renameSync(temporary,path);
    }catch {try{unlinkSync(temporary);}catch{}throw new Error(`cannot write file: ${path}`);}
  }
}
