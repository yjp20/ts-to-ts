import { shards, runTest } from "./converter";

for (const fixture of shards(3, 5)) {
  await runTest(fixture);
}
