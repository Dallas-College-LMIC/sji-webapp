# Test Plan for SJI Webapp

## Overview

This document outlines the testing strategy for the Spatial Jobs Interface (SJI) webapp, a TypeScript/Vite-based frontend application that visualizes employment access data for the Dallas-Fort Worth area using interactive maps.

## Current Status

- **Test Framework**: Vitest 3.2.3 with happy-dom environment
- **Total Tests**: 111+ tests across multiple test files
- **Current Pass Rate**: 100%
- **Coverage Target**: 80% line coverage

## Testing Framework Architecture

### Core Technologies

- **Test Runner**: Vitest 3.2.3 (fast, native ESM support)
- **DOM Environment**: happy-dom 18.0.1 (lightweight browser simulation)
- **Mocking**: Custom mocks for external dependencies + MSW 2.10.2
- **Coverage**: V8 coverage reporter
- **TypeScript**: Full type safety in tests

### Test Structure

```
src/__tests__/
├── unit/
│   ├── api.test.ts                 # API service tests (15 tests)
│   ├── mapUtils.test.ts            # Map utilities tests (10 tests)
│   ├── controllers/
│   │   ├── baseMapController.test.ts        # Base controller tests (19 tests)
│   │   ├── occupationMapController.test.ts  # Occupation controller tests (13 tests)
│   │   └── wageMapController.test.ts        # Wage controller tests (10 tests)
│   ├── services/
│   │   ├── cacheService.test.ts    # Cache service tests (12 tests)
│   │   └── uiService.test.ts       # UI service tests (16 tests)
│   └── utils/
│       └── errorHandler.test.ts    # Error handler tests (16 tests)
├── fixtures/
│   └── apiResponses.ts             # Mock API data
├── mocks/
│   ├── mapbox-gl.ts               # Mapbox GL JS mocks
│   └── jquery.ts                  # jQuery/Select2 mocks
├── utils/
│   └── testHelpers.ts             # Test utility functions
└── setup.ts                       # Global test configuration
```

## Test Categories

### 1. Unit Tests (Current Focus)

#### API Service Tests (15 tests, ✅ all passing)
- ✅ Basic HTTP requests (GET, POST)
- ✅ Request interceptors and response handling
- ✅ Response parsing and transformation
- ✅ Error handling edge cases
- ✅ Retry logic and exponential backoff
- ✅ Timeout handling with AbortController
- ✅ Request cancellation scenarios

#### Cache Service Tests (12 tests, ✅ all passing)
- ✅ Basic get/set operations
- ✅ TTL (Time To Live) functionality
- ✅ Cache clearing and invalidation
- ✅ Storage quota handling
- ✅ Serialization edge cases
- ✅ Concurrent access patterns
- ✅ Error recovery mechanisms

#### Map Utils Tests (10 tests, ✅ all passing)
- ✅ Map initialization and configuration
- ✅ Source management (add/remove/update)
- ✅ Layer creation/removal
- ✅ Event handling and cleanup

#### Base Map Controller Tests (19 tests, ✅ all passing)
- ✅ Controller initialization and setup
- ✅ Map configuration and styling
- ✅ Data loading workflows
- ✅ UI state management
- ✅ Export functionality
- ✅ Error handling and recovery

#### Error Handler Tests (16 tests, ✅ all passing)
- ✅ Error categorization by type
- ✅ User-friendly messaging
- ✅ Structured logging functionality
- ✅ Recovery mechanisms and retry logic
- ✅ Global error handling integration

#### UI Service Tests (16 tests, ✅ all passing)
- ✅ Loading state management
- ✅ Error display and notifications
- ✅ Modal and tooltip systems
- ✅ DOM manipulation utilities
- ✅ Element visibility and content updates

#### Occupation Controller Tests (13 tests, ✅ all passing)
- ✅ Cache integration and management
- ✅ Dropdown population and filtering
- ✅ Data loading and layer updates
- ✅ User interaction handling

#### Wage Controller Tests (10 tests, ✅ all passing)
- ✅ Controller initialization
- ✅ Wage level filtering
- ✅ Map layer management
- ✅ Export functionality

### 2. Integration Tests (Planned)

#### Map Integration
- Full map initialization with data loading
- Layer switching and data updates
- User interaction flows (zoom, pan, click)
- Export functionality end-to-end

#### API Integration
- Data fetching with caching
- Error handling and retry logic
- Network failure scenarios

#### Cache Integration
- localStorage persistence
- Cache invalidation
- Cross-session data retention

### 3. End-to-End Tests (Future)

#### User Journeys
- Landing page → Map navigation
- Occupation search and selection
- Wage level filtering
- Data export workflows

#### Cross-Browser Testing
- Chrome, Firefox, Safari compatibility
- Mobile responsive behavior
- Performance on different devices

## Test Quality & Coverage

### Current Achievement ✅
- **100% Test Success Rate**: All 111 tests passing
- **Comprehensive Unit Coverage**: All major components and services tested
- **Robust Mocking Strategy**: External dependencies properly isolated
- **TypeScript Integration**: Full type safety in test suite

### Code Coverage Analysis
```bash
npm run test:coverage  # Generate detailed coverage report
```

### Mock Reliability
- **Mapbox GL JS**: Complete map lifecycle simulation
- **jQuery/Select2**: Full dropdown interaction mocking  
- **Browser APIs**: localStorage, fetch, AbortController properly mocked
- **External Services**: API responses with realistic data patterns

### Test Reliability Indicators
- **No Flaky Tests**: Consistent results across runs
- **Fast Execution**: ~2.8s total runtime for full suite
- **Isolated Tests**: No interdependencies or shared state issues
- **Error Boundaries**: Proper cleanup and teardown handling

## Testing Commands

```bash
# Development
npm test              # Run tests in watch mode
npm run test:run      # Run tests once
npm run test:ui       # Open Vitest UI interface

# Coverage
npm run test:coverage # Generate coverage report
npm run test:coverage:html # HTML coverage report

# Specific test files
npm test api.test.ts  # Run specific test file
npm test -- --grep "API Service" # Run tests matching pattern
```

## Mock Strategy

### External Dependencies

#### Mapbox GL JS
```typescript
// Complete mock with map lifecycle, events, layers
const mockMap = {
  on: vi.fn(),
  addSource: vi.fn(),
  addLayer: vi.fn(),
  // ... all map methods
}
```

#### jQuery/Select2
```typescript
// Mock jQuery with Select2 plugin
global.$ = vi.fn(() => ({
  select2: vi.fn(),
  on: vi.fn(),
  val: vi.fn()
}));
```

#### Browser APIs
```typescript
// localStorage with quota simulation
// fetch with network failure simulation
// AbortController for timeout testing
```

## Performance Targets

### Test Execution
- **Unit Tests**: < 5 seconds total
- **Integration Tests**: < 30 seconds total
- **Coverage Generation**: < 10 seconds

### Coverage Thresholds
- **Lines**: 80%
- **Functions**: 75%
- **Branches**: 70%
- **Statements**: 80%

## CI/CD Integration (Planned)

### GitHub Actions Workflow
```yaml
name: Test Suite
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test:coverage
      - run: npm run build
```

### Quality Gates
- All tests must pass for PR merge
- Coverage must not decrease
- Build must succeed
- No TypeScript errors

## Next Steps

### ✅ Phase 1: Complete Unit Test Suite (COMPLETED)
1. ✅ Fixed all API service mock issues
2. ✅ Resolved BaseMapController parameter mismatches  
3. ✅ Addressed UI service method expectations
4. ✅ Updated error handler logging expectations
5. ✅ Achieved 100% unit test pass rate (111/111 tests)

### Phase 2: Coverage Analysis & Optimization (Current)
1. Generate detailed coverage reports
2. Identify uncovered code paths
3. Add performance benchmarking tests
4. Achieve 80% line coverage target

### Phase 3: Integration Tests (Next)
1. Add end-to-end map integration tests
2. Test cache behavior across sessions
3. Add user interaction flow tests
4. API integration with real network scenarios

### Phase 4: E2E & Advanced Testing (Future)
1. Set up Playwright for cross-browser E2E tests
2. Add visual regression testing
3. Performance monitoring and benchmarks
4. Accessibility testing automation

## Maintenance

### Test Maintenance Guidelines
- Update tests when interfaces change
- Add tests for new features before implementation
- Regular mock updates for external library changes
- Quarterly review of test effectiveness

### Documentation Updates
- Keep test plan current with implementation
- Document new testing patterns
- Update troubleshooting guides
- Maintain mock documentation

## Resources

### Documentation
- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [Mapbox GL JS Testing](https://docs.mapbox.com/mapbox-gl-js/guides/testing/)

### Tools
- **IDE Extensions**: Vitest extension for VS Code
- **Coverage Visualization**: Coverage Gutters extension
- **Debugging**: Chrome DevTools integration via Vitest UI

---

*This test plan is a living document and should be updated as the project evolves.*