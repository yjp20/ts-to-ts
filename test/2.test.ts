import { shards, runTest } from "./converter";

for (const fixture of shards(2, 5)) {
  await runTest(fixture);
}
