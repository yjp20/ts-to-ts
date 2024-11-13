/** @model */
interface Container<T> {
  value: T;
  metadata?: Record<string, unknown>;
}

/** @model */
type StringContainer = Container<string>;
/** @model */
type NumberList = Array<number>;
/** @model */
type Dictionary = Record<string, any>;
