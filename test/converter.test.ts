import { it } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { Worker } from "worker_threads";

const fixturesDir = path
  .join(path.dirname(import.meta.url), "../fixtures")
  .replace("file:", "");

const tests = fs
  .readdirSync(fixturesDir)
  .filter((file) => file.endsWith(".ts"))
  .map((file) => path.basename(file, ".ts"))
  .sort();

function runWorker(test: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const fixture = test + ".ts";
    const content = fs.readFileSync(path.join(fixturesDir, fixture), "utf-8");

    const worker = new Worker("./test/worker.ts", {
      workerData: { fixture, content },
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

tests.forEach((test) => {
  it.concurrent(test, async ({ expect }) => {
    const result = await runWorker(test);

    if (result.errors?.length) {
      throw new Error(
        `TypeSpec compilation failed with errors:\n\n${result.formatted}\n\n${result.errors.join("\n")}`
      );
    }

    await expect(result.formatted).toMatchFileSnapshot(
      path.join(fixturesDir, test + ".snap")
    );
  });
});
