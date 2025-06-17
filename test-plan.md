# Test Plan for SJI Webapp

## Overview

This document outlines the testing strategy for the Spatial Jobs Interface (SJI) webapp, a TypeScript/Vite-based frontend application that visualizes employment access data for the Dallas-Fort Worth area using interactive maps.

## Current Status

Comprehensive testing infrastructure in place - see CLAUDE.md for current implementation details.

## Testing Framework

Vitest 3.2.3 with TypeScript, Testing Library, and comprehensive mocking - full architecture documented in CLAUDE.md.

## Test Categories

### 1. Unit Tests (Current Focus)

#### Unit Test Coverage ✅ COMPLETED
- All major components, services, and utilities tested
- 100% pass rate across 111+ tests
- Complete mocking strategy for external dependencies

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
- Complete unit test suite with TypeScript integration
- Fast, reliable execution with comprehensive mocking
- Ready for integration and E2E test phases

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

Comprehensive external dependency mocking - implementation details in test files.

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

### ✅ Phase 1: Unit Testing (COMPLETED)
Comprehensive unit test suite with 100% pass rate achieved.

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

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [Mapbox GL JS Testing](https://docs.mapbox.com/mapbox-gl-js/guides/testing/)

---

*This test plan is a living document and should be updated as the project evolves.*