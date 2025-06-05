# @jointly/gen-ts-from-wsdl

[![npm version](https://badge.fury.io/js/@jointly%2Fgen-ts-from-wsdl.svg)](https://badge.fury.io/js/@jointly%2Fgen-ts-from-wsdl)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A powerful command-line tool and Node.js library to generate TypeScript interfaces and types from WSDL (Web Services Description Language) files for SOAP services.

## Features

- 🔄 **WSDL Parsing**: Parse WSDL files from local paths or URLs
- 📝 **TypeScript Generation**: Generate clean, typed TypeScript interfaces
- 🏗️ **Complex Types Support**: Handle complex XML Schema types and nested structures
- 🎯 **Simple Types Support**: Convert XML Schema simple types with restrictions
- 📨 **Message Types**: Generate types for SOAP messages
- ⚙️ **Operation Interfaces**: Optional generation of service operation interfaces
- 📦 **Namespace Support**: Organize generated types with custom namespaces
- 🔧 **CLI & Programmatic**: Use as a command-line tool or Node.js library

## Installation

### Global Installation (CLI)

```bash
npm install -g @jointly/gen-ts-from-wsdl
```

### Local Installation (Project Dependency)

```bash
npm install @jointly/gen-ts-from-wsdl
```

```bash
yarn add @jointly/gen-ts-from-wsdl
```

## Usage

### Command Line Interface

#### Using npx (No Installation Required)

You can run the tool directly without installing it globally using `npx`:

```bash
npx @jointly/gen-ts-from-wsdl <wsdl-file-or-url> [options]
```

##### npx Examples

```bash
# Generate types from a local WSDL file
npx @jointly/gen-ts-from-wsdl ./service.wsdl

# Generate types from a URL with custom output
npx @jointly/gen-ts-from-wsdl https://example.com/service.wsdl -o ./types/soap-api.ts

# Generate with namespace and operations
npx @jointly/gen-ts-from-wsdl ./service.wsdl -n ApiTypes --include-operations
```

#### Basic Usage (Global Installation)

```bash
gen-ts-from-wsdl <wsdl-file-or-url> [options]
```

#### Examples

```bash
# Generate types from a local WSDL file
gen-ts-from-wsdl ./service.wsdl

# Generate types from a URL
gen-ts-from-wsdl https://example.com/service.wsdl

# Specify custom output file
gen-ts-from-wsdl ./service.wsdl -o ./generated/soap-types.ts

# Add namespace and include operations
gen-ts-from-wsdl ./service.wsdl -n MyService --include-operations

# Disable code prettification
gen-ts-from-wsdl ./service.wsdl --no-prettify
```

#### CLI Options

| Option | Alias | Description | Default |
|--------|-------|-------------|---------|
| `--output` | `-o` | Output file path | `./types.ts` |
| `--namespace` | `-n` | Namespace for generated types | (none) |
| `--include-operations` | | Include operation interfaces | `false` |
| `--no-prettify` | | Disable code prettification | `false` |

### Programmatic Usage

```typescript
import { WSDLParser, TypeScriptGenerator, GeneratorOptions } from '@jointly/gen-ts-from-wsdl';

async function generateTypes() {
  const parser = new WSDLParser();
  const generator = new TypeScriptGenerator();

  // Parse WSDL
  const parsedWSDL = await parser.parseWSDL('./service.wsdl');

  // Configure generation options
  const options: GeneratorOptions = {
    outputPath: './generated-types.ts',
    namespace: 'MyServiceTypes',
    includeOperations: true,
    prettify: true,
  };

  // Generate TypeScript types
  await generator.writeTypesToFile(parsedWSDL, './generated-types.ts', options);
}

generateTypes().catch(console.error);
```

## Generated Output

The tool generates TypeScript interfaces based on the WSDL schema definitions:

### Complex Types
```typescript
export interface UserInfo {
  id: number;
  name: string;
  email?: string;
  roles: string[];
}
```

### Simple Types with Restrictions
```typescript
export type UserStatus = 'active' | 'inactive' | 'pending';

export type UserId = string; // Pattern: /^[A-Z]{2}\d{6}$/
```

### Message Types
```typescript
export interface GetUserRequest {
  userId: string;
}

export interface GetUserResponse {
  user: UserInfo;
  success: boolean;
}
```

### Operation Interfaces (Optional)
```typescript
export interface UserServiceOperations {
  GetUser(request: GetUserRequest): Promise<GetUserResponse>;
  UpdateUser(request: UpdateUserRequest): Promise<UpdateUserResponse>;
}
```

## Configuration

### Generator Options

```typescript
interface GeneratorOptions {
  outputPath: string;           // Output file path
  namespace?: string;           // Optional namespace wrapper
  includeOperations?: boolean;  // Include operation interfaces
  prettify?: boolean;          // Format generated code
}
```

## Development

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Setup

```bash
# Clone the repository
git clone https://github.com/JointlyTech/gen-ts-from-wsdl.git
cd gen-ts-from-wsdl

# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test

# Development mode with auto-rebuild
npm run dev
```

### Scripts

- `npm run build` - Compile TypeScript to JavaScript
- `npm run dev` - Run in development mode with ts-node
- `npm test` - Run Jest tests
- `npm start` - Run the compiled CLI tool
- `npm run release:patch|minor|major` - Release new version

## Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Contributors

- **Pellegrino Durante** - [@PellegrinoDurante](https://github.com/PellegrinoDurante)
- **Luigi Colombi** - [@Gigiz](https://github.com/Gigiz)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/JointlyTech/gen-ts-from-wsdl/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/JointlyTech/gen-ts-from-wsdl/discussions)
- 📧 **Email**: dev@jointly.pro

---

Made with ❤️ by [Jointly](https://www.jointly.pro)
