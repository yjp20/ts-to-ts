import { parentPort, workerData } from "worker_threads";
import { Project } from "ts-morph";
import { convert } from "../src/ts-to-typespec/index.ts";
import { createTestHost } from "@typespec/compiler/testing";

interface WorkerData {
  fixture: string;
  content: string;
}

interface WorkerResult {
  fixture: string;
  formatted: string;
  errors: string[];
}

async function runFixture(
  fixture: string,
  fileContent: string
): Promise<WorkerResult> {
  // Create TypeScript project and convert to TypeSpec
  const project = new Project({ useInMemoryFileSystem: true });
  project.createSourceFile(fixture, fileContent);
  const typespecCode = convert(project, [fixture]);

  const formatted =
    "<<<<<<<<<<< typescript <<<<<<<<<<<<\n" +
    fileContent.trim() +
    "\n===================================\n" +
    typespecCode.trim() +
    "\n>>>>>>>>>>> typespec >>>>>>>>>>>>>>";

  // Compile TypeSpec
  const testHost = await createTestHost();
  testHost.addTypeSpecFile("main.tsp", typespecCode);
  const diagnostics = await testHost.diagnose("main.tsp");

  const errors = diagnostics.filter((d) => d.severity === "error");

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
  const data = workerData as WorkerData;
  runFixture(data.fixture, data.content)
    .then((result) => {
      parentPort!.postMessage(result);
    })
    .catch((error: Error) => {
      parentPort!.postMessage({ error: error.message });
    });
}

export { runFixture };
