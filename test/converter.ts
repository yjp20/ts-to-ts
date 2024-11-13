import { expect, it } from "vitest";
import { Project } from "ts-morph";
import { convert } from "../src/ts-to-typespec";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { NodeHost, compile } from "@typespec/compiler";

const fixturesDir = path
  .join(path.dirname(import.meta.url), "../fixtures")
  .replace("file:", "");

export const fixtures = fs
  .readdirSync(fixturesDir)
  .filter((file) => file.endsWith(".ts"))
  .sort(); // Ensure consistent test order

export function shards(i: number, total: number): string[] {
  const partials: string[] = [];
  for (i; i < fixtures.length; i += total) {
    partials.push(fixtures[i]!);
  }
  return partials;
}

export async function runTest(fixture: string) {
  const testName = path.basename(fixture, ".ts");
  it(testName, async () => {
    // Read fixture file
    const fileContent = fs.readFileSync(
      path.join(fixturesDir, fixture),
      "utf-8"
    );

    // Create TypeScript project and convert to TypeSpec
    const project = new Project({ useInMemoryFileSystem: true });
    project.createSourceFile(fixture, fileContent);
    const typespecCode = convert(project, [fixture]);

    // Create unique temp directory for this test
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "ts-to-typespec-"));
    const tempFile = path.join(tempDir, "main.tsp");

    // Clean up temp directory after test
    fs.writeFileSync(tempFile, typespecCode);
    fs.writeFileSync(
      path.join(tempDir, "package.json"),
      JSON.stringify({ name: "test", main: "main.tsp" })
    );

    const formatted =
      "<<<<<<<<<<< typescript <<<<<<<<<<<<\n" +
      fileContent.trim() +
      "\n===================================\n" +
      typespecCode.trim() +
      "\n>>>>>>>>>>> typespec >>>>>>>>>>>>>>";

    expect(formatted).toMatchFileSnapshot(
      path.join(fixturesDir, testName + ".snap")
    );

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
          } else return error.message;
        })
        .join("\n");
      throw new Error(
        `TypeSpec compilation failed with errors:\n\n${formatted}\n\n${formattedErrors}`
      );
    }
  });
}
