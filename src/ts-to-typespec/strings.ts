function DumbCombinator<T>(
  values: Array<string | number | LazyString<T>>,
  toString: (rendered: string[]) => string
): LazyString<T> {
  return {
    attach: (scope) => {
      for (const value of values) {
        if (typeof value === "object" && "attach" in value && value.attach) {
          value.attach(scope);
        }
      }
    },

    toString: (scope) => {
      return toString(
        values.map((value) => {
          if (typeof value === "object" && "toString" in value) {
            return value.toString(scope);
          }
          return String(value);
        })
      );
    },
  };
}

export function lazy<T>(
  strings: TemplateStringsArray,
  ...values: Array<string | number | LazyString<T>>
): LazyString<T> {
  return DumbCombinator(values, (rendered) => {
    const raw = String.raw({ raw: strings.raw }, ...rendered);
    const lines = raw.split('\n');
    
    // Find common indentation level
    const matches = lines.filter(l => l.trim()).map(l => l.match(/^[ \t]*/)?.[0].length ?? 0);
    const minIndent = matches.length ? Math.min(...matches) : 0;
    
    // Remove common indentation
    return lines
      .map(line => line.length > minIndent ? line.slice(minIndent) : line)
      .join('\n');
  });
}

export function Indent<T>(
  text: string | LazyString<T>,
  level = 1
): LazyString<T> {
  const spaces = "  ".repeat(level);
  return DumbCombinator([text], (rendered) =>
    rendered
      .flatMap((part) => part.split("\n"))
      .map((line) => (line ? spaces + line : line))
      .join("\n")
  );
}

export function Stanzas<T>(...values: LazyString<T>[]): LazyString<T> {
  return DumbCombinator(values, (rendered) => rendered.join("\n\n"));
}

export function Lines<T>(...values: LazyString<T>[]): LazyString<T> {
  return DumbCombinator(values, (rendered) => rendered.join("\n"));
}

export function Concat<T>(...values: LazyString<T>[]): LazyString<T> {
  return DumbCombinator(values, (rendered) => rendered.join(""));
}

export function Union<T>(...values: LazyString<T>[]): LazyString<T> {
  return DumbCombinator(values, (rendered) => rendered.join(" | "));
}

export function Commas<T>(...values: LazyString<T>[]): LazyString<T> {
  return DumbCombinator(values, (rendered) => rendered.join(","));
}

export type LazyString<Scope> = {
  attach: (scope: Scope) => void;
  toString(scope?: Scope): string;
};
