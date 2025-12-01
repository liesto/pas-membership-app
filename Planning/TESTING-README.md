# Testing Documentation Quick Reference

This folder contains all testing-related documentation for the PAS Membership App. Use this README to navigate the right document.

---

## 📚 Documentation Files

### 1. **testing-standards.md** ⭐ START HERE
**Purpose**: Living reference guide for how to write tests
**Use when**:
- Writing tests for a new feature
- Need a pattern for unit tests, integration tests, or mocking
- Want to understand our testing philosophy
- Looking for best practices and examples

**Key sections**:
- Testing philosophy and principles
- Test structure and organization
- Patterns for utilities, services, and components
- Mocking strategies (MSW, vi.spyOn, modules)
- Code review checklist for tests
- Common test patterns with real examples

---

### 2. **testing-and-implementation-summary.md**
**Purpose**: Historical record of CreateAccount + Salesforce integration work
**Use when**:
- Want to understand what was built in December 2025
- Need context on why we chose rollback strategy
- Want to see test results from Phase 1 implementation
- Looking for examples from actual code

**Key sections**:
- What was built (infrastructure, utilities, services, component extension)
- Architecture and error handling strategy
- 40 passing tests breakdown
- Implementation decisions made
- Success criteria met
- Next steps for manual smoke testing

---

### 3. **create-account-salesforce-integration.md**
**Purpose**: Detailed implementation plan for CreateAccount + Salesforce
**Use when**:
- Understanding the multi-phase approach
- Need to review requirements or decisions
- Want full technical details of the implementation
- Planning similar features

**Key sections**:
- Overview and objectives
- Architecture decisions (rollback, validation, testing)
- 6-phase implementation plan
- File structure and success criteria
- Risk mitigation strategies

---

## 🚀 Quick Start: Writing Tests for a New Feature

### Step 1: Read the Standards
Open `testing-standards.md` and find the pattern that matches your feature:
- **Utility function?** → Pattern 1: Testing Pure Functions
- **API service?** → Pattern 2: Testing API Services
- **React component?** → Pattern 3: Mocking & Component Testing

### Step 2: Create Test File
```bash
# For utilities
touch src/utils/[name].test.ts

# For services
touch src/services/[name].test.ts

# For components (future)
mkdir -p src/__tests__/pages
touch src/__tests__/pages/[Component].test.tsx
```

### Step 3: Copy the Pattern
Find the relevant pattern in `testing-standards.md` and use it as a template.

### Step 4: Write Tests
Follow the pattern and write your tests:
```typescript
describe('My Feature', () => {
  it('should [behavior] when [condition]', () => {
    // Test code
  });
});
```

### Step 5: Run Tests
```bash
npm test:run -- src/path/to/test.test.ts
```

### Step 6: Commit
Include tests with your feature code in the same commit.

---

## 📋 Test Organization

### Test Files Currently Exist
```
src/
├── utils/
│   ├── validation.ts
│   └── validation.test.ts ✅ (29 tests)
├── services/
│   ├── salesforceApi.ts
│   ├── clerkApi.ts
│   └── __tests__/services/
│       ├── salesforceApi.test.ts ✅ (8 tests)
│       └── clerkApi.test.ts ✅ (3 tests)
└── __tests__/
    ├── setup.ts (MSW configuration)
    └── mocks/
        └── salesforceHandlers.ts (API mocks)
```

### Test Files to Create Next
```
src/pages/MyAccount.tsx
  └── __tests__/pages/MyAccount.test.tsx (future)

src/services/stripeApi.ts
  └── __tests__/services/stripeApi.test.ts (future)

src/utils/paymentUtils.ts
  └── utils/paymentUtils.test.ts (future)
```

---

## ✅ Test Checklist

Before committing code with tests:

- [ ] Test file created in correct location
- [ ] Test names describe what is being tested
- [ ] Tests pass locally: `npm test:run`
- [ ] Each test tests one thing
- [ ] Mocks are cleaned up properly
- [ ] No console.log or debugging code left
- [ ] Tests run in < 100ms total
- [ ] Related tests grouped in `describe()` blocks
- [ ] Edge cases covered (null, undefined, empty, wrong type)
- [ ] Error scenarios tested

---

## 🔧 Common Commands

```bash
# Run all tests once
npm test:run

# Run tests in watch mode (development)
npm test

# Run tests with interactive UI
npm test:ui

# Run specific test file
npm test:run -- src/utils/validation.test.ts

# Run tests matching pattern
npm test:run -- --grep "phone"

# Future: Run with coverage
npm test:run -- --coverage
```

---

## 💡 Key Principles (Condensed from testing-standards.md)

1. **Test Behavior, Not Implementation**
   - Good: Testing what the function does
   - Bad: Testing internal variables

2. **Clear Test Names**
   - Format: `should [expected] when [condition]`
   - Example: `should show error when phone is invalid`

3. **Fast & Isolated**
   - Each test < 50ms
   - Tests don't depend on each other
   - Clean up after each test

4. **One Assertion Per Test** (Mostly)
   - Bad: Testing 5 different scenarios in one test
   - Good: One test per scenario

---

## 📊 Current Test Status

| Component | Tests | Status | Coverage |
|-----------|-------|--------|----------|
| Phone Validation | 29 | ✅ Pass | 100% |
| Salesforce API | 8 | ✅ Pass | 100% |
| Clerk API | 3 | ✅ Pass | 100% |
| **Total** | **40** | **✅ All Pass** | **100%** |

---

## 🎯 Testing Goals

**Our targets**:
- 80% overall code coverage
- 100% coverage for utilities and services
- All tests pass before merging
- Tests run in < 2 seconds total

---

## 📖 For More Details

| Topic | Document | Section |
|-------|----------|---------|
| How to write a test | testing-standards.md | Writing Unit Tests |
| Mocking strategies | testing-standards.md | Mocking Strategies |
| What was built | testing-and-implementation-summary.md | What Was Built |
| Architecture decisions | create-account-salesforce-integration.md | Architecture Decisions |
| Common test patterns | testing-standards.md | Common Patterns |
| Debugging help | testing-standards.md | Debugging Tests |

---

## 🤔 Questions?

1. **How do I test a utility function?**
   → See testing-standards.md: Pattern 1

2. **How do I mock an API?**
   → See testing-standards.md: Mocking Strategies (MSW section)

3. **What tests exist already?**
   → See testing-and-implementation-summary.md: Test Results

4. **Why did we choose rollback strategy?**
   → See create-account-salesforce-integration.md: Key Implementation Decisions

5. **What's the test coverage goal?**
   → See testing-standards.md: Test Coverage Goals

---

## 📝 Document Maintenance

- **testing-standards.md**: Update when adding new patterns or discovering better practices
- **testing-and-implementation-summary.md**: Static (historical record of Phase 1)
- **create-account-salesforce-integration.md**: Static (historical record of planning)
- **TESTING-README.md** (this file): Update as new testing documents are created

---

**Last Updated**: December 1, 2025
**Test Status**: All 40 tests passing ✅
**Ready for**: Manual smoke testing with backend API
