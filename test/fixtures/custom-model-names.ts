/** @model CustomGreeting */
type Greeting = string;

/** @model UserProfile */
interface User {
  name: string;
  age: number;
}

/** @model AdminData */
type Admin = User & {
  permissions: string[];
};
