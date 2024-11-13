import { shards, runTest } from "./converter";

for (const fixture of shards(4, 5)) {
  await runTest(fixture);
}
