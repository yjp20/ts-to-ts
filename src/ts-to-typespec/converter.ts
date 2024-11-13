import {
  Project,
  SourceFile,
  Type,
  TypeFormatFlags,
  SyntaxKind,
  TypeAliasDeclaration,
  InterfaceDeclaration,
  TypeChecker,
} from "ts-morph";

function indent(text: string, level = 1): string {
  const spaces = "  ".repeat(level);
  return text.split("\n").map(line => line ? spaces + line : line).join("\n");
}

type ConversionResult =
  | {
      kind: "error";
      file: string;
      error: Error;
    }
  | {
      kind: "success";
      file: string;
      result: string;
    };

type ConversionContext = {
  project: Project;
  typechecker: TypeChecker;
};

export function convertProject(project: Project, files: string[]): string {
  const conversions = files.map((file): ConversionResult => {
    const sourceFile = project.getSourceFile(file);
    if (!sourceFile) {
      return {
        kind: "error",
        file,
        error: new Error(`Source file ${JSON.stringify(file)}`),
      };
    }

    return {
      kind: "success",
      file,
      result: convertSourceFile(
        { project, typechecker: project.getTypeChecker() },
        sourceFile
      ),
    };
  });

  return conversions
    .filter((conversion) => conversion.kind === "success")
    .map((conversion) => `// ${conversion.file}\n${conversion.result}`)
    .join("\n\n");
}

function convertSourceFile(
  ctx: ConversionContext,
  sourceFile: SourceFile
): string {
  const nodes = [
    ...sourceFile.getChildrenOfKind(SyntaxKind.TypeAliasDeclaration),
    ...sourceFile.getChildrenOfKind(SyntaxKind.InterfaceDeclaration),
  ];

  const convertibleNodes = nodes.filter((node) => {
    return node
      .getJsDocs()
      .flatMap((doc) => doc.getTags())
      .some((tag) => tag.getTagName() === "model");
  });

  return convertibleNodes
    .map((node) => convertTypeDefinition(ctx, node))
    .filter((text) => text.length > 0)
    .join("\n\n");
}

function convertTypeDefinition(
  ctx: ConversionContext,
  node: TypeAliasDeclaration | InterfaceDeclaration
): string {
  const name = node.getName();
  const type = node.getType();
  const typeText = convertType(ctx, type);

  return `alias ${name} = ${typeText};`;
}

function referenceType(ctx: ConversionContext, type: Type): string {
  return convertType(ctx, type);
}

function convertType(ctx: ConversionContext, type: Type): string {
  if (type.isString()) {
    return "string";
  }
  if (type.isTemplateLiteral()) {
    // TODO: this should probably escape double quotes and investigate how escapes should work
    const string = type.compilerType.texts
      .flatMap((t, index) => {
        const subType =
          type.compilerType.types[index] &&
          convertType(
            ctx,
            // @ts-expect-error
            ctx.project._context.compilerFactory.getType(
              type.compilerType.types[index]
            )
          );

        return [t, subType && `\${${subType}}`];
      })
      .join("");
    return `"${string}"`;
  }
  if (type.isNumber()) {
    return "float64";
  }
  if (type.isBoolean()) {
    return "boolean";
  }
  if (type.isArray()) {
    // Handle tuple types
    const elementType = type.getArrayElementType()!;
    return `${convertType(ctx, elementType)}[]`;
  }

  if (type.isTuple()) {
    const tupleTypes = type.getTupleElements();
    return `[${tupleTypes.map((t) => convertType(ctx, t)).join(", ")}]`;
  }

  if (type.isObject()) {
    const symbol = type.getSymbol();

    // Handle generic types
    if (type.getTypeArguments().length > 0) {
      const baseType = symbol?.getName() || "";
      const typeArgs = type.getTypeArguments().map((t) => convertType(ctx, t));

      // Special case for built-in generics
      if (baseType === "Array") {
        return `${typeArgs[0]}[]`;
      }

      if (baseType === "Record") {
        return `Record<${typeArgs.join(", ")}>`;
      }

      return `${baseType}<${typeArgs.join(", ")}>`;
    }

    const properties = type.getProperties();
    const propertyStrings = properties.map((prop) => {
      const type = convertType(
        ctx,
        prop.getTypeAtLocation(prop.getValueDeclaration()!)
      );
      return `${prop.getName()}${prop.isOptional() ? "?" : ""}: ${type}`;
    });

    if (properties.length === 0) {
      return "Record<never, never>";
    }

    return `{\n${indent(propertyStrings.join(",\n"))}\n}`;
  }

  if (type.isUnion()) {
    return type
      .getUnionTypes() //
      .map((type) => convertType(ctx, type))
      .join(" | ");
  }

  if (type.isIntersection()) {
    const types = type.getIntersectionTypes();
    return `{\n${indent(types.map((type) => "..." + convertType(ctx, type)).join(",\n"))}\n}`;
  }

  // Default case - use the type's text representation with proper formatting
  const typeText = type.getText(
    undefined,
    TypeFormatFlags.NoTruncation |
      TypeFormatFlags.WriteClassExpressionAsTypeLiteral
  );

  return typeText;
}
