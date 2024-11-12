import {
  Project,
  Type,
  TypeFormatFlags,
  Node,
  TypeAliasDeclaration,
  InterfaceDeclaration,
} from "ts-morph";

export class TypeScriptToTypeSpecConverter {
  private project: Project;

  constructor() {
    this.project = new Project();
  }

  /**
   * Convert a TypeScript type definition string to TypeSpec
   */
  public convertTypeToTypeSpec(typeDefinition: string): string {
    const sourceFile = this.project.createSourceFile(
      "temp.ts",
      typeDefinition,
      { overwrite: true }
    );

    // Find the first type alias or interface declaration
    const typeNode = sourceFile.getFirstDescendant(
      (node) =>
        Node.isTypeAliasDeclaration(node) || Node.isInterfaceDeclaration(node)
    );

    if (!typeNode) {
      throw new Error("No type alias or interface declaration found");
    }

    if (Node.isTypeAliasDeclaration(typeNode)) {
      return this.convertTypeAliasToTypeSpec(typeNode);
    } else if (Node.isInterfaceDeclaration(typeNode)) {
      return this.convertInterfaceToTypeSpec(typeNode);
    }

    throw new Error("Unsupported type definition");
  }

  private convertTypeAliasToTypeSpec(typeAlias: TypeAliasDeclaration): string {
    const name = typeAlias.getName();
    const type = typeAlias.getType();
    const typeText = this.convertTypeToTypeSpecString(type);

    // For simple types, use alias instead of model
    if (type.isString() || type.isNumber() || type.isBoolean()) {
      return `alias ${name} = ${typeText};`;
    }

    return `model ${name} ${typeText};`;
  }

  private convertInterfaceToTypeSpec(
    interfaceDecl: InterfaceDeclaration
  ): string {
    const name = interfaceDecl.getName();
    const type = interfaceDecl.getType();
    const typeText = this.convertTypeToTypeSpecString(type);

    return `model ${name} ${typeText};`;
  }

  private convertTypeToTypeSpecString(type: Type): string {
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
      const elementType = type.getArrayElementType()!;
      return `${this.convertTypeToTypeSpecString(elementType)}[]`;
    }
    if (type.isObject()) {
      const properties = type.getProperties();
      const propertyStrings = properties.map((prop) => {
        const propType = prop.getTypeAtLocation(prop.getValueDeclaration()!);
        return `${prop.getName()}: ${this.convertTypeToTypeSpecString(propType)}`;
      });

      return `{\n  ${propertyStrings.join(",\n  ")}\n}`;
    }
    if (type.isUnion()) {
      const types = type.getUnionTypes();
      return types.map((t) => this.convertTypeToTypeSpecString(t)).join(" | ");
    }

    // Default case - use the type's text representation
    return type.getText(undefined, TypeFormatFlags.None);
  }
}
