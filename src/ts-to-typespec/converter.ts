import { Project, SourceFile, Type, TypeFormatFlags, Node } from "ts-morph";

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
      result: convertSourceFile(sourceFile),
    };
  });

  return conversions
    .filter((conversion) => conversion.kind === "success")
    .map((conversion) => `// ${conversion.file}\n${conversion.result}`)
    .join("\n\n");
}

export function convertSourceFile(sourceFile: SourceFile): string {}

export function convertTypeDefinition(node: Node): string {
  if (Node.isTypeAliasDeclaration(node)) {
    const name = node.getName();
    const type = node.getType();
    const typeText = convertType(type);

    // For simple types, use alias instead of model
    if (type.isString() || type.isNumber() || type.isBoolean()) {
      return `alias ${name} = ${typeText};`;
    }

    return `model ${name} = ${typeText};`;
  } else if (Node.isInterfaceDeclaration(node)) {
    const name = node.getName();
    const type = node.getType();
    const typeText = convertType(type);

    return `model ${name} = ${typeText};`;
  }

  return ``;
}

export function convertType(type: Type): string {
  if (type.isString()) {
    return "string";
  }
  if (type.isNumber()) {
    return "number";
  }
  if (type.isBoolean()) {
    return "boolean";
  }
  if (type.isArray()) {
    // Handle tuple types
    if (type.isTuple()) {
      const tupleTypes = type.getTupleElements();
      return `[${tupleTypes.map((t) => convertType(t)).join(", ")}]`;
    }
    const elementType = type.getArrayElementType()!;
    return `${convertType(elementType)}[]`;
  }
  if (type.isObject()) {
    const symbol = type.getSymbol();

    // Handle generic types
    if (type.getTypeArguments().length > 0) {
      const baseType = symbol?.getName() || "";
      const typeArgs = type.getTypeArguments().map((t) => convertType(t));

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
      const propType = prop.getTypeAtLocation(prop.getValueDeclaration()!);
      const isOptional = prop.isOptional();
      const propName = prop.getName();
      const typeString = convertType(propType);
      return `${propName}${isOptional ? "?" : ""}: ${typeString}`;
    });

    if (properties.length === 0) {
      return "Record<never, never>";
    }

    return `{\n  ${propertyStrings.join(",\n  ")}\n}`;
  }
  if (type.isUnion()) {
    const types = type.getUnionTypes();
    const typeStrings = types.map((t) => {
      if (t.isLiteral()) {
        const value = t.getLiteralValue();
        return typeof value === "string" ? `"${value}"` : `${value}`;
      }
      if (t.isNull()) {
        return "null";
      }
      if (t.isTemplateLiteral()) {
        return `\`${t.getText()}\``;
      }
      return convertType(t);
    });
    return typeStrings.join(" | ");
  }

  if (type.isIntersection()) {
    const types = type.getIntersectionTypes();
    return `{\n  ...${types.map((t) => convertType(t)).join(",\n  ...")}\n}`;
  }

  // Default case - use the type's text representation with proper formatting
  const typeText = type.getText(
    undefined,
    TypeFormatFlags.NoTruncation |
      TypeFormatFlags.WriteClassExpressionAsTypeLiteral
  );
  return typeText;
}
