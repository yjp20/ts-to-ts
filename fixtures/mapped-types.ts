/** @model */
/** @model */
type Readonly<T> = {
  readonly [P in keyof T]: T[P];
};

/** @model */
type Partial<T> = {
  [P in keyof T]?: T[P];
};

/** @model */
type ReadonlyUser = Readonly<{
  name: string;
  age: number;
}>;

/** @model */
type PartialUser = Partial<{
  name: string;
  age: number;
}>;
