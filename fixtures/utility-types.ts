/** @model */
type Required<T> = {
  [P in keyof T]-?: T[P];
};

/** @model */
type Pick<T, K extends keyof T> = {
  [P in K]: T[P];
};

/** @model */
type Record<K extends keyof any, T> = {
  [P in K]: T;
};

/** @model */
type Omit<T, K extends keyof any> = Pick<T, Exclude<keyof T, K>>;
