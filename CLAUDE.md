# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a TypeScript MCP (Model Context Protocol) server that integrates with iNavi Maps API. It communicates with MCP Hosts (Claude Desktop, Cursor, etc.) via **stdio transport** (not HTTP), providing map visualization tools and API specifications.

**Project Purpose:**
Enable AI assistants to work with geospatial data and visualize results on interactive maps through:
1. **HTML Example Tools**: Code templates for custom map visualizations
2. **API Spec Tools**: iNavi Maps API specifications for reference

**Key Technology Stack:**
- TypeScript with strict type checking
- MCP SDK (@modelcontextprotocol/sdk) for MCP Host integration
- Zod for runtime validation
- stdio transport (no Express/HTTP server needed for MCP functionality)

## Common Commands

### Development
```bash
npm run dev          # Development mode with hot reload
npm run build        # Compile TypeScript to JavaScript
npm start            # Run compiled server
```

### Testing
```bash
npm test             # Run all tests with Vitest
npm run test:ui      # Run tests with Vitest UI
npm run test:coverage # Run tests with coverage report
npm run test:watch   # Run tests in watch mode
```

### Code Quality
```bash
npm run lint         # Check code style
npm run lint:fix     # Auto-fix linting issues
npm run format       # Format code with Prettier
npm run format:check # Check formatting
npm run type-check   # TypeScript type checking without emit
```

### API Docs
```bash
npm run update-api-docs   # Update API documentation
npm run validate-api-docs # Validate API documentation
```

### Release
```bash
npm run release        # Patch release
npm run release:minor  # Minor release
npm run release:major  # Major release
```

## Architecture

### MCP Server Pattern

This project uses **stdio-based MCP architecture**, NOT a traditional web server:

1. **server.ts** - Entry point, creates McpServer instance and registers tools via stdio transport
2. **tools/** - MCP tool definitions with Zod schemas
3. **config/** - Environment configuration with Zod validation
4. **utils/** - Shared utilities (logger, etc.)

**Key Difference from Web Servers:**
- No HTTP routes or Express middleware
- Communication happens via stdin/stdout with MCP Host
- Tools are registered with `server.registerTool()`, not Express routes
- The server is spawned as a subprocess by the MCP Host

### Environment Configuration

Environment variables are validated at startup in `config/env.config.ts` using Zod. The server will fail fast if required variables are missing.

**Optional (with defaults):**
- `NODE_ENV` - Environment mode (default: `development`, options: `development` | `production` | `test`)
- `PORT` - Server port (default: `3000`)
- `INAVI_DOMAIN` - iNavi Maps API domain (default: `https://imaps.inavi.com`; `/maps/v3.0` is appended automatically)

**Removed environment variables:**
- `MCP_SERVER_NAME` - Now read from `package.json` `name` field
- `MCP_SERVER_VERSION` - Now read from `package.json` `version` field

The config object is typed and exported as a singleton for use throughout the application.

## Code Conventions

These conventions apply to all source files (including scripts). Follow them when adding or editing code.

### Function ordering (top-to-bottom by call order)

Order functions in **call order, from top to bottom**: the highest-level function comes first, and each helper it calls appears **below** it (relying on JS function-declaration hoisting). The entry point (`main`) is the single exception — it goes at the **very bottom** of the file.

- ✅ Correct: `main` at the bottom; above it, functions ordered so a caller always appears above the helpers it invokes (e.g. `transformReferenceApis` before `parseErrorTable`/`buildErrorTable`).
- ❌ Wrong: helpers defined first and the function that uses them placed below them (bottom-to-top).

### Prefer stream (array) methods over `for` loops

Prefer `map`/`filter`/`reduce`/`forEach`/`flatMap` over imperative `for`/`for...of` loops in production and pipeline code. Reach for a plain loop only when a stream form is clearly less readable.

- ✅ `items.filter(pred).forEach(fn)` / `lines.map(parse).filter(Boolean).reduce(build, {})`
- ❌ `for (const item of items) { if (pred(item)) fn(item); }`

## Available MCP Tools

### HTML Example Tools

Provide HTML code templates for map visualizations. Use two-step workflow:
1. `list_map_examples` - Browse available examples by category
2. `get_map_example` - Get specific example with full HTML code

**Implementation:** `src/tools/map-examples/map-examples.tool.ts`

### API Spec Tools

Provide iNavi Maps API specifications for reference.
1. `list_api_specs` - List available API specifications
2. `get_api_spec` - Get specific API specification details

**Implementation:** `src/tools/api-specs/api-specs.tool.ts`
