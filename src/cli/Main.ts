import { createInterface } from "node:readline";
import { Editor } from "../application/Editor.ts";
import { Tokenizer } from "./Tokenizer.ts";
/** Composition root: stdin/stdout belong only at this boundary. */
export class Main {
  start(): void {
    const editor = new Editor(),
      tokenizer = new Tokenizer();
    const input = createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: Boolean(process.stdin.isTTY),
    });
    console.log("svg-editor 0.1 — type 'help' for commands\n");
    input.setPrompt("svg> ");
    input.prompt();
    input.on("line", (line) => {
      try {
        const output = editor.execute(tokenizer.parse(line));
        if (output) console.log(output);
      } catch (error) {
        console.log(
          `error: ${(error as Error).message.replace(/[\r\n]+/g, " ")}`,
        );
      }
      input.prompt();
    });
  }
}
new Main().start();
