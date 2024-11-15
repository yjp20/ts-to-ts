// examples/basic/api.ts
model User {
  id: string;
  name: string;
  email?: string;
  githubUsername?: string;
};

model Project {
  targets: Targetz[];
  builds: {
    id: string;
  }[];
};

model Targetz {
  name: "go" | "python" | "node";
};