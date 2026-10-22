export abstract class Shape {
  private readonly identity: string;
  private readonly geometry: Map<string, number>;
  private readonly styles = new Map<string, string>();
  private readonly imported = new Map<string, string>();
  protected constructor(id: string, geometry: Record<string, number>) {
    if (!id || /[\s<>"'=&]/u.test(id)) throw new Error("invalid id: " + id);
    this.identity = id;
    this.geometry = new Map(Object.entries(geometry));
    for (const [key, value] of this.geometry) this.validateNumber(key, value);
  }
  abstract get type(): string;
  abstract clone(): Shape;
  abstract move(dx: number, dy: number): void;
  abstract summary(): string;
  get id(): string {
    return this.identity;
  }
  get label(): string {
    return `${this.type}#${this.id}`;
  }
  get children(): readonly Shape[] {
    return [];
  }
  get isContainer(): boolean {
    return false;
  }
  protected number(key: string): number {
    return this.geometry.get(key)!;
  }
  protected shift(key: string, delta: number): void {
    this.set(key, String(this.number(key) + delta));
  }
  protected point(x: string, y: string): string {
    return `(${this.number(x)},${this.number(y)})`;
  }
  position(): string {
    return "";
  }
  scale(factor: number): void {
    if (!Number.isFinite(factor) || factor <= 0)
      throw new Error("scale factor must be positive");
    for (const [key, value] of this.geometry)
      this.set(key, String(value * factor));
  }
  set(attr: string, value: string): void {
    if (this.geometry.has(attr)) {
      const numeric = value.trim() === "" ? NaN : Number(value);
      this.validateNumber(attr, numeric);
      this.geometry.set(attr, numeric);
    } else if (["fill", "stroke", "stroke-width"].includes(attr)) {
      if (attr === "stroke-width")
        this.validateNumber(attr, value.trim() === "" ? NaN : Number(value));
      this.styles.set(attr, value);
    } else throw new Error(`unknown attribute: ${attr}`);
  }
  private validateNumber(attr: string, value: number): void {
    if (!Number.isFinite(value)) throw new Error(`invalid number: ${attr}`);
    if (
      ["width", "height", "r", "rx", "ry", "stroke-width"].includes(attr) &&
      value < 0
    )
      throw new Error(`${attr} must be non-negative`);
  }
  attributes(): Readonly<Record<string, string>> {
    return Object.freeze(
      Object.fromEntries([
        ["id", this.id],
        ...Array.from(this.geometry, ([k, v]) => [k, String(v)]),
        ...this.styles,
        ...this.imported,
      ]),
    );
  }
  preserveAttribute(name: string, value: string): void {
    if (
      name === "id" ||
      this.geometry.has(name) ||
      ["fill", "stroke", "stroke-width", "transform"].includes(name)
    )
      throw new Error(`reserved SVG attribute: ${name}`);
    this.imported.set(name, value);
  }
  get content(): string | undefined {
    return undefined;
  }
  styleSummary(): string {
    return Array.from(this.styles, ([k, v]) => `${k}=${v}`).join(" ");
  }
  protected copyInto<T extends Shape>(copy: T): T {
    for (const [k, v] of this.styles) copy.set(k, v);
    for (const [k, v] of this.imported) copy.preserveAttribute(k, v);
    return copy;
  }
}
