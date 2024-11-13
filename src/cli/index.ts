#!/usr/bin/env node

import { run, flush, handle } from "@oclif/core";

run()
  .then(() => flush)
  .catch(handle);
