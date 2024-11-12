import { TypeScriptToTypeSpecConverter } from "../src/ts-to-typespec";
import { createTypeSpecHost } from "./host";
import * as fs from "fs";
import * as path from "path";
import { compile } from "@typespec/compiler";

describe("TypeScriptToTypeSpecConverter", () => {
  let converter: TypeScriptToTypeSpecConverter;
  let tempDir: string;

  beforeEach(() => {
    converter = new TypeScriptToTypeSpecConverter();
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
    .filter((file) => file.endsWith(".ts"));

  for (const fixture of fixtures) {
    const testName = path.basename(fixture, ".ts");

    test(testName, async () => {
      // Read fixture file
      const fileContent = fs.readFileSync(
        path.join(fixturesDir, fixture),
        "utf-8"
      );

      // Convert to TypeSpec
      const typespecCode = converter.convertTypeToTypeSpec(fileContent);

      // Verify TypeSpec compilation
      const tempFile = `main.tsp`;
      const host = createTypeSpecHost({
        [tempFile]: typespecCode,
        "package.json": `{"main":${JSON.stringify(tempFile)}}`,
      });

      expect(
        "\n<<<<<<<<<<< typescript <<<<<<<<<<<<\n" +
          fileContent.trim() +
          "\n===================================\n" +
          typespecCode.trim() +
          "\n>>>>>>>>>>> typespec >>>>>>>>>>>>>>"
      ).toMatchSnapshot(testName);

      const program = await compile(host, ".");
      const errors = program.diagnostics.filter((d) => d.severity === "error");
      expect(errors).toHaveLength(0);
    });
  }
});
