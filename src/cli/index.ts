#!/usr/bin/env node

import { runConvert } from "./commands/convert.js";

runConvert(process.argv.slice(2)).catch((error: Error) => {
  console.error(error);
  process.exit(1);
});
