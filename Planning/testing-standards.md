# Testing Standards - PAS Membership App

**Last Updated**: December 1, 2025
**Status**: Living Document - Updated as testing practices evolve

This document defines the testing standards and best practices for the PAS Membership App. Use this as a reference when writing tests for new features.

---

## Table of Contents
1. [Testing Philosophy](#testing-philosophy)
2. [Testing Stack](#testing-stack)
3. [Test Structure & Organization](#test-structure--organization)
4. [Writing Unit Tests](#writing-unit-tests)
5. [Writing Integration Tests](#writing-integration-tests)
6. [Mocking Strategies](#mocking-strategies)
7. [Test Coverage Goals](#test-coverage-goals)
8. [Common Patterns](#common-patterns)
9. [Debugging Tests](#debugging-tests)
10. [CI/CD & Automation](#cicd--automation)

---

## Testing Philosophy

### Core Principles
1. **Test Behavior, Not Implementation**
   - Test what the function does, not how it does it
   - Bad: Testing internal variables or private functions
   - Good: Testing inputs, outputs, and side effects

2. **Write Tests Before (or With) Code**
   - TDD approach when possible
   - At minimum, write tests alongside features
   - Never commit untested code

3. **One Assertion Per Test** (Mostly)
   - Each test should verify one thing
   - Exception: Related assertions about the same behavior are OK
   - Bad: Testing 5 different features in one test
   - Good: One test per feature/scenario

4. **Clear, Descriptive Test Names**
   - Test names should explain what is being tested and expected
   - Format: `should [expected behavior] when [condition]`
   - Example: `should show error message when phone number is invalid`

5. **Fast, Isolated, Repeatable**
   - Tests should run in < 100ms (aim for < 50ms)
   - Each test should be independent (no shared state)
   - Tests should pass/fail consistently

### Test Pyramid
```
        /\
       /  \        Integration Tests
      /----\       (Test full flows with real APIs)
     /      \
    /--------\     Component Tests
   /          \    (Test React components)
  /            \
 /              \   Unit Tests
/________________\  (Test utilities, services, pure functions)
```

**Our Focus**: Heavy on unit tests (fast, isolated), some integration tests (verify real behavior)

---

## Testing Stack

### Current Tools
| Tool | Purpose | Version |
|------|---------|---------|
| Vitest | Test runner | ^3.2.4 |
| @testing-library/react | React testing utilities | ^16.3.0 |
| @testing-library/user-event | User interaction simulation | ^14.6.1 |
| @testing-library/dom | DOM testing utilities | ^10.4.1 |
| MSW | API mocking | ^2.12.3 |
| jsdom | DOM environment | ^27.0.1 |

### Why These Tools?
- **Vitest**: Fast, Vite-native, great DX, ESM support
- **Testing Library**: Tests user behavior, not implementation details
- **MSW**: Mock APIs without changing code, works at network level
- **jsdom**: Lightweight DOM emulation for jsdom environment

### Commands
```bash
npm test              # Run tests in watch mode
npm test:ui           # Open interactive test dashboard
npm test:run          # Run once (for CI/CD)
npm test:run -- --coverage  # Run with coverage report (future)
```

---

## Test Structure & Organization

### Directory Structure
```
src/
├── __tests__/
│   ├── setup.ts                    # Test environment setup
│   ├── mocks/
│   │   ├── salesforceHandlers.ts   # MSW handlers for Salesforce
│   │   └── [featureName]Handlers.ts # Add handlers for each API
│   ├── utils/
│   │   └── [utilName].test.ts      # Utility function tests
│   ├── services/
│   │   └── [serviceName].test.ts   # Service tests
│   ├── pages/
│   │   └── [PageName].test.tsx     # Component tests (future)
│   └── integration/
│       └── [featureName].test.ts   # End-to-end flow tests (future)
├── utils/
│   └── [utilName].ts               # Utility files
├── services/
│   └── [serviceName].ts            # Service files
└── pages/
    └── [PageName].tsx              # Component files
```

### Test File Naming
- **Unit tests**: `[name].test.ts` (same directory or `__tests__/[type]/`)
- **Integration tests**: `[feature].integration.test.ts`
- **Component tests**: `[Component].test.tsx`

### Test File Structure
```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { server } from '../setup';  // MSW server
import { functionUnderTest } from '@/path/to/function';

describe('Feature Name', () => {
  // Group related tests
  describe('Specific Behavior', () => {
    beforeEach(() => {
      // Setup before each test
      vi.clearAllMocks();
    });

    it('should [expected behavior] when [condition]', () => {
      // Arrange
      const input = { /* test data */ };

      // Act
      const result = functionUnderTest(input);

      // Assert
      expect(result).toEqual({ /* expected */ });
    });

    it('should [another behavior] when [different condition]', () => {
      // Test another scenario
    });
  });

  describe('Error Handling', () => {
    // Group error tests separately
    it('should throw error when [bad condition]', () => {
      expect(() => functionUnderTest(badInput)).toThrow('Error message');
    });
  });
});
```

---

## Writing Unit Tests

### Pattern 1: Testing Pure Functions (Utilities)

**Example: Phone Validation** (`src/utils/validation.test.ts`)

```typescript
import { validatePhoneNumber } from '@/utils/validation';

describe('validatePhoneNumber', () => {
  describe('valid phone numbers', () => {
    it('should accept 10-digit phone number', () => {
      expect(validatePhoneNumber('1234567890')).toBe(true);
    });

    it('should accept phone number with dashes', () => {
      expect(validatePhoneNumber('123-456-7890')).toBe(true);
    });

    it('should accept various formats', () => {
      const validNumbers = [
        '2025551234',
        '(202) 555-1234',
        '+1 202-555-1234',
      ];

      validNumbers.forEach(number => {
        expect(validatePhoneNumber(number)).toBe(true);
      });
    });
  });

  describe('invalid phone numbers', () => {
    it('should reject empty string', () => {
      expect(validatePhoneNumber('')).toBe(false);
    });

    it('should reject numbers with too few digits', () => {
      expect(validatePhoneNumber('123456789')).toBe(false);
    });

    it('should reject non-string values', () => {
      expect(validatePhoneNumber(null as any)).toBe(false);
    });
  });
});
```

**Key Patterns**:
- ✅ Test both valid and invalid inputs
- ✅ Group by behavior (valid, invalid, edge cases)
- ✅ Test edge cases (null, undefined, empty, wrong type)
- ✅ One assertion per test (mostly)

### Pattern 2: Testing API Services (with Mocks)

**Example: Salesforce API Service** (`src/services/salesforceApi.test.ts`)

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { server } from '../setup';
import { createContact } from '@/services/salesforceApi';
import { salesforceErrorHandler } from '../mocks/salesforceHandlers';

describe('salesforceApi', () => {
  beforeEach(() => {
    server.resetHandlers();  // Reset mocks before each test
  });

  describe('createContact', () => {
    it('should create a contact with valid data', async () => {
      const contactData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      };

      const result = await createContact(contactData);

      expect(result.id).toBeDefined();
      expect(result.firstName).toBe('John');
      expect(result.lastName).toBe('Doe');
    });

    it('should throw error when API returns 500', async () => {
      server.use(salesforceErrorHandler);

      const contactData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
      };

      await expect(createContact(contactData))
        .rejects
        .toThrow('Salesforce API error');
    });

    it('should handle optional fields correctly', async () => {
      const contactData = {
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        phone: '555-1234',  // Optional
      };

      const result = await createContact(contactData);

      expect(result.phone).toBe('555-1234');
    });
  });
});
```

**Key Patterns**:
- ✅ Use MSW to mock API responses
- ✅ `server.resetHandlers()` before each test
- ✅ Test success and error paths
- ✅ Test with and without optional fields
- ✅ Use `rejects` for Promise error testing

### Pattern 3: Testing with Multiple Mocks

```typescript
import { vi } from 'vitest';
import { someFunction } from '@/services/myService';

describe('someFunction', () => {
  it('should call both APIs and combine results', async () => {
    // Arrange
    const mockFetch1 = vi.spyOn(api1, 'getData').mockResolvedValue({ data: 'A' });
    const mockFetch2 = vi.spyOn(api2, 'getData').mockResolvedValue({ data: 'B' });

    // Act
    const result = await someFunction();

    // Assert
    expect(mockFetch1).toHaveBeenCalled();
    expect(mockFetch2).toHaveBeenCalled();
    expect(result).toEqual({ data: 'AB' });

    // Cleanup
    mockFetch1.mockRestore();
    mockFetch2.mockRestore();
  });
});
```

---

## Writing Integration Tests

### Pattern: Full Feature Flow Testing

**When to Write Integration Tests**:
- Testing multiple services working together
- Testing user workflows (signup, login, payment)
- Testing with real APIs (against test/sandbox environment)
- Before moving to manual testing

**Example: CreateAccount + Salesforce Flow** (future)

```typescript
describe('CreateAccount with Salesforce Integration', () => {
  describe('Happy Path', () => {
    it('should create Clerk user AND Salesforce contact when both succeed', async () => {
      // 1. User fills form
      const formData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        password: 'Password123!',
      };

      // 2. Form submission triggers both APIs
      const clerkUser = await clerkSignUp(formData);
      const sfContact = await createContact(formData);

      // 3. Both should exist
      expect(clerkUser.id).toBeDefined();
      expect(sfContact.id).toBeDefined();

      // 4. User should be redirected
      expect(window.location.pathname).toBe('/my-account');
    });
  });

  describe('Rollback on Failure', () => {
    it('should delete Clerk user if Salesforce fails', async () => {
      server.use(salesforceErrorHandler);  // Make SF fail

      const formData = { /* ... */ };

      // Submit form
      await submitCreateAccountForm(formData);

      // Clerk user should be deleted
      const clerkUser = await getClerkUser(userId);
      expect(clerkUser).toBeNull();

      // Error shown to user
      expect(screen.getByText(/Failed to create your profile/i)).toBeInTheDocument();
    });
  });
});
```

---

## Mocking Strategies

### Strategy 1: Mock Service Worker (MSW) - For API Calls

**When to use**: Testing code that calls external APIs

```typescript
import { http, HttpResponse } from 'msw';
import { server } from '../setup';

// In src/__tests__/mocks/myHandlers.ts
export const myApiHandlers = [
  http.post('/api/my-endpoint', async ({ request }) => {
    const body = await request.json();

    if (!body.email) {
      return HttpResponse.json({ error: 'Missing email' }, { status: 400 });
    }

    return HttpResponse.json({ id: '123', email: body.email }, { status: 201 });
  }),
];

// In your test
import { myApiHandlers } from '../mocks/myHandlers';

describe('API calls', () => {
  it('should handle API error', async () => {
    server.use(
      http.post('/api/my-endpoint', () => {
        return HttpResponse.json({ error: 'Server error' }, { status: 500 });
      })
    );

    await expect(myFunction()).rejects.toThrow('Server error');
  });
});
```

### Strategy 2: vi.spyOn - For Module Functions

**When to use**: Testing code that calls other modules/functions

```typescript
import { vi } from 'vitest';
import { myFunction } from '@/services/myService';
import * as dependencyModule from '@/utils/dependency';

describe('myFunction', () => {
  it('should call dependency correctly', async () => {
    const spy = vi.spyOn(dependencyModule, 'helperFunction')
      .mockReturnValue('mocked result');

    const result = await myFunction();

    expect(spy).toHaveBeenCalledWith('expected arg');
    expect(result).toBe('expected');

    spy.mockRestore();
  });
});
```

### Strategy 3: Mock Modules - For Large Dependencies

**When to use**: Replacing entire modules (Clerk, third-party libraries)

```typescript
// At top of test file
vi.mock('@clerk/clerk-react', () => ({
  useAuth: () => ({
    isSignedIn: true,
    userId: 'test_user_123',
  }),
  useUser: () => ({
    user: { email: 'test@example.com' },
  }),
}));

describe('Component using Clerk', () => {
  it('should display user email', () => {
    // Component will use mocked Clerk hooks
    const { getByText } = render(<MyComponent />);
    expect(getByText('test@example.com')).toBeInTheDocument();
  });
});
```

---

## Test Coverage Goals

### Coverage Targets
| Type | Target | Minimum |
|------|--------|---------|
| Statements | 80% | 70% |
| Branches | 75% | 60% |
| Functions | 80% | 70% |
| Lines | 80% | 70% |

### Coverage Exceptions
- ✅ **OK to skip**: Error boundaries, logging statements, unused branches
- ❌ **Never skip**: Core business logic, API calls, error handling, validation

### Checking Coverage
```bash
npm test:run -- --coverage
```

---

## Common Patterns

### Pattern 1: Testing Error Messages

```typescript
it('should show specific error message', () => {
  const error = new Error('Custom error message');

  expect(error).toThrow('Custom error message');
  expect(error.message).toContain('Custom');
});
```

### Pattern 2: Testing Async Code

```typescript
describe('Async operations', () => {
  it('should resolve with data', async () => {
    const result = await fetchData();
    expect(result).toEqual({ /* expected */ });
  });

  it('should reject on error', async () => {
    await expect(fetchData()).rejects.toThrow('Error');
  });

  // Alternative: using waitFor
  it('should update state after async operation', async () => {
    render(<MyComponent />);
    const button = screen.getByRole('button');

    await userEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('Success')).toBeInTheDocument();
    });
  });
});
```

### Pattern 3: Testing Form Input

```typescript
import userEvent from '@testing-library/user-event';

it('should handle form input', async () => {
  const user = userEvent.setup();
  const { getByPlaceholderText } = render(<Form />);

  const input = getByPlaceholderText('Email');
  await user.type(input, 'test@example.com');

  expect(input).toHaveValue('test@example.com');
});
```

### Pattern 4: Testing State Changes

```typescript
it('should update state on user action', async () => {
  const user = userEvent.setup();
  render(<Counter />);

  const button = screen.getByRole('button', { name: 'Increment' });

  expect(screen.getByText('Count: 0')).toBeInTheDocument();

  await user.click(button);

  expect(screen.getByText('Count: 1')).toBeInTheDocument();
});
```

### Pattern 5: Testing Conditional Rendering

```typescript
it('should show loading state initially', () => {
  render(<MyComponent isLoading={true} />);
  expect(screen.getByText('Loading...')).toBeInTheDocument();
});

it('should show content when loaded', () => {
  render(<MyComponent isLoading={false} data="Content" />);
  expect(screen.getByText('Content')).toBeInTheDocument();
});
```

---

## Debugging Tests

### Useful Vitest Commands
```bash
# Run specific test file
npm test:run -- src/utils/validation.test.ts

# Run tests matching pattern
npm test:run -- --grep "phone"

# Run with verbose output
npm test:run -- --reporter=verbose

# Run in UI mode (interactive)
npm test:ui
```

### Debugging Tips

1. **Print debugging info**
```typescript
it('should do something', () => {
  const result = myFunction();
  console.log('Result:', result);  // Shows in test output
  expect(result).toBe('expected');
});
```

2. **Use screen.debug()**
```typescript
import { render, screen } from '@testing-library/react';

it('should render form', () => {
  render(<Form />);
  screen.debug();  // Prints entire DOM
});
```

3. **Inspect element**
```typescript
it('should have correct attributes', () => {
  const { container } = render(<Form />);
  const input = container.querySelector('input[type="email"]');
  console.log(input);  // Inspect the element
});
```

---

## CI/CD & Automation

### Pre-commit Hook (Future)
```bash
# .husky/pre-commit
npm test:run
```

### GitHub Actions (Future)
```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm test:run
      - run: npm test:run -- --coverage
```

### Manual Testing Checklist
Before merging code with new features:
- [ ] All unit tests pass (`npm test:run`)
- [ ] Coverage is maintained or improved
- [ ] Feature manually tested in dev environment
- [ ] Error scenarios tested
- [ ] Edge cases considered

---

## Examples from Real Code

### Example 1: Phone Validation Tests
**File**: `src/utils/validation.test.ts`

- 29 tests covering all scenarios
- Tests valid formats, invalid formats, edge cases
- Tests error messages and formatting
- **Reference this pattern** for future validation utilities

### Example 2: API Service Tests
**Files**:
- `src/services/salesforceApi.test.ts` (8 tests)
- `src/services/clerkApi.test.ts` (3 tests)

- Mock external APIs with MSW
- Test success and error paths
- Test with required and optional fields
- **Reference this pattern** for future services

---

## When to Add Tests

### ✅ Always Write Tests For
1. Utility functions (validation, formatting, calculations)
2. API services (integration with external APIs)
3. Complex business logic
4. Error handling paths
5. Edge cases and boundary conditions

### ⚠️ Consider Tests For
1. Simple components (render-only, no logic)
2. Wrappers around third-party libraries
3. Configuration files

### ❌ Skip Tests For
1. Styling-only components
2. Build configuration
3. Boilerplate code

---

## Improving Test Quality Over Time

### Code Review Checklist for Tests
- [ ] Test names are clear and descriptive
- [ ] Each test tests one thing
- [ ] Mocks are properly cleaned up
- [ ] No unnecessary setup code
- [ ] Tests are independent (can run in any order)
- [ ] Assertion messages are clear
- [ ] Tests run fast (< 100ms each)

### Refactoring Tests
- Extract common setup into `beforeEach()`
- Extract common assertions into helper functions
- Use data generators for complex test data
- Group related tests with `describe()`

---

## Questions & Additions

When you have questions about testing or discover new patterns:
1. **Ask**: Document the scenario and expected behavior
2. **Implement**: Write the test
3. **Update**: Add the pattern to this document
4. **Share**: Mention it in the PR

---

**Last Updated**: December 1, 2025
**Maintained by**: Development team
**Version**: 1.0

---

## Changelog

### v1.0 (Dec 1, 2025)
- Initial testing standards document
- Documented Vitest + Testing Library + MSW setup
- Added unit test patterns (utilities, API services)
- Added integration test patterns
- Added mocking strategies
- Added coverage goals and debugging tips
