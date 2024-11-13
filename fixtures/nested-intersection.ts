/** @model */
interface Address {
  street: string;
  city: string;
  country?: string;
}

/** @model */
interface Contact {
  email: string;
  phone?: string;
}

/** @model */
interface PersonDetails {
  name: string;
  age: number;
}

/** @model */
type CompleteProfile = PersonDetails & Contact & Address;
