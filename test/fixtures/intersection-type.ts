interface Name {
  first: string;
  last: string;
}

interface Age {
  age: number;
}

type Person = Name & Age;
