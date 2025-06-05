#!/usr/bin/env node

import { Command } from 'commander';
import { WSDLParser } from './wsdl-parser.js';
import { TypeScriptGenerator } from './typescript-generator.js';
import { GeneratorOptions } from './types.js';

const program = new Command();

program
  .name('gen-ts-from-wsdl')
  .description('Generate TypeScript types from WSDL files')
  .version('1.0.2');

program
  .argument('<wsdl>', 'WSDL file path or URL')
  .option('-o, --output <path>', 'output file path', './types.ts')
  .option('-n, --namespace <namespace>', 'namespace for generated types')
  .option('--include-operations', 'include operation interfaces', false)
  .option('--no-prettify', 'disable code prettification')
  .action(async (wsdlSource: string, options: any) => {
    try {
      console.log('🚀 Starting WSDL to TypeScript generation...');
      console.log(`📄 Source: ${wsdlSource}`);
      console.log(`📁 Output: ${options.output}`);
      
      const parser = new WSDLParser();
      const generator = new TypeScriptGenerator();
      
      console.log('📖 Parsing WSDL...');
      const parsedWSDL = await parser.parseWSDL(wsdlSource);
      
      console.log(`✅ Found ${parsedWSDL.complexTypes.length} complex types`);
      console.log(`✅ Found ${parsedWSDL.simpleTypes.length} simple types`);
      console.log(`✅ Found ${parsedWSDL.messages.length} messages`);
      console.log(`✅ Found ${parsedWSDL.elements.length} elements`);
      
      const generatorOptions: GeneratorOptions = {
        outputPath: options.output,
        namespace: options.namespace,
        includeOperations: options.includeOperations,
        prettify: options.prettify !== false,
      };
      
      console.log('🔧 Generating TypeScript types...');
      await generator.writeTypesToFile(parsedWSDL, options.output, generatorOptions);
      
      console.log('✨ TypeScript types generated successfully!');
      
    } catch (error) {
      console.error('❌ Error:', error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

program.parse();
