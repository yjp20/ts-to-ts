/** @convert */
interface Address {
  street: string;
  city: string;
}

interface Contact {
  email: string;
  phone?: string;
}

interface PersonDetails {
  name: string;
  age: number;
}

type CompleteProfile = PersonDetails & Contact & Address;
