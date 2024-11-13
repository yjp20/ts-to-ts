#!/usr/bin/env node

import { runConvert } from "./commands/convert";

runConvert(process.argv.slice(2)).catch((error) => {
  console.error(error);
  process.exit(1);
});
