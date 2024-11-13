/** @model */
interface Person {
  name: string;
  age: number;
}

/** @model */
type AgeType = Person["age"];

/** @model */
type Properties = keyof Person;

/** @model */
type NameOrAge = Person[keyof Person];
