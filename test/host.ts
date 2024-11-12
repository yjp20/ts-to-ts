import { CompilerHost, SourceFile, ProcessedLog } from "@typespec/compiler";
import * as path from "path";

export function createTypeSpecHost(): CompilerHost {
  const files = new Map<string, string>();

  async function readFile(filePath: string): Promise<SourceFile> {
    const normalizedPath = path.normalize(filePath);
    const content = files.get(normalizedPath);
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

  function writeFile(filePath: string, content: string): Promise<void> {
    const normalizedPath = path.normalize(filePath);
    files.set(normalizedPath, content);
    return Promise.resolve();
  }

  function fileExists(filePath: string): boolean {
    const normalizedPath = path.normalize(filePath);
    return files.has(normalizedPath);
  }

  function deleteFile(filePath: string): Promise<void> {
    const normalizedPath = path.normalize(filePath);
    files.delete(normalizedPath);
    return Promise.resolve();
  }

  function listFiles(dir: string): string[] {
    return Array.from(files.keys()).filter((file) => file.startsWith(dir));
  }

  function addFile(filePath: string, content: string): void {
    const normalizedPath = path.normalize(filePath);
    files.set(normalizedPath, content);
  }

  return {
    readFile,
    writeFile,
    getExecutionRoot: () => process.cwd(),
    getLibDirs: () => ["node_modules/@typespec/compiler/lib"],
    mkdirp: async (path: string) => path,
    realpath: async (path: string) => path,
    fileExists,
    deleteFile,
    listFiles,
    readDirectory: (dir: string) => ({
      files: listFiles(dir),
      directories: [],
    }),
    getCurrentDirectory: () => process.cwd(),
    readUrl: () => {
      throw new Error("Method not implemented.");
    },
    readDir: () => Promise.resolve([]),
    rm: () => Promise.resolve(),
    getJsImport: () => Promise.resolve(null),
    addFile,
    stat: async (path: string) => ({
      isDirectory: () => !files.has(path),
      isFile: () => files.has(path),
    }),
    getSourceFileKind: (path: string) => path.endsWith(".tsp") ? "typespec" : "js",
    fileURLToPath: (url: string) => url.replace("file://", ""),
    pathToFileURL: (path: string) => `file://${path}`,
    logSink: {
      log: (log: ProcessedLog) => console.log(log.message),
      debug: (log: ProcessedLog) => console.debug(log.message),
      trace: (log: ProcessedLog) => console.trace(log.message),
      info: (log: ProcessedLog) => console.info(log.message),
      warn: (log: ProcessedLog) => console.warn(log.message),
      error: (log: ProcessedLog) => console.error(log.message),
    },
  };
}
