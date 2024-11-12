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

    return `model ${name} = ${typeText};`;
  }

  private convertInterfaceToTypeSpec(
    interfaceDecl: InterfaceDeclaration
  ): string {
    const name = interfaceDecl.getName();
    const type = interfaceDecl.getType();
    const typeText = this.convertTypeToTypeSpecString(type);

    return `model ${name} = ${typeText};`;
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
      const symbol = type.getSymbol();
      
      // Handle mapped types
      if (type.isIndexType()) {
        const indexType = type.getIndexType();
        const constraintType = type.getConstraintType();
        if (indexType && constraintType) {
          return `Record<${this.convertTypeToTypeSpecString(constraintType)}, ${this.convertTypeToTypeSpecString(indexType)}>`;
        }
      }

      // Handle generic types
      if (type.getTypeArguments().length > 0) {
        const baseType = symbol?.getName() || '';
        const typeArgs = type.getTypeArguments().map(t => 
          this.convertTypeToTypeSpecString(t)
        );
        
        // Special case for built-in generics
        if (baseType === 'Array') {
          return `${typeArgs[0]}[]`;
        }
        if (baseType === 'Record') {
          return `Record<${typeArgs.join(", ")}>`;
        }
        
        return `${baseType}<${typeArgs.join(", ")}>`;
      }

      const properties = type.getProperties();
      const propertyStrings = properties.map((prop) => {
        const propType = prop.getTypeAtLocation(prop.getValueDeclaration()!);
        const isOptional = prop.isOptional();
        const propName = prop.getName();
        const typeString = this.convertTypeToTypeSpecString(propType);
        return `${propName}${isOptional ? '?' : ''}: ${typeString}`;
      });

      if (properties.length === 0) {
        return "Record<never, never>";
      }

      return `{\n  ${propertyStrings.join(",\n  ")}\n}`;
    }
    if (type.isUnion()) {
      const types = type.getUnionTypes();
      const typeStrings = types.map(t => {
        if (t.isLiteral()) {
          const value = t.getLiteralValue();
          return typeof value === 'string' ? `"${value}"` : `${value}`;
        }
        if (t.isNull()) {
          return 'null';
        }
        return this.convertTypeToTypeSpecString(t);
      });
      return typeStrings.join(" | ");
    }

    if (type.isIntersection()) {
      const types = type.getIntersectionTypes();
      return `{\n  ...${types.map(t => this.convertTypeToTypeSpecString(t)).join(",\n  ...")}\n}`;
    }

    // Default case - use the type's text representation with proper formatting
    const typeText = type.getText(undefined, 
      TypeFormatFlags.NoTruncation | 
      TypeFormatFlags.WriteClassExpressionAsTypeLiteral
    );
    return typeText;
  }
}
