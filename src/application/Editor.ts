import { Document } from "../model/Document.ts";
import { History } from "../commands/History.ts";
import { Command } from "../commands/Command.ts";
import { CreateCommand } from "../commands/CreateCommand.ts";
import { DeleteCommand } from "../commands/DeleteCommand.ts";
import { MoveCommand } from "../commands/MoveCommand.ts";
import { ScaleCommand } from "../commands/ScaleCommand.ts";
import { SetCommand } from "../commands/SetCommand.ts";
import { GroupCommand } from "../commands/GroupCommand.ts";
import { UngroupCommand } from "../commands/UngroupCommand.ts";
import { AddToCommand } from "../commands/AddToCommand.ts";
import { ReorderCommand } from "../commands/ReorderCommand.ts";
import { SvgCodec } from "../io/SvgCodec.ts";
import { FileStore } from "../io/FileStore.ts";
import { Renderer } from "./Renderer.ts";
type Handler = {
  syntax: string;
  run: (args: string[]) => string;
  needsDocument: boolean;
};
export class Editor {
  private document?: Document;
  private path?: string;
  private readonly history = new History();
  private readonly codec = new SvgCodec();
  private readonly files: FileStore;
  private readonly renderer = new Renderer();
  // Name dispatch site 1/2; future command plugins can replace this registration table.
  private readonly handlers = new Map<string, Handler>();
  constructor(files = new FileStore()) {
    this.files = files;
    this.register("init", "init [w] [h]", (a) => this.init(a), false);
    this.register("read", "read <file.svg>", (a) => this.read(a), false);
    this.register("save", "save [file.svg]", (a) => this.save(a));
    this.register("canvas", "canvas [w] [h]", (a) => this.canvas(a));
    this.register(
      "create",
      "create <type> <id> [params…] [in <containerId>]",
      (a) => this.create(a),
    );
    this.register("delete", "delete <id>", (a) => {
      this.arity(a, 1);
      return this.edit(new DeleteCommand(a[0]));
    });
    this.register("move", "move <id> <dx> <dy>", (a) => {
      this.arity(a, 3);
      return this.edit(
        new MoveCommand(a[0], this.number(a[1]), this.number(a[2])),
      );
    });
    this.register("scale", "scale <id> <factor>", (a) => {
      this.arity(a, 2);
      const n = Number(a[1]);
      if (!Number.isFinite(n) || n <= 0)
        throw new Error("scale factor must be positive");
      return this.edit(new ScaleCommand(a[0], n));
    });
    this.register("set", "set <id> <attr> <value>", (a) => {
      this.arity(a, 3);
      return this.edit(new SetCommand(a[0], a[1], a[2]));
    });
    this.register("group", "group <newGid> <id1> <id2>…", (a) => {
      this.arity(a, 2, Infinity);
      return this.edit(new GroupCommand(a[0], a.slice(1)));
    });
    this.register("ungroup", "ungroup <gid>", (a) => {
      this.arity(a, 1);
      return this.edit(new UngroupCommand(a[0]));
    });
    this.register("addto", "addto <gid> <id>", (a) => {
      this.arity(a, 2);
      return this.edit(new AddToCommand(a[0], a[1]));
    });
    this.register("front", "front <id>", (a) => {
      this.arity(a, 1);
      return this.edit(new ReorderCommand(a[0], true));
    });
    this.register("back", "back <id>", (a) => {
      this.arity(a, 1);
      return this.edit(new ReorderCommand(a[0], false));
    });
    this.register("tree", "tree [id]", (a) => {
      this.arity(a, 0, 1);
      return this.renderer.tree(this.current(), a[0]);
    });
    this.register("show", "show <id>", (a) => {
      this.arity(a, 1);
      return this.renderer.show(this.current(), a[0]);
    });
    this.register(
      "help",
      "help",
      (a) => {
        this.arity(a, 0);
        return this.help();
      },
      false,
    );
    this.register("undo", "undo", (a) => {
      this.arity(a, 0);
      return this.commit(this.history.undo());
    });
    this.register("redo", "redo", (a) => {
      this.arity(a, 0);
      return this.commit(this.history.redo());
    });
  }
  private register(
    name: string,
    syntax: string,
    run: (a: string[]) => string,
    needsDocument = true,
  ): void {
    this.handlers.set(name, { syntax, run, needsDocument });
  }
  execute(tokens: string[]): string {
    if (!tokens.length) return "";
    try {
      const handler = this.handlers.get(tokens[0]);
      if (!handler) throw new Error(`unknown command: ${tokens[0]}`);
      if (handler.needsDocument) this.current();
      return handler.run(tokens.slice(1));
    } catch (error) {
      return `error: ${(error instanceof Error ? error.message : String(error)).replace(/\r?\n/g, " ")}`;
    }
  }
  private current(): Document {
    if (!this.document)
      throw new Error("no document. use 'init' or 'read' first");
    return this.document;
  }
  private arity(a: string[], min: number, max = min): void {
    if (a.length < min || a.length > max) throw new Error("invalid arguments");
  }
  private number(s: string): number {
    const n = s.trim() === "" ? NaN : Number(s);
    if (!Number.isFinite(n)) throw new Error(`invalid number: ${s}`);
    return n;
  }
  private commit(result: { document: Document; message: string }): string {
    this.document = result.document;
    return result.message;
  }
  private edit(command: Command): string {
    return this.commit(this.history.execute(command, this.current()));
  }
  private init(a: string[]): string {
    this.arity(a, 0, 2);
    const d = new Document(
      a[0] === undefined ? 800 : this.number(a[0]),
      a[1] === undefined ? 600 : this.number(a[1]),
    );
    this.document = d;
    this.path = undefined;
    this.history.barrier();
    return `canvas ${d.width}x${d.height} created`;
  }
  private read(a: string[]): string {
    this.arity(a, 1);
    const { document, warnings } = this.codec.decode(this.files.read(a[0]));
    this.document = document;
    this.path = a[0];
    this.history.barrier();
    return [
      ...warnings,
      `read ${a[0]} (${document.all().length} elements)`,
    ].join("\n");
  }
  private save(a: string[]): string {
    this.arity(a, 0, 1);
    const d = this.current(),
      path = a[0] ?? this.path;
    if (!path) throw new Error("no file path. use 'save <file.svg>'");
    this.files.write(path, this.codec.encode(d));
    this.path = path;
    this.history.barrier();
    return `saved to ${path} (${d.all().length} elements)`;
  }
  private canvas(a: string[]): string {
    this.arity(a, 0, 2);
    const d = this.current();
    if (!a.length) return `canvas ${d.width}x${d.height}`;
    this.arity(a, 2);
    const candidate = d.clone();
    candidate.resize(this.number(a[0]), this.number(a[1]));
    this.document = candidate;
    this.history.barrier();
    return `canvas resized to ${candidate.width}x${candidate.height}`;
  }
  private create(a: string[]): string {
    this.arity(a, 2, Infinity);
    let parentId: string | undefined;
    const params = a.slice(2);
    if (params.length >= 2 && params.at(-2) === "in") {
      parentId = params.pop();
      params.pop();
    }
    return this.edit(new CreateCommand(a[0], a[1], params, parentId));
  }
  private help(): string {
    return (
      [...this.handlers.values()].map((h) => h.syntax).join("\n") +
      '\ncreate types:\n  rect <id> <x> <y> <w> <h> [fill]\n  circle <id> <cx> <cy> <r> [fill]\n  ellipse <id> <cx> <cy> <rx> <ry> [fill]\n  line <id> <x1> <y1> <x2> <y2> [stroke]\n  text <id> <x> <y> "content"\n  g <id>\nAll types support [in <containerId>]. End input (EOF) to quit.'
    );
  }
}
