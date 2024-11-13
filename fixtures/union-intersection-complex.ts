/** @model */
type StringOrNumberArray = string | number[];

/** @model */
interface A {
  a: string;
  shared: number;
}

/** @model */
interface B {
  b: boolean;
  shared: number;
}

/** @model */
type Complex = (A | B) & { id: string };

/** @model */
type MultiUnion = string | number | boolean | null | undefined;
