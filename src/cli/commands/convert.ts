import * as fs from "fs";
import * as path from "path";
import { glob } from "glob";
import { Project } from "ts-morph";
import minimist from "minimist";
import { convert } from "../../ts-to-typespec/index.ts";

export async function runConvert(args: string[]): Promise<void> {
  const argv = minimist(args, {
    string: ["output"],
    alias: { o: "output" },
    default: { output: "typespec" },
  });

  const filesPattern = argv._[0];
  if (!filesPattern) {
    console.error("Error: No input files specified");
    console.error("Usage: ts-to-typespec <files> [-o output]");
    console.error("Example: ts-to-typespec src/**/*.ts -o typespec/");
    process.exit(1);
  }

  // Ensure output directory exists
  if (!fs.existsSync(argv.output)) {
    fs.mkdirSync(argv.output, { recursive: true });
  }

  // Find all matching files
  const files = await glob(filesPattern);

  if (files.length === 0) {
    console.warn("No matching files found");
    return;
  }

  // Create TypeScript project
  const project = new Project();

  // Add all files to the project
  for (const file of files) {
    project.addSourceFileAtPath(file);
  }

  // Convert to TypeSpec
  const typespecCode = convert(project, files);

  // Write output file
  const outputPath = path.join(argv.output, "main.tsp");
  fs.writeFileSync(outputPath, typespecCode);

  console.log(`Converted ${files.length} files -> ${outputPath}`);
}
