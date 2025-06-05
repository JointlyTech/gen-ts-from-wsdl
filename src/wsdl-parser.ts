import * as xml2js from 'xml2js';
import axios from 'axios';
import * as fs from 'fs';
import { ParsedWSDL, WSDLComplexType, WSDLSimpleType, WSDLMessage, WSDLPortType, WSDLElement, WSDLAttribute } from './types.js';

export class WSDLParser {
  private namespaces: Map<string, string> = new Map();

  async parseWSDL(wsdlSource: string): Promise<ParsedWSDL> {
    let wsdlContent: string;

    // Check if it's a URL or file path
    if (wsdlSource.startsWith('http://') || wsdlSource.startsWith('https://')) {
      wsdlContent = await this.downloadWSDL(wsdlSource);
    } else {
      wsdlContent = await this.readWSDLFile(wsdlSource);
    }

    const parser = new xml2js.Parser({
      explicitArray: false,
      ignoreAttrs: false,
      mergeAttrs: true,
      explicitCharkey: false,
    });

    const result = await parser.parseStringPromise(wsdlContent);
    return this.extractTypes(result);
  }

  private async downloadWSDL(url: string): Promise<string> {
    try {
      console.log(`Downloading WSDL from: ${url}`);
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'wsdl-to-ts/1.0.0',
        },
        timeout: 30000,
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to download WSDL from ${url}: ${error}`);
    }
  }

  private async readWSDLFile(filePath: string): Promise<string> {
    try {
      console.log(`Reading WSDL file: ${filePath}`);
      return fs.readFileSync(filePath, 'utf-8');
    } catch (error) {
      throw new Error(`Failed to read WSDL file ${filePath}: ${error}`);
    }
  }

  private extractTypes(wsdlData: any): ParsedWSDL {
    const definitions = wsdlData.definitions || wsdlData['wsdl:definitions'];
    if (!definitions) {
      throw new Error('Invalid WSDL: No definitions found');
    }

    // Extract namespaces
    this.extractNamespaces(definitions);

    const targetNamespace = definitions.targetNamespace || '';
    
    // Extract schema types
    const types = definitions.types || definitions['wsdl:types'] || {};
    
    const schema = types.schema || types['xs:schema'] || types['xsd:schema'] || [];
    const schemas = Array.isArray(schema) ? schema : [schema].filter(Boolean);

    const complexTypes: WSDLComplexType[] = [];
    const simpleTypes: WSDLSimpleType[] = [];
    const elements: WSDLElement[] = [];

    schemas.forEach(s => {
      // Handle complexType with different namespace prefixes
      const complexTypeElements = s.complexType || s['xs:complexType'] || s['xsd:complexType'];
      if (complexTypeElements) {
        const ctypes = Array.isArray(complexTypeElements) ? complexTypeElements : [complexTypeElements];
        complexTypes.push(...ctypes.map((ct: any) => this.parseComplexType(ct)));
      }
      
      // Handle simpleType with different namespace prefixes
      const simpleTypeElements = s.simpleType || s['xs:simpleType'] || s['xsd:simpleType'];
      if (simpleTypeElements) {
        const stypes = Array.isArray(simpleTypeElements) ? simpleTypeElements : [simpleTypeElements];
        simpleTypes.push(...stypes.map((st: any) => this.parseSimpleType(st)));
      }

      // Handle element with different namespace prefixes
      const elementElements = s.element || s['xs:element'] || s['xsd:element'];
      if (elementElements) {
        const elems = Array.isArray(elementElements) ? elementElements : [elementElements];
        elements.push(...elems.map((el: any) => this.parseElement(el)));
      }
    });

    // Extract messages
    const messages: WSDLMessage[] = [];
    const messageElements = definitions.message || definitions['wsdl:message'] || [];
    const messageArray = Array.isArray(messageElements) ? messageElements : [messageElements].filter(Boolean);
    
    messageArray.forEach(msg => {
      messages.push(this.parseMessage(msg));
    });

    // Extract port types
    const portTypes: WSDLPortType[] = [];
    const portTypeElements = definitions.portType || definitions['wsdl:portType'] || [];
    const portTypeArray = Array.isArray(portTypeElements) ? portTypeElements : [portTypeElements].filter(Boolean);
    
    portTypeArray.forEach(pt => {
      portTypes.push(this.parsePortType(pt));
    });

    return {
      targetNamespace,
      complexTypes,
      simpleTypes,
      messages,
      portTypes,
      elements,
    };
  }

  private extractNamespaces(definitions: any): void {
    Object.keys(definitions).forEach(key => {
      if (key.startsWith('xmlns:') || key === 'xmlns') {
        const prefix = key === 'xmlns' ? '' : key.substring(6);
        this.namespaces.set(prefix, definitions[key]);
      }
    });
  }

  private parseComplexType(complexType: any): WSDLComplexType {
    const name = complexType.name;
    const elements: WSDLElement[] = [];
    const attributes: WSDLAttribute[] = [];

    // Handle sequence elements with namespace prefixes
    const sequence = complexType.sequence || complexType['xs:sequence'] || complexType['xsd:sequence'];
    if (sequence) {
      const seqElements = sequence.element || sequence['xs:element'] || sequence['xsd:element'];
      if (seqElements) {
        const elementArray = Array.isArray(seqElements) ? seqElements : [seqElements];
        elements.push(...elementArray.map((el: any) => this.parseElement(el)));
      }
    }

    // Handle all elements with namespace prefixes (similar to sequence but order doesn't matter)
    const all = complexType.all || complexType['xs:all'] || complexType['xsd:all'];
    if (all) {
      const allElements = all.element || all['xs:element'] || all['xsd:element'];
      if (allElements) {
        const elementArray = Array.isArray(allElements) ? allElements : [allElements];
        elements.push(...elementArray.map((el: any) => this.parseElement(el)));
      }
    }

    // Handle choice elements with namespace prefixes
    const choice = complexType.choice || complexType['xs:choice'] || complexType['xsd:choice'];
    if (choice) {
      const choiceElements = choice.element || choice['xs:element'] || choice['xsd:element'];
      if (choiceElements) {
        const elementArray = Array.isArray(choiceElements) ? choiceElements : [choiceElements];
        elements.push(...elementArray.map((el: any) => this.parseElement(el)));
      }
    }

    // Handle attributes with namespace prefixes
    const attrs = complexType.attribute || complexType['xs:attribute'] || complexType['xsd:attribute'];
    if (attrs) {
      const attrArray = Array.isArray(attrs) ? attrs : [attrs];
      attributes.push(...attrArray.map((attr: any) => this.parseAttribute(attr)));
    }

    // Handle complexContent extension with namespace prefixes
    const complexContent = complexType.complexContent || complexType['xs:complexContent'] || complexType['xsd:complexContent'];
    if (complexContent) {
      const extension = complexContent.extension || complexContent['xs:extension'] || complexContent['xsd:extension'];
      if (extension) {
        // Handle sequence in extension
        const extSequence = extension.sequence || extension['xs:sequence'] || extension['xsd:sequence'];
        if (extSequence) {
          const extElements = extSequence.element || extSequence['xs:element'] || extSequence['xsd:element'];
          if (extElements) {
            const elementArray = Array.isArray(extElements) ? extElements : [extElements];
            elements.push(...elementArray.map((el: any) => this.parseElement(el)));
          }
        }

        // Handle all in extension
        const extAll = extension.all || extension['xs:all'] || extension['xsd:all'];
        if (extAll) {
          const extElements = extAll.element || extAll['xs:element'] || extAll['xsd:element'];
          if (extElements) {
            const elementArray = Array.isArray(extElements) ? extElements : [extElements];
            elements.push(...elementArray.map((el: any) => this.parseElement(el)));
          }
        }

        // Handle choice in extension
        const extChoice = extension.choice || extension['xs:choice'] || extension['xsd:choice'];
        if (extChoice) {
          const extElements = extChoice.element || extChoice['xs:element'] || extChoice['xsd:element'];
          if (extElements) {
            const elementArray = Array.isArray(extElements) ? extElements : [extElements];
            elements.push(...elementArray.map((el: any) => this.parseElement(el)));
          }
        }
      }

      // Handle SOAP array restrictions
      const restriction = complexContent.restriction || complexContent['xs:restriction'] || complexContent['xsd:restriction'];
      if (restriction && (restriction.base === 'soapenc:Array' || restriction.base === 'SOAP-ENC:Array')) {
        const arrayTypeAttr = restriction.attribute;
        if (arrayTypeAttr) {
          const attr = Array.isArray(arrayTypeAttr) ? arrayTypeAttr[0] : arrayTypeAttr;
          
          // Check for wsdl:arrayType directly on the attribute
          const arrayType = attr['wsdl:arrayType'];
          if (arrayType) {
            // Extract the array type, removing the [] suffix
            const soapArrayType = arrayType.replace(/\[\]$/, '');
            return {
              name,
              elements,
              attributes: attributes.length > 0 ? attributes : undefined,
              soapArrayType: this.cleanTypeName(soapArrayType),
            };
          }
        }
      }
    }

    return {
      name,
      elements,
      attributes: attributes.length > 0 ? attributes : undefined,
    };
  }

  private parseSimpleType(simpleType: any): WSDLSimpleType {
    const name = simpleType.name;
    const restriction = simpleType.restriction || simpleType['xs:restriction'] || simpleType['xsd:restriction'];

    if (restriction) {
      const result: WSDLSimpleType = {
        name,
        restriction: {
          base: this.cleanTypeName(restriction.base),
        },
      };

      const enumeration = restriction.enumeration || restriction['xs:enumeration'] || restriction['xsd:enumeration'];
      if (enumeration) {
        const enums = Array.isArray(enumeration) ? enumeration : [enumeration];
        result.restriction!.enumeration = enums.map((e: any) => e.value);
      }

      const pattern = restriction.pattern || restriction['xs:pattern'] || restriction['xsd:pattern'];
      if (pattern) {
        result.restriction!.pattern = pattern.value;
      }

      const minLength = restriction.minLength || restriction['xs:minLength'] || restriction['xsd:minLength'];
      if (minLength) {
        result.restriction!.minLength = parseInt(minLength.value);
      }

      const maxLength = restriction.maxLength || restriction['xs:maxLength'] || restriction['xsd:maxLength'];
      if (maxLength) {
        result.restriction!.maxLength = parseInt(maxLength.value);
      }

      return result;
    }

    return { name };
  }

  private parseElement(element: any): WSDLElement {
    return {
      name: element.name,
      type: this.cleanTypeName(element.type),
      minOccurs: element.minOccurs,
      maxOccurs: element.maxOccurs,
      nillable: element.nillable === 'true',
    };
  }

  private parseAttribute(attribute: any): WSDLAttribute {
    return {
      name: attribute.name,
      type: this.cleanTypeName(attribute.type),
      use: attribute.use as 'required' | 'optional',
    };
  }

  private parseMessage(message: any): WSDLMessage {
    const parts = message.part ? (Array.isArray(message.part) ? message.part : [message.part]) : [];
    
    return {
      name: message.name,
      parts: parts.map((part: any) => ({
        name: part.name,
        element: part.element,
        type: part.type ? this.cleanTypeName(part.type) : undefined,
      })),
    };
  }

  private parsePortType(portType: any): WSDLPortType {
    const operations = portType.operation ? (Array.isArray(portType.operation) ? portType.operation : [portType.operation]) : [];
    
    return {
      name: portType.name,
      operations: operations.map((op: any) => ({
        name: op.name,
        input: op.input ? { message: this.cleanTypeName(op.input.message) } : undefined,
        output: op.output ? { message: this.cleanTypeName(op.output.message) } : undefined,
        fault: op.fault ? (Array.isArray(op.fault) ? op.fault : [op.fault]).map((f: any) => ({
          name: f.name,
          message: this.cleanTypeName(f.message),
        })) : undefined,
      })),
    };
  }

  private cleanTypeName(typeName: string): string {
    if (!typeName) return 'any';
    
    // Remove namespace prefixes
    const colonIndex = typeName.lastIndexOf(':');
    if (colonIndex !== -1) {
      return typeName.substring(colonIndex + 1);
    }
    
    return typeName;
  }
}
