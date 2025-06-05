import * as fs from 'fs';
import * as path from 'path';
import { ParsedWSDL, WSDLComplexType, WSDLSimpleType, WSDLElement, WSDLMessage, GeneratorOptions } from './types';

export class TypeScriptGenerator {
  private typeMapping: Map<string, string> = new Map([
    ['string', 'string'],
    ['int', 'number'],
    ['integer', 'number'],
    ['long', 'number'],
    ['short', 'number'],
    ['byte', 'number'],
    ['unsignedlong', 'number'],
    ['unsignedint', 'number'],
    ['unsignedshort', 'number'],
    ['unsignedbyte', 'number'],
    ['float', 'number'],
    ['double', 'number'],
    ['decimal', 'number'],
    ['boolean', 'boolean'],
    ['date', 'Date'],
    ['datetime', 'Date'],
    ['time', 'Date'],
    ['base64binary', 'string'],
    ['hexbinary', 'string'],
    ['anyuri', 'string'],
    ['qname', 'string'],
    ['anytype', 'any'],
  ]);

  generateTypes(parsedWSDL: ParsedWSDL, options: GeneratorOptions = {}): string {
    const lines: string[] = [];
    
    // Add header comment
    lines.push('// Generated TypeScript types from WSDL');
    lines.push('// Generated on: ' + new Date().toISOString());
    lines.push('');

    // Generate simple types (enums and restricted types)
    if (parsedWSDL.simpleTypes.length > 0) {
      lines.push('// Simple Types');
      parsedWSDL.simpleTypes.forEach(simpleType => {
        lines.push(...this.generateSimpleType(simpleType));
        lines.push('');
      });
    }

    // Generate complex types
    if (parsedWSDL.complexTypes.length > 0) {
      lines.push('// Complex Types');
      parsedWSDL.complexTypes.forEach(complexType => {
        lines.push(...this.generateComplexType(complexType));
        lines.push('');
      });
    }

    // Generate element types
    if (parsedWSDL.elements.length > 0) {
      lines.push('// Element Types');
      parsedWSDL.elements.forEach(element => {
        lines.push(...this.generateElementType(element));
        lines.push('');
      });
    }

    // Generate message types
    if (parsedWSDL.messages.length > 0) {
      lines.push('// Message Types');
      parsedWSDL.messages.forEach(message => {
        lines.push(...this.generateMessageType(message, parsedWSDL));
        lines.push('');
      });
    }

    // Generate operation interfaces if requested
    if (options.includeOperations && parsedWSDL.portTypes.length > 0) {
      lines.push('// Service Operations');
      parsedWSDL.portTypes.forEach(portType => {
        lines.push(...this.generatePortTypeInterface(portType));
        lines.push('');
      });
    }

    return lines.join('\n');
  }

  async writeTypesToFile(parsedWSDL: ParsedWSDL, outputPath: string = './types.ts', options: GeneratorOptions = {}): Promise<void> {
    const content = this.generateTypes(parsedWSDL, options);
    
    // Ensure directory exists
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(outputPath, content);
    console.log(`TypeScript types written to: ${outputPath}`);
  }

  private generateSimpleType(simpleType: WSDLSimpleType): string[] {
    const lines: string[] = [];
    
    if (simpleType.restriction?.enumeration) {
      // Generate enum
      lines.push(`export enum ${this.toPascalCase(simpleType.name)} {`);
      simpleType.restriction.enumeration.forEach((value, index) => {
        const enumKey = this.toEnumKey(value);
        const comma = index < simpleType.restriction!.enumeration!.length - 1 ? ',' : '';
        lines.push(`  ${enumKey} = '${value}'${comma}`);
      });
      lines.push('}');
    } else if (simpleType.restriction) {
      // Generate type alias with restrictions as comments
      const baseType = this.mapXmlTypeToTypeScript(simpleType.restriction.base);
      let comment = '';
      
      if (simpleType.restriction.pattern) {
        comment += `// Pattern: ${simpleType.restriction.pattern}\n`;
      }
      if (simpleType.restriction.minLength !== undefined) {
        comment += `// Min length: ${simpleType.restriction.minLength}\n`;
      }
      if (simpleType.restriction.maxLength !== undefined) {
        comment += `// Max length: ${simpleType.restriction.maxLength}\n`;
      }
      
      if (comment) {
        lines.push(comment.trim());
      }
      lines.push(`export type ${this.toPascalCase(simpleType.name)} = ${baseType};`);
    } else {
      lines.push(`export type ${this.toPascalCase(simpleType.name)} = any;`);
    }
    
    return lines;
  }

  private generateComplexType(complexType: WSDLComplexType): string[] {
    const lines: string[] = [];
    const interfaceName = this.toPascalCase(complexType.name);
    
    // Handle SOAP array types
    if (complexType.soapArrayType) {
      const elementType = this.mapXmlTypeToTypeScript(complexType.soapArrayType);
      lines.push(`export type ${interfaceName} = ${elementType}[];`);
      return lines;
    }
    
    lines.push(`export interface ${interfaceName} {`);
    
    // Generate properties from elements
    complexType.elements.forEach(element => {
      const propertyName = this.toCamelCase(element.name);
      const propertyType = this.mapXmlTypeToTypeScript(element.type);
      const isOptional = element.minOccurs === '0' || element.nillable;
      const isArray = element.maxOccurs === 'unbounded' || (element.maxOccurs && parseInt(element.maxOccurs) > 1);
      
      let finalType = propertyType;
      if (isArray) {
        finalType = `${propertyType}[]`;
      }
      if (element.nillable) {
        finalType = `${finalType} | null`;
      }
      
      const optionalMarker = isOptional ? '?' : '';
      lines.push(`  ${propertyName}${optionalMarker}: ${finalType};`);
    });
    
    // Generate properties from attributes
    if (complexType.attributes) {
      complexType.attributes.forEach(attribute => {
        const propertyName = this.toCamelCase(attribute.name);
        const propertyType = this.mapXmlTypeToTypeScript(attribute.type);
        const isOptional = attribute.use !== 'required';
        const optionalMarker = isOptional ? '?' : '';
        
        lines.push(`  ${propertyName}${optionalMarker}: ${propertyType};`);
      });
    }
    
    lines.push('}');
    return lines;
  }

  private generateElementType(element: WSDLElement): string[] {
    const lines: string[] = [];
    const typeName = this.toPascalCase(element.name);
    const baseType = this.mapXmlTypeToTypeScript(element.type);
    
    const isArray = element.maxOccurs === 'unbounded' || (element.maxOccurs && parseInt(element.maxOccurs) > 1);
    let finalType = baseType;
    
    if (isArray) {
      finalType = `${baseType}[]`;
    }
    if (element.nillable) {
      finalType = `${finalType} | null`;
    }
    
    lines.push(`export type ${typeName} = ${finalType};`);
    return lines;
  }

  private generateMessageType(message: WSDLMessage, parsedWSDL: ParsedWSDL): string[] {
    const lines: string[] = [];
    const interfaceName = this.toPascalCase(message.name);
    
    lines.push(`export interface ${interfaceName} {`);
    
    message.parts.forEach(part => {
      const propertyName = this.toCamelCase(part.name);
      let propertyType = 'any';
      
      if (part.element) {
        // Find the element in the parsed WSDL
        const cleanElementName = this.cleanTypeName(part.element);
        const element = parsedWSDL.elements.find(el => el.name === cleanElementName);
        if (element) {
          propertyType = this.mapXmlTypeToTypeScript(element.type);
        } else {
          propertyType = this.toPascalCase(cleanElementName);
        }
      } else if (part.type) {
        propertyType = this.mapXmlTypeToTypeScript(part.type);
      }
      
      lines.push(`  ${propertyName}: ${propertyType};`);
    });
    
    lines.push('}');
    return lines;
  }

  private generatePortTypeInterface(portType: any): string[] {
    const lines: string[] = [];
    const interfaceName = `I${this.toPascalCase(portType.name)}`;
    
    lines.push(`export interface ${interfaceName} {`);
    
    portType.operations.forEach((operation: any) => {
      const methodName = this.toCamelCase(operation.name);
      const inputType = operation.input ? this.toPascalCase(operation.input.message) : 'void';
      const outputType = operation.output ? this.toPascalCase(operation.output.message) : 'void';
      
      lines.push(`  ${methodName}(request: ${inputType}): Promise<${outputType}>;`);
    });
    
    lines.push('}');
    return lines;
  }

  private mapXmlTypeToTypeScript(xmlType: string): string {
    if (!xmlType) return 'any';
    
    const cleanType = this.cleanTypeName(xmlType);
    
    // Check direct mapping first
    const mapped = this.typeMapping.get(cleanType.toLowerCase());
    if (mapped) return mapped;
    
    // If not found, assume it's a custom type and convert to PascalCase
    return this.toPascalCase(cleanType);
  }

  private toPascalCase(str: string): string {
    if (!str) return '';
    return str
      .replace(/[-_\s]+(.)?/g, (_, char) => char ? char.toUpperCase() : '')
      .replace(/^(.)/, (_, char) => char.toUpperCase());
  }

  private toCamelCase(str: string): string {
    if (!str) return '';
    const pascalCase = this.toPascalCase(str);
    return pascalCase.charAt(0).toLowerCase() + pascalCase.slice(1);
  }

  private toEnumKey(value: string): string {
    return value
      .replace(/[^a-zA-Z0-9]/g, '_')
      .replace(/^(\d)/, '_$1') // Prefix with underscore if starts with number
      .toUpperCase();
  }

  private cleanTypeName(typeName: string): string {
    if (!typeName) return 'any';
    
    // Remove namespace prefixes (including tns:, xs:, xsd:, etc.)
    const colonIndex = typeName.lastIndexOf(':');
    if (colonIndex !== -1) {
      return typeName.substring(colonIndex + 1);
    }
    
    return typeName;
  }
}
