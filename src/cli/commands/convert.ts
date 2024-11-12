import { Args, Command, Flags } from "@oclif/core";
import * as fs from "fs";
import * as path from "path";
import { glob } from "glob";
import { TypeScriptToTypeSpecConverter } from "../../ts-to-typespec";

export default class Convert extends Command {
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

    // Create converter instance
    const converter = new TypeScriptToTypeSpecConverter();

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

    for (const file of files) {
      try {
        // Read TypeScript file
        const content = fs.readFileSync(file, "utf-8");

        // Convert to TypeSpec
        const typespecCode = converter.convertTypeToTypeSpec(content);

        // Generate output filename
        const basename = path.basename(file, ".ts");
        const outputPath = path.join(flags.output, `${basename}.tsp`);

        // Write TypeSpec file
        fs.writeFileSync(outputPath, typespecCode);

        this.log(`Converted ${file} -> ${outputPath}`);
      } catch (error) {
        this.error(
          `Failed to convert ${file}: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  }
}
