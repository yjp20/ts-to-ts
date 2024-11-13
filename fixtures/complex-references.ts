/** @model */
interface BaseEntity {
  id: number;
  createdAt: string;
  updatedAt: string;
}

/** @model */
interface UserRole {
  name: "admin" | "user" | "guest";
  permissions: string[];
}

/** @model */
interface Department {
  code: string;
  name: string;
  manager?: Employee;
}

/** @model */
interface Address {
  street: string;
  city: string;
  country: string;
  postalCode?: string;
}

/** @model */
interface ContactInfo {
  email: string;
  phone?: string;
  alternateEmail?: string;
  address: Address;
}

/** @model */
interface Employee extends BaseEntity {
  employeeId: string;
  personalInfo: {
    firstName: string;
    lastName: string;
    dateOfBirth?: string;
  };
  contact: ContactInfo;
  role: UserRole;
  department: Department;
  reportsTo?: Employee;
  directReports?: Employee[];
  skills: string[];
  metadata?: Record<string, unknown>;
}

/** @model */
interface Organization extends BaseEntity {
  name: string;
  mainAddress: Address;
  departments: Department[];
  employees: Employee[];
  settings?: Record<string, any>;
}
