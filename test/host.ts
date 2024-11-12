import { CompilerHost, SourceFile, ProcessedLog } from "@typespec/compiler";
import * as path from "path";
import * as fs from "fs";
import { fileURLToPath } from "url";

export function createTypeSpecHost(
  files: Record<string, string>
): CompilerHost {
  // Add standard library files to the files record
  const libPath = path.join(process.cwd(), "node_modules/@typespec/compiler/lib");
  const libFiles = fs.readdirSync(libPath);
  
  for (const file of libFiles) {
    if (file.endsWith('.tsp')) {
      const fullPath = path.join(libPath, file);
      files[fullPath] = fs.readFileSync(fullPath, 'utf-8');
    }
  }

  async function readFile(filePath: string): Promise<SourceFile> {
    const normalizedPath = path.normalize(filePath);
    const content = files[normalizedPath];
    if (!content) {
      throw new Error(`File not found: ${filePath}`);
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
    files[normalizedPath] = content;
    return Promise.resolve();
  }

  return {
    readFile,
    writeFile,
    getExecutionRoot: () => process.cwd(),
    getLibDirs: () => [libPath],
    mkdirp: async (path: string) => path,
    realpath: async (path: string) => path,
    readUrl: () => {
      throw new Error("Method not implemented.");
    },
    readDir: () => Promise.resolve([]),
    rm: () => Promise.resolve(),
    getJsImport: () => Promise.resolve({}),
    stat: async (path: string) => ({
      isDirectory: () => !!files[path],
      isFile: () => !!files[path],
    }),
    getSourceFileKind: (path: string) =>
      path.endsWith(".tsp") ? "typespec" : "js",

    fileURLToPath: (url: string) => url.replace("file://", ""),
    pathToFileURL: (path: string) => `file://${path}`,

    logSink: {
      log: (log: ProcessedLog) => console.log(log.message),
    },
  };
}
