# Code Style and Conventions

## TypeScript Configuration
- **Strict Mode**: Full type safety with `strict: true`
- **No Implicit Types**: `noImplicitAny`, `strictNullChecks` enabled
- **Unused Code Detection**: `noUnusedLocals`, `noUnusedParameters` enabled
- **Safe Indexing**: `noUncheckedIndexedAccess` enabled
- **ES2020 Target**: Modern JavaScript features
- **ESNext Modules**: Modern module system

## File Structure
- `src/js/`: Main TypeScript source files
- `src/js/controllers/`: Controller classes (inheritance pattern)
- `src/js/services/`: Service layer for external communication
- `src/js/utils/`: Utility functions and helpers
- `src/types/`: TypeScript type definitions
- `src/__tests__/`: Test files organized by type (unit, integration, etc.)

## Naming Conventions
- **Files**: kebab-case (e.g., `base-map-controller.ts`)
- **Classes**: PascalCase (e.g., `BaseMapController`)
- **Methods/Functions**: camelCase (e.g., `initializeMapWithEmptySource`)
- **Constants**: UPPER_SNAKE_CASE (implied from patterns)
- **Interfaces/Types**: PascalCase with descriptive names

## Code Patterns
- **Controller Inheritance**: Base class pattern with shared functionality
- **Async/Await**: Modern promise handling
- **Error Handling**: Try-catch blocks with user-friendly error messages
- **Type Safety**: Explicit typing for all parameters and return values
- **Modular Imports**: ES6 import/export syntax
- **No Console Logs**: In production (development has debug utilities)

## Testing Patterns
- **Test Organization**: Separate unit, integration, and performance tests
- **Mocking**: Complete mocks for external dependencies
- **Setup/Teardown**: Consistent test environment reset
- **Coverage Requirements**: 80% lines, 70% branches/functions