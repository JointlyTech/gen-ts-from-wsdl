export interface WSDLElement {
  name: string;
  type: string;
  minOccurs?: string;
  maxOccurs?: string;
  nillable?: boolean;
}

export interface WSDLComplexType {
  name: string;
  elements: WSDLElement[];
  attributes?: WSDLAttribute[];
  soapArrayType?: string;
}

export interface WSDLAttribute {
  name: string;
  type: string;
  use?: 'required' | 'optional';
}

export interface WSDLSimpleType {
  name: string;
  restriction?: {
    base: string;
    enumeration?: string[];
    pattern?: string;
    minLength?: number;
    maxLength?: number;
  };
}

export interface WSDLMessage {
  name: string;
  parts: Array<{
    name: string;
    element?: string;
    type?: string;
  }>;
}

export interface WSDLOperation {
  name: string;
  input?: {
    message: string;
  };
  output?: {
    message: string;
  };
  fault?: Array<{
    name: string;
    message: string;
  }>;
}

export interface WSDLPortType {
  name: string;
  operations: WSDLOperation[];
}

export interface ParsedWSDL {
  targetNamespace: string;
  complexTypes: WSDLComplexType[];
  simpleTypes: WSDLSimpleType[];
  messages: WSDLMessage[];
  portTypes: WSDLPortType[];
  elements: WSDLElement[];
}

export interface GeneratorOptions {
  outputPath?: string;
  namespace?: string;
  includeOperations?: boolean;
  prettify?: boolean;
}
