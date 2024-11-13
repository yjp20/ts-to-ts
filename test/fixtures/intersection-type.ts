/** @model */
interface Name {
  first: string;
  last: string;
}

/** @model */
interface Age {
  age: number;
}

/** @model */
type Person = Name & Age;
