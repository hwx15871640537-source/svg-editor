import { test } from "node:test";
import assert from "node:assert/strict";
import {
  mkdtempSync,
  readFileSync,
  writeFileSync,
  mkdirSync,
  readdirSync,
  chmodSync,
} from "node:fs";
import { join } from "node:path";
import { Editor } from "../src/application/Editor.ts";
import { Tokenizer } from "../src/cli/Tokenizer.ts";
const tokenizer = new Tokenizer();
const artifactDirectory = new URL("../work/test-artifacts/", import.meta.url);
mkdirSync(artifactDirectory, { recursive: true });
const artifactPath = artifactDirectory.pathname;
const run = (e: Editor, s: string): string => e.execute(tokenizer.parse(s));
const ready = (): Editor => {
  const e = new Editor();
  run(e, "init");
  return e;
};
const sample = (e: Editor): void => {
  for (const s of [
    "create g scene",
    "create rect r1 10 20 100 50 #eee in scene",
    "create circle c1 100 100 20 red in scene",
    'create text t1 20 40 "My Diagram" in scene',
  ])
    assert.ok(!run(e, s).startsWith("error:"), s);
};
for (const cmd of [
  "save",
  "canvas",
  "create g g",
  "delete a",
  "move a 1 2",
  "scale a 2",
  "set a fill red",
  "group g a",
  "ungroup a",
  "addto a b",
  "front a",
  "back a",
  "tree",
  "show a",
  "undo",
  "redo",
])
  test("no document: " + cmd, () => {
    assert.equal(
      run(new Editor(), cmd),
      "error: no document. use 'init' or 'read' first",
    );
  });
test("init dimensions, help and comments", () => {
  const e = new Editor();
  assert.match(run(e, "help"), /create <type>/);
  assert.equal(run(e, " # comment"), "");
  assert.equal(run(e, ""), "");
  assert.equal(run(e, "init"), "canvas 800x600 created");
  assert.equal(run(e, "init 400"), "canvas 400x600 created");
  assert.equal(run(e, "init 400.5 300.25"), "canvas 400.5x300.25 created");
  assert.equal(run(e, "canvas"), "canvas 400.5x300.25");
  assert.match(run(e, "init 0 1"), /^error:/);
  assert.equal(run(e, "canvas"), "canvas 400.5x300.25");
});
const errors: [string, string][] = [
  ["create rect r1 0 0 1 1", "id already exists: r1"],
  ["delete r9", "no such shape: r9"],
  ["create g new in node9", "no such container: node9"],
  ["create g new in r1", "not a container: r1"],
  ["create hexagon new", "unknown shape type: hexagon (is the plugin loaded?)"],
  [
    'create box new 1 2 3 4 "Title"',
    "unknown shape type: box (is the plugin loaded?)",
  ],
  [
    "group bad r1 scene",
    "cannot group a container into its own descendant: scene",
  ],
  ["ungroup scene", "cannot ungroup top-level container: scene"],
  ["scale r1 0", "scale factor must be positive"],
  ["scale r1 -2", "scale factor must be positive"],
  ["scale r1 NaN", "scale factor must be positive"],
  ["set r1 invalid x", "unknown attribute: invalid"],
  ["set scene x 4", "unknown attribute: x"],
  ["set r1 text hi", "unknown attribute: text"],
  ["set r1 id z", "unknown attribute: id"],
  ["ungroup r1", "not a container: r1"],
  [
    "addto scene scene",
    "cannot add a container into its own descendant: scene",
  ],
];
for (const [command, error] of errors)
  test("exact error and failure atomicity: " + command, () => {
    const e = ready();
    sample(e);
    const before = run(e, "tree");
    run(e, "move r1 3 4");
    run(e, "undo");
    assert.equal(run(e, command), "error: " + error);
    assert.equal(run(e, "tree"), before);
    assert.equal(run(e, "redo"), "rect#r1 moved to (13,24)");
  });
test("document sample transcript, exact move/set/delete summaries", () => {
  const e = ready();
  for (const s of [
    "create rect bg 0 0 800 600 #ffffff",
    'create text title 20 40 "My Diagram"',
    "create circle c1 100 100 20 red",
    "create rect box 200 80 60 60 #3366ff",
  ])
    assert.ok(!run(e, s).startsWith("error:"));
  assert.equal(
    run(e, "group markers c1 box"),
    "g#markers created with 2 children",
  );
  assert.equal(run(e, "move c1 30 0"), "circle#c1 moved to (130,100)");
  assert.equal(run(e, "undo"), "circle#c1 moved back to (100,100)");
  assert.equal(run(e, "redo"), "circle#c1 moved to (130,100)");
  assert.equal(
    run(e, 'set title text "My Diagram v2"'),
    'text#title updated: text="My Diagram v2"',
  );
  assert.equal(run(e, "undo"), 'text#title updated: text="My Diagram"');
  assert.equal(
    run(e, "group bad c1 markers"),
    "error: cannot group a container into its own descendant: markers",
  );
  assert.equal(run(e, "delete box"), "rect#box deleted");
  assert.equal(run(e, "undo"), "rect#box restored into g#markers");
  assert.equal(
    run(e, "show c1"),
    "circle#c1  parent=g#markers\n  cx=130 cy=100 r=20\n  fill=red",
  );
  assert.match(run(e, "tree"), /^svg \(800x600\)\n├── rect#bg/);
  assert.match(run(e, "tree markers"), /^g#markers\n├── circle#c1/);
});
test("all create types with in clause, all geometries scale, set whitelist", () => {
  const e = ready();
  run(e, "create g outer");
  run(e, "create g nested in outer");
  const cases = [
    ["rect", "1 2 3 4"],
    ["circle", "1 2 3"],
    ["ellipse", "1 2 3 4"],
    ["line", "1 2 3 4"],
    ["text", '1 2 "text in words"'],
  ];
  for (const [kind, args] of cases)
    assert.equal(
      run(e, `create ${kind} ${kind} ${args} in nested`),
      `${kind}#${kind} created in g#nested`,
    );
  run(e, "move outer 10 20");
  run(e, "scale outer 2");
  assert.match(run(e, "show rect"), /x=22 y=44 width=6 height=8/);
  assert.match(run(e, "show circle"), /cx=22 cy=44 r=6/);
  assert.match(run(e, "show ellipse"), /cx=22 cy=44 rx=6 ry=8/);
  assert.match(run(e, "show line"), /x1=22 y1=44 x2=26 y2=48/);
  assert.match(run(e, "show text"), /x=22 y=44/);
  for (const id of ["outer", "nested", ...cases.map((c) => c[0])])
    for (const [attr, value] of [
      ["fill", "red"],
      ["stroke", "blue"],
      ["stroke-width", "2.5"],
    ])
      assert.ok(!run(e, `set ${id} ${attr} ${value}`).startsWith("error:"));
  for (const [id, attrs] of [
    ["rect", "x y width height"],
    ["circle", "cx cy r"],
    ["ellipse", "cx cy rx ry"],
    ["line", "x1 y1 x2 y2"],
    ["text", "x y"],
  ])
    for (const attr of attrs.split(" "))
      assert.ok(!run(e, `set ${id} ${attr} 7.5`).startsWith("error:"));
  assert.equal(
    run(e, 'set text text "中文 标题"'),
    'text#text updated: text="中文 标题"',
  );
});
test("every structural edit supports undo/redo and preserves exact order", () => {
  const e = ready();
  for (const s of [
    "create g outer",
    "create g inner in outer",
    "create rect a 0 0 1 1 in inner",
    "create circle b 0 0 1 in inner",
    "create g other in outer",
  ])
    run(e, s);
  const roundtrip = (cmd: string): void => {
    const before = run(e, "tree");
    assert.ok(!run(e, cmd).startsWith("error:"), cmd);
    const after = run(e, "tree");
    run(e, "undo");
    assert.equal(run(e, "tree"), before, cmd);
    run(e, "redo");
    assert.equal(run(e, "tree"), after, cmd);
  };
  for (const s of [
    "front a",
    "back b",
    "addto other a",
    "group pair a b",
    "ungroup pair",
    "delete inner",
    "move outer 1.5 2.5",
    "scale outer 0.5",
    "set outer fill red",
    "delete outer",
  ])
    roundtrip(s);
});
test("display does not enter history or clear redo; branches do", () => {
  const e = ready();
  run(e, "create rect a 0 0 1 1");
  run(e, "move a 2 3");
  run(e, "undo");
  for (const c of ["tree", "tree a", "show a", "help", "canvas"]) run(e, c);
  assert.equal(run(e, "redo"), "rect#a moved to (2,3)");
  run(e, "undo");
  run(e, "set a fill red");
  assert.equal(run(e, "redo"), "error: nothing to redo");
  run(e, "undo");
  run(e, "undo");
  assert.equal(run(e, "undo"), "error: nothing to undo");
});
test("I/O barriers, default paths, errors and failed read/save preserve history", () => {
  const dir = mkdtempSync(join(artifactPath, "svg-test-"));
  try {
    const e = ready(),
      file = join(dir, "a.svg");
    sample(e);
    assert.equal(run(e, "save"), "error: no file path. use 'save <file.svg>'");
    assert.equal(run(e, `save "${file}"`), `saved to ${file} (4 elements)`);
    for (const c of ["undo", "redo"])
      assert.equal(run(e, c), "error: undo not allowed after io command");
    run(e, "move r1 1 2");
    run(e, "canvas");
    assert.equal(run(e, "undo"), "rect#r1 moved back to (10,20)");
    run(e, "redo");
    const before = run(e, "tree");
    assert.equal(
      run(e, `read "${join(dir, "missing.svg")}"`),
      `error: cannot read file: ${join(dir, "missing.svg")}`,
    );
    assert.equal(run(e, "tree"), before);
    assert.equal(
      run(e, `save "${join(dir, "missing", "x.svg")}"`),
      `error: cannot write file: ${join(dir, "missing", "x.svg")}`,
    );
    assert.equal(run(e, "undo"), "rect#r1 moved back to (10,20)");
    writeFileSync(join(dir, "bad.svg"), "<svg><rect");
    assert.match(run(e, `read "${join(dir, "bad.svg")}"`), /^error: [^\n]+$/);
    assert.equal(run(e, "redo"), "rect#r1 moved to (11,22)");
    assert.equal(run(e, "save"), `saved to ${file} (4 elements)`);
    assert.match(readFileSync(file, "utf8"), /x="11" y="22"/);
    assert.equal(run(e, `read "${file}"`), `read ${file} (4 elements)`);
    run(e, "move r1 1 1");
    run(e, "canvas 400 300");
    assert.equal(run(e, "undo"), "error: undo not allowed after io command");
    assert.equal(run(e, "canvas"), "canvas 400x300");
    run(e, "create g new");
    run(e, "init");
    assert.equal(run(e, "save"), "error: no file path. use 'save <file.svg>'");
    assert.equal(run(e, "undo"), "error: undo not allowed after io command");
  } finally {
    // User requires preservation of every local file; test artifacts stay on disk.
  }
});
test("read warning sample count and default save path", () => {
  const dir = mkdtempSync(join(artifactPath, "svg-read-"));
  try {
    const path = join(dir, "other.svg");
    writeFileSync(
      path,
      readFileSync(new URL("../examples/other.svg", import.meta.url), "utf8"),
    );
    const e = new Editor();
    assert.equal(
      run(e, `read "${path}"`),
      `warning: assigned id rect1 to unnamed <rect>\nread ${path} (7 elements)`,
    );
    assert.match(run(e, "tree"), /svg \(400x300\)/);
    assert.equal(run(e, "save"), `saved to ${path} (7 elements)`);
  } finally {
    // User requires preservation of every local file; test artifacts stay on disk.
  }
});
for (const bad of [
  "create",
  "create rect",
  "create rect a 1 2 3",
  "create g",
  "create g a unexpected",
  "move r1 1",
  "move r1 NaN 0",
  "canvas 20",
  "canvas -1 2",
  "set r1 width -1",
  "set r1 stroke-width -2",
  "set r1 x Infinity",
  "group empty",
  "group new r1 r1",
  "tree a b",
  "undo a",
  "redo a",
  "help a",
])
  test("invalid input leaves state and history unchanged: " + bad, () => {
    const e = ready();
    sample(e);
    const before = run(e, "tree");
    assert.match(run(e, bad), /^error:/);
    assert.equal(run(e, "tree"), before);
    assert.equal(run(e, "undo"), "text#t1 deleted");
  });
test("file store leaves old file intact on failed writes", () => {
  const dir = mkdtempSync(join(artifactPath, "svg-write-"));
  try {
    const e = ready(),
      file = join(dir, "locked.svg");
    writeFileSync(file, "original");
    chmodSync(file, 0o444);
    assert.equal(run(e, `save "${file}"`), `error: cannot write file: ${file}`);
    assert.equal(readFileSync(file, "utf8"), "original");
    const target = join(dir, "folder.svg");
    mkdirSync(target);
    assert.equal(
      run(e, `save "${target}"`),
      `error: cannot write file: ${target}`,
    );
    assert.ok(!readdirSync(dir).some((n) => n.endsWith(".tmp")));
  } finally {
    // User requires preservation of every local file; test artifacts stay on disk.
  }
});

test("z-order front/back and cross-parent group follow original traversal order", () => {
  const e = ready();
  for (const s of [
    "create g p",
    "create g q",
    "create g a in p",
    "create g b in p",
    "create g c in q",
  ])
    run(e, s);
  run(e, "front a");
  assert.ok(run(e, "tree p").indexOf("g#b") < run(e, "tree p").indexOf("g#a"));
  run(e, "back a");
  assert.ok(run(e, "tree p").indexOf("g#a") < run(e, "tree p").indexOf("g#b"));
  run(e, "group joined c a");
  assert.match(run(e, "show joined"), /parent=g#p/);
  assert.ok(
    run(e, "tree joined").indexOf("g#a") < run(e, "tree joined").indexOf("g#c"),
  );
  run(e, "undo");
  assert.match(run(e, "show c"), /parent=g#q/);
  assert.match(run(e, "show a"), /parent=g#p/);
});
test("overflow while recursively editing never partially commits", () => {
  const e = ready();
  for (const s of [
    "create g g",
    "create rect a 1 1 1 1 in g",
    "create rect b 1e308 1 1 1 in g",
  ])
    run(e, s);
  const before = run(e, "tree");
  assert.match(run(e, "scale g 2"), /^error: invalid number: x$/);
  assert.equal(run(e, "tree"), before);
  assert.equal(run(e, "undo"), "rect#b deleted");
});

test("successful overwrite keeps a byte-for-byte backup and never cleans files", () => {
  const dir = mkdtempSync(join(artifactPath, "svg-backup-")),
    file = join(dir, "existing.svg");
  const original = '<svg width="100" height="100"><rect id="original"/></svg>';
  writeFileSync(file, original);
  const e = ready();
  run(e, "create g new");
  assert.equal(run(e, `save "${file}"`), `saved to ${file} (1 elements)`);
  const backups = readdirSync(dir).filter((n) => n.endsWith(".bak"));
  assert.equal(backups.length, 1);
  assert.equal(readFileSync(join(dir, backups[0]), "utf8"), original);
  assert.match(readFileSync(file, "utf8"), /id="new"/);
});
