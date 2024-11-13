import { shards, runTest } from "./converter";

for (const fixture of shards(0, 5)) {
  await runTest(fixture);
}
