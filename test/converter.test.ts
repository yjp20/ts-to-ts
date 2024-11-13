import { Project } from "ts-morph";
import { convertProject } from "../src/ts-to-typespec";
import * as fs from "fs";
import * as path from "path";
import { NodeHost, compile } from "@typespec/compiler";

describe("TypeScriptToTypeSpecConverter", () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = path
      .join(path.dirname(import.meta.url), "../temp")
      .replace("file:", "");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true });
    }
  });

  // Dynamically load and run tests for all fixtures
  const fixturesDir = path
    .join(path.dirname(import.meta.url), "fixtures")
    .replace("file:", "");
  const fixtures = fs
    .readdirSync(fixturesDir)
    .filter((file) => file.endsWith(".ts"))
    .sort(); // Ensure consistent test order

  for (const fixture of fixtures) {
    const testName = path.basename(fixture, ".ts");

    test(testName, async () => {
      // Read fixture file
      const fileContent = fs.readFileSync(
        path.join(fixturesDir, fixture),
        "utf-8"
      );

      // Create TypeScript project and convert to TypeSpec
      const project = new Project();
      project.createSourceFile(fixture, fileContent);
      const typespecCode = convertProject(project, [fixture]);

      // Write TypeSpec code to temp directory
      const tempFile = path.join(tempDir, "main.tsp");
      fs.writeFileSync(tempFile, typespecCode);
      fs.writeFileSync(
        path.join(tempDir, "package.json"),
        JSON.stringify({ name: "test", main: "main.tsp" })
      );

      // Verify TypeSpec compilation
      expect(
        "\n<<<<<<<<<<< typescript <<<<<<<<<<<<\n" +
          fileContent.trim() +
          "\n===================================\n" +
          typespecCode.trim() +
          "\n>>>>>>>>>>> typespec >>>>>>>>>>>>>>"
      ).toMatchSnapshot(testName);

      const program = await compile(NodeHost, tempDir);
      const errors = program.diagnostics.filter((d) => d.severity === "error");
      if (errors.length > 0) {
        const formattedErrors = errors
          .map((error) => {
            if (
              error.target &&
              typeof error.target === "object" &&
              "file" in error.target
            ) {
              const file = error.target.file;
              const pos = error.target.pos;
              const lineStarts = file.getLineStarts();
              const line =
                lineStarts.findIndex((start, i) => {
                  const nextStart = lineStarts[i + 1] ?? Infinity;
                  return start <= pos && pos < nextStart;
                }) + 1;
              const column = pos - lineStarts[line - 1] + 1;

              return `${error.message} @ ${file.path}:${line}:${column}`;
            }
          })
          .join("\n");
        throw new Error(
          `TypeSpec compilation failed with errors:\n${formattedErrors}`
        );
      }
    });
  }
});
