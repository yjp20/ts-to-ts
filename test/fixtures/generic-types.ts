/** @convert */
interface Container<T> {
  value: T;
  metadata?: Record<string, unknown>;
}

type StringContainer = Container<string>;
type NumberList = Array<number>;
type Dictionary = Record<string, any>;
