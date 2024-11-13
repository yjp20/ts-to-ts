/** @convert */
interface User {
  id: number;
  name: string;
  roles: string[];
  status: "active" | "inactive";
  profile: {
    email: string;
    age?: number;
  };
}
