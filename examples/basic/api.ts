/** @model User */
type User = {
  id: string;
  name: string;
  email?: string;
  githubUsername?: string;
};

/** @model Project */
type Project = {
  targets: Target[];
  builds: Build[];
};

/** @model Targetz */
type Target = {
  name: "go" | "python" | "node";
};

type Build = {
  id: string;
};

type WithId<T> = {
  id: string;
};
