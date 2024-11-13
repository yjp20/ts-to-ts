/** @model */
type Readonly<T> = {
  readonly [P in keyof T]: T[P];
};

type Partial<T> = {
  [P in keyof T]?: T[P];
};

type ReadonlyUser = Readonly<{
  name: string;
  age: number;
}>;

type PartialUser = Partial<{
  name: string;
  age: number;
}>;
