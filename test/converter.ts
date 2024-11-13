import { expect, it } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { Worker } from "worker_threads";

const fixturesDir = path
  .join(path.dirname(import.meta.url), "../fixtures")
  .replace("file:", "");

const fixtures = fs
  .readdirSync(fixturesDir)
  .filter((file) => file.endsWith(".ts"))
  .sort();

function runWorker(fixture: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const worker = new Worker("./test/worker.ts", {
      workerData: { fixture, fixturesDir }
    });
    
    worker.on("message", resolve);
    worker.on("error", reject);
    worker.on("exit", (code) => {
      if (code !== 0) {
        reject(new Error(`Worker stopped with exit code ${code}`));
      }
    });
  });
}

for (const fixture of fixtures) {
  const testName = path.basename(fixture, ".ts");
  
  it(testName, async () => {
    const result = await runWorker(fixture);
    
    if (result.error) {
      throw new Error(result.error);
    }
    
    if (result.errors && result.errors.length > 0) {
      throw new Error(
        `TypeSpec compilation failed with errors:\n\n${result.formatted}\n\n${result.errors.join("\n")}`
      );
    }

    expect(result.formatted).toMatchFileSnapshot(
      path.join(fixturesDir, testName + ".snap")
    );
  });
}
