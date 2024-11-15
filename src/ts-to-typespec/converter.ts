import {
  Project,
  SourceFile,
  Type,
  TypeFormatFlags,
  SyntaxKind,
  TypeAliasDeclaration,
  InterfaceDeclaration,
  TypeChecker,
  JSDocableNode,
} from "ts-morph";
import {
  Commas,
  Indent,
  lazy,
  type LazyString,
  SemicolonLines,
  Stanzas,
  Union,
} from "./strings.ts";

const tsp = lazy<TypeSpecScope>;

type TypeSpecScope = {
  namespace?: TypeSpecScope;
  using: string[];
  typeSymbols: string[][];
};
type TypeSpecString = LazyString<TypeSpecScope>;

function Builtin(s: string): LazyString<TypeSpecScope> {
  return {
    attach() {},
    toString() {
      return s;
    },
  };
}

Builtin.String = Builtin("string");
Builtin.Boolean = Builtin("boolean");
Builtin.Float64 = Builtin("float64");
Builtin.Record = Builtin("Record");

type ConversionResult =
  | {
      kind: "error";
      file: string;
      error: Error;
    }
  | {
      kind: "success";
      file: string;
      result: TypeSpecString;
    };

type ConversionContext = {
  project: Project;
  typechecker: TypeChecker;
  models: { name: string; type: Type }[];
};

type Model = {
  node: TypeAliasDeclaration | InterfaceDeclaration;
  name: string;
  type: Type;
};

export function convert(project: Project, files: string[]): string {
  const models = project
    .getSourceFiles()
    .flatMap((sourceFile) => getConvertibleNodes(sourceFile));

  const ctx = { project, typechecker: project.getTypeChecker(), models };

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
      result: convertSourceFile(ctx, sourceFile),
    };
  });

  return conversions
    .filter((conversion) => conversion.kind === "success")
    .map((conversion) => `// ${conversion.file}\n${conversion.result}`)
    .join("\n\n");
}

function getTag(node: JSDocableNode, name: string) {
  return node
    .getJsDocs()
    .flatMap((doc) => doc.getTags())
    .find((tag) => tag.getTagName() === name);
}

function getDecorators(node: JSDocableNode): string[] {
  return node
    .getJsDocs()
    .flatMap((doc) => doc.getTags())
    .filter((tag) => tag.getTagName() === "decorator")
    .map((tag) => tag.getCommentText()?.trim() || "")
    .filter((text) => text.length > 0);
}

function getConvertibleNodes(sourceFile: SourceFile): Model[] {
  return [
    ...sourceFile.getChildrenOfKind(SyntaxKind.TypeAliasDeclaration),
    ...sourceFile.getChildrenOfKind(SyntaxKind.InterfaceDeclaration),
  ]
    .filter((node) => getTag(node, "model"))
    .map((node) => ({
      name: getTag(node, "model")?.getCommentText()?.trim() || node.getName(),
      type: node.getType(),
      node,
    }));
}

function convertSourceFile(
  ctx: ConversionContext,
  sourceFile: SourceFile
): TypeSpecString {
  return Stanzas(
    ...getConvertibleNodes(sourceFile).map((model) => convertModel(ctx, model))
  );
}

function convertModel(ctx: ConversionContext, model: Model): TypeSpecString {
  const typeText = convertType(ctx, model.type);
  const decorators = getDecorators(model.node);
  
  const typeArgs = model.type
    .getTypeArguments()
    .map((_, index) => ["T"][index]);

  const isObjectLike =
    model.type.isObject() &&
    !model.type.isArray() &&
    !model.type.isTuple() &&
    model.type.getSymbol()?.getName() !== "Array" &&
    model.type.getSymbol()?.getName() !== "Record";

  const generics =
    isObjectLike && typeArgs.length ? `<${typeArgs.join(", ")}>` : "";

  const decoratorText = decorators.length > 0 
    ? decorators.map(d => `@${d}\n`).join("") 
    : "";

  if (isObjectLike) {
    return tsp`${decoratorText}model ${model.name}${generics} ${typeText};`;
  }

  return tsp`${decoratorText}alias ${model.name}${generics} = ${typeText};`;
}

function referenceType(ctx: ConversionContext, type: Type): TypeSpecString {
  const model = ctx.models.find((model) => model.type === type);
  if (model) {
    // TODO
    return tsp`${model.name}`;
  }

  return convertType(ctx, type);
}

function convertType(ctx: ConversionContext, type: Type): TypeSpecString {
  if (type.isString()) {
    return Builtin.String;
  }
  if (type.isTemplateLiteral()) {
    // TODO: this should probably escape double quotes and investigate how escapes should work
    const string = type.compilerType.texts
      .flatMap((t, index) => {
        const subType =
          type.compilerType.types[index] &&
          referenceType(
            ctx,
            // @ts-expect-error
            ctx.project._context.compilerFactory.getType(
              type.compilerType.types[index]
            )
          );

        return [t, subType && `\${${subType}}`];
      })
      .join("");
    return tsp`"${string}"`;
  }
  if (type.isNumber()) {
    return Builtin.Float64;
  }
  if (type.isBoolean()) {
    return Builtin.Boolean;
  }
  if (type.isArray()) {
    return tsp`${referenceType(ctx, type.getArrayElementType()!)}[]`;
  }
  if (type.isTuple()) {
    const tupleTypes = type.getTupleElements();
    return tsp`[${Commas(...tupleTypes.map((t) => referenceType(ctx, t)))}]`;
  }
  if (type.isObject()) {
    const symbol = type.getSymbol();

    // Handle generic types
    if (type.getTypeArguments().length > 0) {
      const baseType = symbol?.getName() || "";
      const typeArgs = type
        .getTypeArguments()
        .map((t) => referenceType(ctx, t));

      // Special case for built-in generics
      if (baseType === "Array") {
        return tsp`${typeArgs[0]}[]`;
      }

      if (baseType === "Record") {
        return tsp`${Builtin.Record}<${typeArgs[1]}>`;
      }
    }

    const properties = type.getProperties();
    const propertyStrings = properties.map(
      (prop) =>
        tsp`${prop.getName()}${prop.isOptional() ? "?" : ""}: ${referenceType(
          ctx,
          prop.getTypeAtLocation(prop.getValueDeclaration()!)
        )}`
    );

    if (properties.length === 0) {
      return tsp`{}`;
    }

    return tsp`
      {
        ${SemicolonLines(...propertyStrings)}
      }
    `;
  }
  if (type.isUnion()) {
    return Union(
      ...type.getUnionTypes().map((type) => referenceType(ctx, type))
    );
  }
  if (type.isIntersection()) {
    const properties = type.getProperties();
    const propertyStrings = properties.map((prop) => {
      const type = referenceType(
        ctx,
        prop.getTypeAtLocation(prop.getValueDeclaration()!)
      );
      return tsp`${prop.getName()}${prop.isOptional() ? "?" : ""}: ${type}`;
    });
    return tsp`
      {
        ${SemicolonLines(...propertyStrings)}
      }
    `;
  }

  // Default case - use the type's text representation with proper formatting
  const typeText = type.getText(
    undefined,
    TypeFormatFlags.NoTruncation |
      TypeFormatFlags.WriteClassExpressionAsTypeLiteral
  );

  return tsp`${typeText}`;
}
