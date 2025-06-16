# Test Plan for SJI Webapp

## Overview

This document outlines the testing strategy for the Spatial Jobs Interface (SJI) webapp, a TypeScript/Vite-based frontend application that visualizes employment access data for the Dallas-Fort Worth area using interactive maps.

## Current Status

- **Test Framework**: Vitest with happy-dom environment
- **Total Tests**: 101 tests across 7 test files
- **Current Pass Rate**: 47/101 (46.5%)
- **Coverage Target**: 80% line coverage

## Testing Framework Architecture

### Core Technologies

- **Test Runner**: Vitest 2.1.8 (fast, native ESM support)
- **DOM Environment**: happy-dom (lightweight browser simulation)
- **Mocking**: Custom mocks for external dependencies
- **Coverage**: Istanbul with c8 reporter
- **TypeScript**: Full type safety in tests

### Test Structure

```
src/__tests__/
├── unit/
│   ├── api.test.ts                 # API service tests
│   ├── mapUtils.test.ts            # Map utilities tests
│   ├── controllers/
│   │   └── baseMapController.test.ts
│   ├── services/
│   │   ├── cacheService.test.ts
│   │   ├── errorHandler.test.ts
│   │   └── uiService.test.ts
│   └── occupation.test.ts          # Occupation controller tests
├── fixtures/
│   ├── apiResponses.ts             # Mock API data
│   └── mapData.ts                  # Test map data
├── mocks/
│   ├── mapbox.ts                   # Mapbox GL JS mocks
│   ├── jquery.ts                   # jQuery/Select2 mocks
│   └── browser.ts                  # Browser API mocks
└── setup.ts                       # Global test configuration
```

## Test Categories

### 1. Unit Tests (Current Focus)

#### API Service Tests (15 tests, 11 passing)
- ✅ Basic HTTP requests (GET, POST)
- ✅ Request interceptors
- ✅ Response parsing
- ❌ Error handling edge cases
- ❌ Retry logic
- ❌ Timeout handling
- ❌ Request cancellation

#### Cache Service Tests (12 tests, 8 passing)
- ✅ Basic get/set operations
- ✅ TTL (Time To Live) functionality
- ✅ Cache clearing
- ❌ Storage quota handling
- ❌ Serialization edge cases
- ❌ Concurrent access
- ❌ Error recovery

#### Map Utils Tests (10 tests, 9 passing)
- ✅ Map initialization
- ✅ Source management
- ✅ Layer creation/removal
- ❌ Event handling edge cases

#### Base Map Controller Tests (23 tests, 12 passing)
- ✅ Controller initialization
- ✅ Map setup
- ❌ Data loading workflows
- ❌ UI state management
- ❌ Export functionality
- ❌ Error handling

#### Error Handler Tests (10 tests, 1 passing)
- ❌ Error categorization
- ❌ User-friendly messaging
- ❌ Logging functionality
- ❌ Recovery mechanisms

#### UI Service Tests (13 tests, 0 passing)
- ❌ Loading state management
- ❌ Error display
- ❌ Notification system
- ❌ DOM manipulation

#### Occupation Controller Tests (8 tests, 1 passing)
- ❌ Cache integration
- ❌ Dropdown population
- ❌ Data filtering

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

## Current Issues & Fixes Needed

### Priority 1: Critical Failures

#### API Service Issues
- **Fetch Mock Problems**: Mock doesn't return proper Response objects
  ```typescript
  // Current issue: mock returns undefined for response.ok
  // Fix: Update mock to return { ok: true, json: () => Promise.resolve(data) }
  ```

- **Retry Logic Mismatch**: Tests expect different retry behavior
- **Timeout Handling**: AbortController signals not properly mocked

#### Base Map Controller Issues
- **Method Signature Mismatches**: Tests expect different parameters
- **Import Resolution**: uiService module import failures
- **Async Operation Handling**: Tests timing out on Promise chains

### Priority 2: Service Layer Fixes

#### UI Service Issues
- **Missing Methods**: Tests expect methods not in implementation
  - `updateElementContent`
  - `setElementVisibility`
  - `addTooltip`
- **Parameter Structure**: Different signatures expected vs actual

#### Error Handler Issues
- **Logging Format**: Tests expect simple logs, implementation uses structured logging
- **Error Categorization**: Different error analysis than expected

### Priority 3: Component Integration

#### Occupation Controller Issues
- **Cache Integration**: Tests don't match actual caching behavior
- **DOM Interaction**: Select2 integration mocking issues

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

### Phase 1: Fix Existing Tests (Week 1)
1. Fix API service mock issues
2. Resolve BaseMapController parameter mismatches
3. Address UI service method expectations
4. Update error handler logging expectations

### Phase 2: Complete Unit Coverage (Week 2)
1. Add missing test cases for edge scenarios
2. Improve mock fidelity
3. Add performance tests
4. Achieve 80% coverage target

### Phase 3: Integration Tests (Week 3)
1. Add map integration tests
2. Test cache behavior end-to-end
3. Add user interaction tests
4. API integration scenarios

### Phase 4: E2E & CI (Week 4)
1. Set up Playwright for E2E tests
2. Implement GitHub Actions workflow
3. Add cross-browser testing
4. Performance monitoring

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