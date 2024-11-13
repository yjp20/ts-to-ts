/** @model */
type IsString<T> = T extends string ? true : false;

/** @model */
type Flatten<T> = T extends Array<infer U> ? U : T;

/** @model */
type NonNullable<T> = T extends null | undefined ? never : T;

/** @model */
type ExtractStrings<T> = T extends string ? T : never;
