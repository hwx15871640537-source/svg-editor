export class Tokenizer {
  parse(line: string): string[] {
    if (!line.trim() || line.trimStart().startsWith("#")) return [];
    const tokens: string[] = [];
    let token = "",
      quoted = false,
      started = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        quoted = !quoted;
        started = true;
      } else if (c === "\\" && quoted) {
        const next = line[++i];
        if (next === undefined) throw new Error("unterminated quoted argument");
        token +=
          next === "n"
            ? "\n"
            : next === "t"
              ? "\t"
              : next === "r"
                ? "\r"
                : next;
        started = true;
      } else if (/\s/.test(c) && !quoted) {
        if (started) {
          tokens.push(token);
          token = "";
          started = false;
        }
      } else {
        token += c;
        started = true;
      }
    }
    if (quoted) throw new Error("unterminated quoted argument");
    if (started) tokens.push(token);
    return tokens;
  }
}
