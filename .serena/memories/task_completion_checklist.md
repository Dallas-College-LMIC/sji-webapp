# Task Completion Checklist

When completing any coding task, ensure the following steps are performed:

## 1. Code Quality Checks
- **Type Check**: Run `npm run type-check` to ensure no TypeScript errors
- **Test Suite**: Run `npm run test:run` to ensure all tests pass
- **Build Verification**: Run `npm run build` to ensure production build succeeds

## 2. Code Review
- Verify code follows established patterns (controller inheritance, service layer)
- Ensure proper TypeScript types (no `any` types unless absolutely necessary)
- Check for proper error handling and user-friendly error messages
- Confirm no console.log statements in production code

## 3. Test Coverage
- Add/update unit tests for new functionality
- Ensure test coverage meets thresholds (80% lines, 70% branches)
- Run `npm run test:coverage` to verify coverage

## 4. Documentation
- Update CLAUDE.md if architectural changes were made
- Add JSDoc comments for public methods/complex logic
- Update type definitions if new interfaces were created

## 5. Pre-Commit Verification
- All TypeScript errors resolved
- All tests passing
- Build succeeds without errors
- No linting errors (TypeScript compiler acts as linter)

## 6. Final Steps
- Commit changes with descriptive message
- Push to feature branch (not main)
- Create pull request if needed