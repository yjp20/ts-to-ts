import { Args, Command, Flags } from "@oclif/core";
import * as fs from "fs";
import * as path from "path";
import { glob } from "glob";
import { Project } from "ts-morph";
import { convert } from "../../ts-to-typespec";

export class Convert extends Command {
  static description = "Convert TypeScript type definitions to TypeSpec";

  static examples = [
    "$ ts-to-typespec convert src/**/*.ts",
    "$ ts-to-typespec convert types.ts -o typespec/",
  ];

  static flags = {
    output: Flags.string({
      char: "o",
      description: "output directory for TypeSpec files",
      default: "typespec",
    }),
  };

  static args = {
    files: Args.file({
      name: "files",
      description: "TypeScript files to convert (glob pattern)",
      required: true,
    }),
  };

  async run(): Promise<void> {
    const { args, flags } = await this.parse(Convert);
    const filesPattern = args.files as string;

    // Ensure output directory exists
    if (!fs.existsSync(flags.output)) {
      fs.mkdirSync(flags.output, { recursive: true });
    }

    // Find all matching files
    const files = await glob(filesPattern);

    if (files.length === 0) {
      this.warn("No matching files found");
      return;
    }

    try {
      // Create TypeScript project and add all files
      const project = new Project();
      files.forEach(file => {
        const content = fs.readFileSync(file, "utf-8");
        project.createSourceFile(file, content);
      });

      // Convert to TypeSpec
      const typespecCode = convert(project, files);

      // Write output file
      const outputPath = path.join(flags.output, "main.tsp");
      fs.writeFileSync(outputPath, typespecCode);

      this.log(`Converted ${files.length} files -> ${outputPath}`);
    } catch (error) {
      this.error(`Failed to convert: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
