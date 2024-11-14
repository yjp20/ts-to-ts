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
  // @ts-expect-error
  if (!strings.length) return "";

  const str = [...strings];

  return DumbCombinator(values, (rendered) => {
    str[0]! = str.at(0)!.trimStart();
    str[strings.length - 1]! = str.at(-1)!.trimStart();

    const raw = String.raw(
      { raw: strings },
      ...rendered.map((render, idx) =>
        render
          .split("\n")
          .join(
            "\n" +
              " ".repeat((strings[idx].match(/\n[ \t]*$/)?.[0].length ?? 1) - 1)
          )
      )
    );

    const lines = raw.split("\n");
    const matches = lines
      .filter((line) => line.trim())
      .map((line) => line.match(/^[ \t]*/)![0].length);

    const minIndent = matches.length ? Math.min(...matches) : 0;

    // Remove common indentation
    return lines
      .map((line) => (line.length > minIndent ? line.slice(minIndent) : line))
      .join("\n")
      .trim();
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

export function SemicolonLines<T>(...values: LazyString<T>[]): LazyString<T> {
  return DumbCombinator(values, (rendered) =>
    rendered.map((line) => line + ";").join("\n")
  );
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
