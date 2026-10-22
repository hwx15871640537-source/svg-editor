import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, basename, resolve, relative } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
const root = fileURLToPath(new URL("../src/", import.meta.url));
const files = (path: string): string[] =>
  readdirSync(path, { withFileTypes: true })
    .flatMap((e) =>
      e.isDirectory() ? files(resolve(path, e.name)) : [resolve(path, e.name)],
    )
    .filter((p) => p.endsWith(".ts"));
const allowed: Record<string, string[]> = {
  model: ["model"],
  commands: ["commands", "model"],
  io: ["io", "model"],
  application: ["application", "model", "commands", "io"],
  cli: ["cli", "application"],
};
test("all production imports follow documented dependency direction", () => {
  for (const path of files(root)) {
    const layer = relative(root, path).split("/")[0];
    const source = ts.createSourceFile(
      path,
      readFileSync(path, "utf8"),
      ts.ScriptTarget.Latest,
      true,
    );
    for (const node of source.statements)
      if (
        ts.isImportDeclaration(node) &&
        ts.isStringLiteral(node.moduleSpecifier)
      ) {
        const spec = node.moduleSpecifier.text;
        if (spec.startsWith(".")) {
          const target = relative(root, resolve(dirname(path), spec)).split(
            "/",
          )[0];
          assert.ok(allowed[layer].includes(target), `${path} -> ${spec}`);
        } else
          assert.ok(
            layer === "io" || layer === "cli",
            `external import outside I/O boundaries: ${path} -> ${spec}`,
          );
      }
  }
});
test("one class per file, matching name, encapsulated fields and no switch(tag)", () => {
  for (const path of files(root)) {
    const source = ts.createSourceFile(
      path,
      readFileSync(path, "utf8"),
      ts.ScriptTarget.Latest,
      true,
    );
    const classes = source.statements.filter(ts.isClassDeclaration);
    assert.equal(classes.length, 1, path);
    assert.equal(classes[0].name?.text, basename(path, ".ts"));
    const visit = (node: ts.Node): void => {
      assert.ok(!ts.isSwitchStatement(node), `unexpected switch in ${path}`);
      if (ts.isPropertyDeclaration(node))
        assert.ok(
          node.modifiers?.some(
            (m) =>
              m.kind === ts.SyntaxKind.PrivateKeyword ||
              m.kind === ts.SyntaxKind.ProtectedKeyword,
          ),
          `public field in ${path}: ${node.name.getText(source)}`,
        );
      ts.forEachChild(node, visit);
    };
    visit(source);
  }
});
