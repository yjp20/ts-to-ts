// @ts-check
import { parentPort, workerData } from "worker_threads";
import { Project } from "ts-morph";
import { convert } from "../src/ts-to-typespec/index.js";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { NodeHost, compile } from "@typespec/compiler";

/**
 * @typedef {Object} WorkerData
 * @property {string} fixture
 * @property {string} fixturesDir
 */

/**
 * @typedef {Object} WorkerResult
 * @property {string} fixture
 * @property {string} formatted
 * @property {string[]} errors
 */

/**
 * @param {string} fixture
 * @param {string} fixturesDir
 * @returns {Promise<WorkerResult>}
 */
async function runFixture(fixture, fixturesDir) {
  // Read fixture file
  const fileContent = fs.readFileSync(path.join(fixturesDir, fixture), "utf-8");

  // Create TypeScript project and convert to TypeSpec
  const project = new Project({ useInMemoryFileSystem: true });
  project.createSourceFile(fixture, fileContent);
  const typespecCode = convert(project, [fixture]);

  // Create unique temp directory for this test
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "ts-to-typespec-"));
  const tempFile = path.join(tempDir, "main.tsp");

  // Write files
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

  // Compile TypeSpec
  const program = await compile(NodeHost, tempDir);
  const errors = program.diagnostics.filter((d) => d.severity === "error");

  return {
    fixture,
    formatted,
    errors: errors.map((error) => {
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
      return error.message;
    }),
  };
}

if (parentPort && workerData) {
  /** @type {WorkerData} */
  const data = workerData;
  runFixture(data.fixture, data.fixturesDir)
    .then((result) => {
      parentPort.postMessage(result);
    })
    .catch((/** @type {Error} */ error) => {
      parentPort.postMessage({ error: error.message });
    });
}

export { runFixture };
