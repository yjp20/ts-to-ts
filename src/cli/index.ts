#!/usr/bin/env node

import { Convert } from "./commands/convert";
import { flush, handle } from "@oclif/core";

Convert.run().then(
  async () => {
    await flush();
  },
  async (err) => {
    await handle(err);
  }
);
