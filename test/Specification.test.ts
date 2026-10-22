import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, mkdirSync, mkdtempSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { Editor } from "../src/application/Editor.ts";
import { Tokenizer } from "../src/cli/Tokenizer.ts";
import { FileStore } from "../src/io/FileStore.ts";
import { SvgCodec } from "../src/io/SvgCodec.ts";
const specification = readFileSync(
  new URL("../doc/phase_cli_1.md", import.meta.url),
  "utf8",
);
const tokenizer = new Tokenizer();
const codec = new SvgCodec();
class TranscriptFiles extends FileStore {
  private readonly directory: string;
  constructor(directory: string) {
    super();
    this.directory = directory;
  }
  read(path: string): string {
    return super.read(join(this.directory, path));
  }
  write(path: string, source: string): void {
    super.write(join(this.directory, path), source);
  }
}
const artifacts = fileURLToPath(
  new URL("../work/specification-runs/", import.meta.url),
);
mkdirSync(artifacts, { recursive: true });
const normalize = (line: string): string => line.replace(/ {2,}/g, " ").trim();
const replay = (transcript: string, editor: Editor): number => {
  const lines = transcript.split("\n");
  let checked = 0;
  for (let i = 0; i < lines.length; i++) {
    const match = /^svg> (.+)$/.exec(lines[i]);
    if (!match) continue;
    const expected: string[] = [];
    while (i + 1 < lines.length && !lines[i + 1].startsWith("svg> ")) {
      const line = lines[++i];
      if (line.trim() && !line.trimStart().startsWith("#")) expected.push(line);
    }
    const actual = editor.execute(tokenizer.parse(match[1])).split("\n");
    if (match[1].startsWith("tree")) {
      assert.equal(actual.length, expected.length, match[1]);
      expected.forEach((line, index) => {
        const output = normalize(actual[index]),
          reference = normalize(line);
        // Tree examples omit optional line stroke summaries; every required field is exact.
        assert.ok(
          output === reference || output === reference + " stroke=black",
          `${match[1]}: ${output} !== ${reference}`,
        );
      });
    } else assert.equal(actual.join("\n"), expected.join("\n"), match[1]);
    checked++;
  }
  return checked;
};
test("replay complete section 6 transcript directly extracted from uploaded Markdown", () => {
  const section = specification.slice(
    specification.indexOf("## 6. 典型会话"),
    specification.indexOf("### 6.1"),
  );
  const transcript = /```text\n([\s\S]*?)```/.exec(section)![1];
  const external = /```xml\n([\s\S]*?)```/.exec(section)![1];
  const directory = mkdtempSync(join(artifacts, "session-"));
  const files = new TranscriptFiles(directory);
  files.write("other.svg", external);
  const editor = new Editor(files);
  assert.equal(replay(transcript, editor), 19);
  assert.equal(codec.decode(files.read("demo.svg")).document.all().length, 5);
});
test("replay original Phase 1 section 6.1 A and check saved flowchart", () => {
  const section = specification.slice(
    specification.indexOf("### 6.1"),
    specification.indexOf("**版本 B"),
  );
  const transcript = [...section.matchAll(/```text\n([\s\S]*?)```/g)]
    .map((m) => m[1])
    .find((s) => s.includes("svg> init"))!;
  const directory = mkdtempSync(join(artifacts, "flow-")),
    files = new TranscriptFiles(directory),
    editor = new Editor(files);
  assert.equal(replay(transcript, editor), 14);
  const saved = codec.decode(files.read("flowchart.svg")).document;
  assert.equal(saved.all().length, 8);
  assert.equal(saved.find("process").attributes().y, "100");
  assert.equal(saved.find("process-label").content, "处理数据 v2");
});
test("read actual nested transform SVG example from section 0", () => {
  const background = specification.slice(
    0,
    specification.indexOf("## 1. 提交内容"),
  );
  const example = [...background.matchAll(/```xml\n([\s\S]*?)```/g)]
    .map((m) => m[1])
    .find((s) => s.includes('id="diagram"'))!;
  const result = codec.decode(example),
    d = result.document;
  assert.equal(d.find("rect1").attributes().x, "260");
  assert.equal(d.find("rect1").attributes().width, "96");
  assert.equal(d.find("text1").attributes()["font-size"], "12.8");
  assert.equal(d.find("text1").attributes()["text-anchor"], "middle");
  assert.equal(d.find("text1").content, "End");
  assert.equal(
    codec.encode(codec.decode(codec.encode(d)).document),
    codec.encode(d),
  );
});
