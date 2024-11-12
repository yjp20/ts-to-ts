import { CompilerHost, SourceFile, ProcessedLog } from "@typespec/compiler";
import * as path from "path";

export class TypeSpecHost implements CompilerHost {
  private files: Map<string, string> = new Map();

  constructor() {}

  async readFile(filePath: string): Promise<SourceFile> {
    const normalizedPath = path.normalize(filePath);
    const content = this.files.get(normalizedPath);
    if (!content) {
      throw new Error(`File not found: ${path}`);
    }
    const lineStarts = [0];
    for (let i = 0; i < content.length; i++) {
      if (content[i] === "\n") {
        lineStarts.push(i + 1);
      }
    }

    return {
      path: normalizedPath,
      text: content,
      getLineStarts: () => lineStarts,
      getLineAndCharacterOfPosition: (pos: number) => {
        let line = 0;
        for (let i = 1; i < lineStarts.length; i++) {
          if (lineStarts[i] > pos) {
            break;
          }
          line = i;
        }
        const character = pos - lineStarts[line];
        return { line, character };
      },
    };
  }

  writeFile(filePath: string, content: string): Promise<void> {
    const normalizedPath = path.normalize(filePath);
    this.files.set(normalizedPath, content);
    return Promise.resolve();
  }

  getExecutionRoot(): string {
    return process.cwd();
  }

  getLibDirs(): string[] {
    return ["node_modules/@typespec/compiler/lib"];
  }

  async mkdirp(path: string): Promise<string | undefined> {
    return path;
  }

  async realpath(path: string): Promise<string> {
    return path;
  }

  fileExists(filePath: string): boolean {
    const normalizedPath = path.normalize(filePath);
    return this.files.has(normalizedPath);
  }

  deleteFile(filePath: string): Promise<void> {
    const normalizedPath = path.normalize(filePath);
    this.files.delete(normalizedPath);
    return Promise.resolve();
  }

  listFiles(dir: string): string[] {
    return Array.from(this.files.keys()).filter((file) => file.startsWith(dir));
  }

  readDirectory(dir: string): { files: string[]; directories: string[] } {
    const entries = this.listFiles(dir);
    return {
      files: entries,
      directories: [],
    };
  }

  getCurrentDirectory(): string {
    return process.cwd();
  }

  readUrl(): Promise<SourceFile> {
    throw new Error("Method not implemented.");
  }

  readDir(): Promise<string[]> {
    return Promise.resolve([]);
  }

  rm(): Promise<void> {
    return Promise.resolve();
  }

  getJsImport(): Promise<any> {
    return Promise.resolve(null);
  }

  // Add a helper method to add files to the virtual filesystem
  addFile(filePath: string, content: string): void {
    const normalizedPath = path.normalize(filePath);
    this.files.set(normalizedPath, content);
  }

  async stat(
    path: string
  ): Promise<{ isDirectory(): boolean; isFile(): boolean }> {
    const isFile = this.files.has(path);
    return {
      isDirectory: () => !isFile,
      isFile: () => isFile,
    };
  }

  getSourceFileKind(path: string): "typespec" | "js" {
    return path.endsWith(".tsp") ? "typespec" : "js";
  }

  fileURLToPath(url: string): string {
    return url.replace("file://", "");
  }

  pathToFileURL(path: string): string {
    return `file://${path}`;
  }

  logSink = {
    log: (log: ProcessedLog) => console.log(log.message),
    debug: (log: ProcessedLog) => console.debug(log.message),
    trace: (log: ProcessedLog) => console.trace(log.message),
    info: (log: ProcessedLog) => console.info(log.message),
    warn: (log: ProcessedLog) => console.warn(log.message),
    error: (log: ProcessedLog) => console.error(log.message),
  };
}
