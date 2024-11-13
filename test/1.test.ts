import { shards, runTest } from "./converter";

for (const fixture of shards(1, 5)) {
  await runTest(fixture);
}
