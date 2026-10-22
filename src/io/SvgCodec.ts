import xml from "xml-js";
import sax from "sax";
import type { Element } from "xml-js";
import { Document } from "../model/Document.ts";
import { Shape } from "../model/Shape.ts";
import { Group } from "../model/Group.ts";
import { ShapeFactory } from "../model/ShapeFactory.ts";
export class SvgCodec {
  private readonly factory = new ShapeFactory();
  decode(source: string): { document: Document; warnings: string[] } {
    if (/<!DOCTYPE|<!ENTITY/i.test(source))
      throw new Error("unsupported SVG declaration");
    // xml-js does not finalize its SAX parser; explicitly close a strict validation pass.
    const validator = sax.parser(true);
    validator.onerror = (error) => {
      throw error;
    };
    validator.write(source).close();
    const parsed = xml.xml2js(source, {
      compact: false,
      captureSpacesBetweenElements: true,
    }) as Element;
    const roots = (parsed.elements ?? []).filter((e) => e.type === "element");
    if (roots.length !== 1 || roots[0].name !== "svg")
      throw new Error("expected one svg root");
    const root = roots[0],
      a = root.attributes ?? {};
    const width = Number(a.width ?? 800),
      height = Number(a.height ?? 600),
      document = new Document(width, height);
    if (a.viewBox !== undefined) {
      const box = String(a.viewBox)
        .trim()
        .split(/[\s,]+/)
        .map(Number);
      if (
        box.length !== 4 ||
        box[0] !== 0 ||
        box[1] !== 0 ||
        box[2] !== width ||
        box[3] !== height
      )
        throw new Error("unsupported SVG viewBox");
    }
    const taken = new Set<string>();
    const collect = (e: Element): void => {
      if (e.type !== "element") return;
      const id = e.attributes?.id;
      if (id !== undefined && String(id) !== "") {
        if (taken.has(String(id))) throw new Error(`id already exists: ${id}`);
        taken.add(String(id));
      }
      for (const child of e.elements ?? []) collect(child);
    };
    for (const e of root.elements ?? []) collect(e);
    const warnings: string[] = [],
      counters = new Map<string, number>();
    const build = (e: Element): Shape => {
      const attrs = Object.fromEntries(
        Object.entries(e.attributes ?? {}).map(([k, v]) => [k, String(v)]),
      );
      let id = attrs.id;
      if (!id) {
        let n = counters.get(e.name!) ?? 0;
        do {
          id = `${e.name}${++n}`;
        } while (taken.has(id));
        counters.set(e.name!, n);
        taken.add(id);
        warnings.push(`warning: assigned id ${id} to unnamed <${e.name}>`);
      }
      const content = (e.elements ?? [])
        .filter((c) => c.type === "text" || c.type === "cdata")
        .map((c) => String(c.text ?? c.cdata ?? ""))
        .join("");
      const s = this.factory.fromAttributes(e.name!, id, attrs, content);
      for (const c of e.elements ?? []) {
        if (c.type === "element") {
          if (!(s instanceof Group))
            throw new Error(`unsupported child element in <${s.type}>`);
          s.insert(build(c));
        } else if (
          c.type === "text" &&
          s.content === undefined &&
          String(c.text ?? "").trim()
        )
          throw new Error(`unexpected text in <${s.type}>`);
      }
      // Preserve additional XML presentation/metadata on import; CLI set remains whitelisted.
      const accepted = new Set([
        ...Object.keys(s.attributes()),
        "id",
        "transform",
      ]);
      for (const [k, v] of Object.entries(attrs))
        if (!accepted.has(k)) s.preserveAttribute(k, v);
      if (attrs.transform) this.transform(s, attrs.transform);
      return s;
    };
    for (const e of root.elements ?? []) {
      if (e.type === "element") document.insert(build(e));
      else if (e.type === "text" && String(e.text ?? "").trim())
        throw new Error("unexpected text in svg");
    }
    if (a.transform)
      for (const s of document.children) this.transform(s, String(a.transform));
    const allowedRoot = new Set([
      "xmlns",
      "width",
      "height",
      "viewBox",
      "version",
      "transform",
    ]);
    for (const k of Object.keys(a))
      if (!allowedRoot.has(k))
        throw new Error(`unsupported SVG root attribute: ${k}`);
    return { document, warnings };
  }
  private transform(s: Shape, source: string): void {
    const operations: Array<{ kind: string; values: number[] }> = [];
    let end = 0;
    for (const match of source.matchAll(/(translate|scale)\s*\(([^()]*)\)/g)) {
      if (source.slice(end, match.index).trim().replace(/,/g, ""))
        throw new Error("unsupported SVG transform");
      const values = match[2]
        .trim()
        .split(/[\s,]+/)
        .map(Number);
      if (
        values.length < 1 ||
        values.length > 2 ||
        !values.every(Number.isFinite)
      )
        throw new Error("unsupported SVG transform");
      operations.push({ kind: match[1], values });
      end = match.index! + match[0].length;
    }
    if (!operations.length || source.slice(end).trim())
      throw new Error("unsupported SVG transform");
    // SVG transform lists compose right-to-left. Parsing delegates names through this operation registry.
    const apply = new Map<string, (n: number[]) => void>([
      ["translate", (n) => s.move(n[0], n[1] ?? 0)],
      [
        "scale",
        (n) => {
          if (n.length === 2 && n[0] !== n[1])
            throw new Error("unsupported non-uniform SVG scale");
          s.scale(n[0]);
        },
      ],
    ]);
    for (const operation of operations.reverse())
      apply.get(operation.kind)!(operation.values);
  }
  private escape(value: string, attribute = false): string {
    const escaped = value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/\r/g, "&#13;");
    return attribute
      ? escaped.replace(/\n/g, "&#10;").replace(/\t/g, "&#9;")
      : escaped;
  }
  encode(document: Document): string {
    const element = (s: Shape, depth: number): string => {
      const indent = "  ".repeat(depth),
        attrs = Object.entries(s.attributes())
          .map(([k, v]) => `${k}="${this.escape(v, true)}"`)
          .join(" ");
      if (s.content !== undefined)
        return `${indent}<${s.type} ${attrs}>${this.escape(s.content)}</${s.type}>`;
      if (!s.children.length) return `${indent}<${s.type} ${attrs}/>`;
      return `${indent}<${s.type} ${attrs}>\n${s.children.map((c) => element(c, depth + 1)).join("\n")}\n${indent}</${s.type}>`;
    };
    return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${document.width}" height="${document.height}" viewBox="0 0 ${document.width} ${document.height}">\n${document.children.map((s) => element(s, 1)).join("\n")}\n</svg>\n`;
  }
}
