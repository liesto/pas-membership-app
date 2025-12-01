# CreateAccount + Salesforce Integration Plan

**Date**: 2025-11-30
**Objective**: Extend CreateAccount page to create Salesforce Contact records while maintaining existing Clerk functionality
**Scope**: Add Salesforce contact creation with proper error handling, validation, and testing

## Overview

Currently, the CreateAccount page only integrates with Clerk.dev for user authentication. The next phase extends this to:
1. Create Salesforce Contact records when account creation succeeds
2. Implement rollback (delete Clerk user) if Salesforce fails
3. Maintain all existing Clerk functionality
4. Add comprehensive unit & integration tests

## Architecture Decisions

### Decision 1: Partial Failure Handling
**Chosen: Option B (Delete Clerk user on Salesforce failure)**
- If Clerk signup succeeds but Salesforce contact creation fails:
  - Show error message to user with retry prompt
  - Delete the created Clerk user
  - Allow user to retry the entire process
- This ensures data consistency: every Clerk user has a corresponding Salesforce Contact

### Decision 2: Data Validation
- **Phone**: Validate format (must be valid US phone number)
- **City**: No validation
- **State**: Dropdown selection only (no free text)
- All three fields are optional at signup

### Decision 3: Testing Strategy
- **Mock API tests**: For unit tests (Vitest + MSW)
- **Real Salesforce tests**: Integration tests against test Salesforce org (pas-membership-sb)
- No production data will be created during tests

## Technical Implementation Plan

### Phase 1: Testing Infrastructure Setup

**Install Dependencies**:
```bash
npm install -D vitest @testing-library/react @testing-library/user-event msw @vitest/ui
npm install -D @testing-library/dom
```

**Create Test Configuration Files**:
- `vitest.config.ts` - Vitest configuration
- `src/__tests__/setup.ts` - Test setup and MSW server
- `src/__tests__/mocks/salesforceHandlers.ts` - Salesforce API mocks

**Update package.json scripts**:
```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:run": "vitest run"
  }
}
```

### Phase 2: Salesforce API Service Layer

**Create `src/services/salesforceApi.ts`**:
- `createContact(data: CreateContactRequest): Promise<CreateContactResponse>`
- Handle authentication (will use backend endpoint once Phase 1 backend is ready)
- Error handling and retry logic

**Create `src/services/clerkApi.ts`**:
- `deleteUser(userId: string): Promise<void>`
- Used for rollback on Salesforce failure

### Phase 3: Validation Utilities

**Create `src/utils/validation.ts`**:
- `validatePhoneNumber(phone: string): boolean`
- Return error message if invalid

**Create `src/utils/validation.test.ts`**:
- Test valid phone numbers
- Test invalid phone numbers
- Test edge cases (empty string, special characters, etc.)

### Phase 4: Component Extension

**Update `src/pages/CreateAccount.tsx`**:
1. Add phone validation on blur
2. After Clerk signup succeeds:
   - Call `createContact(formData)` to Salesforce
   - Show loading state: "Creating your profile..."
   - On success: navigate to `/my-account`
   - On failure:
     - Show error message
     - Call `deleteUser(clerkUserId)` to rollback
     - Clear error message on retry
3. Disable form inputs during entire process (Clerk + Salesforce)

### Phase 5: Error Handling & User Experience

**Error Scenarios**:
1. Clerk signup fails → Show Clerk error, don't call Salesforce
2. Salesforce contact creation fails → Show SF error, delete Clerk user, prompt retry
3. Clerk user deletion fails → Show critical error message, direct to support

**User Messages**:
- "Creating your account..." (while Clerk processing)
- "Creating your profile..." (while Salesforce processing)
- "Account created successfully!" (on success)
- "Failed to create profile. Please try again." (on Salesforce failure)
- "An unexpected error occurred. Please contact support." (on critical failure)

### Phase 6: Testing

**Unit Tests** (`src/__tests__/`):
1. `utils/validation.test.ts` - Phone number validation
2. `services/salesforceApi.test.ts` - Salesforce API calls (mocked)
3. `pages/CreateAccount.test.tsx` - Component behavior

**Integration Tests** (`src/__tests__/integration/`):
1. `CreateAccountFlow.test.ts` - Full Clerk + Salesforce flow
   - Tests against real test Salesforce org (pas-membership-sb)
   - Uses real Clerk test account (if available)
   - Verifies both Clerk user and Salesforce contact created

**Regression Tests**:
1. Existing Clerk signup flow still works (with optional Salesforce fields)
2. Password validation still works
3. Form disabling during submission still works
4. Navigation to `/my-account` still works

## File Structure

```
src/
├── pages/
│   └── CreateAccount.tsx (modified)
├── services/
│   ├── salesforceApi.ts (new)
│   └── clerkApi.ts (new)
├── utils/
│   ├── validation.ts (new)
│   └── validation.test.ts (new)
└── __tests__/
    ├── setup.ts (new)
    ├── mocks/
    │   └── salesforceHandlers.ts (new)
    ├── pages/
    │   └── CreateAccount.test.tsx (new)
    ├── services/
    │   ├── salesforceApi.test.ts (new)
    │   └── clerkApi.test.ts (new)
    └── integration/
        └── CreateAccountFlow.test.ts (new)
```

## Success Criteria

- [ ] All existing Clerk signup tests pass (regression)
- [ ] Phone number validation utility has 100% test coverage
- [ ] Salesforce API service has 100% test coverage (with mocks)
- [ ] Component tests verify new Salesforce call is made after Clerk success
- [ ] Integration tests pass against test Salesforce org
- [ ] Manual smoke test: Create full account, verify Clerk user and Salesforce contact exist
- [ ] Error scenarios tested: Salesforce failure → Clerk user deleted → user can retry
- [ ] No console errors or warnings during signup process
- [ ] Form maintains UX (disabling, loading states, error messages)

## Risk Mitigation

**Risk**: Clerk user created but Salesforce contact not created
**Mitigation**: Implement rollback (delete Clerk user) and show clear retry prompt

**Risk**: Phone validation is too strict/loose
**Mitigation**: Test extensively with various US phone formats, document rules clearly

**Risk**: Test Salesforce org has restrictions on Contact creation
**Mitigation**: Verify Integration User has Contact CRUD permissions before starting

**Risk**: Tests create orphaned data in Salesforce
**Mitigation**: Use test isolation, clean up test data, or use mock API for most tests

## Timeline & Phases

1. **Testing Infrastructure** - 1 session
   - Install dependencies
   - Create test setup and config
   - Create mock API handlers

2. **Validation & Services** - 1 session
   - Phone validation utility
   - Salesforce API service
   - Clerk delete user service
   - Unit tests for all

3. **Component Extension** - 1 session
   - Update CreateAccount with Salesforce call
   - Add error handling and rollback
   - Add loading states

4. **Integration Tests & Manual Testing** - 1 session
   - Write integration tests
   - Run against test Salesforce org
   - Manual smoke test
   - Verify all scenarios

## Notes for Next Session

1. Ensure Integration User has appropriate Salesforce permissions
2. Test Salesforce org credentials should be available in `.env.local`
3. Consider whether email should be used as the unique identifier in Salesforce (or if SF will auto-generate ID)
4. Decide: Should we sync user's Clerk ID to Salesforce Contact as a custom field?

---

## Implementation Checklist

- [ ] Install testing dependencies
- [ ] Create vitest.config.ts
- [ ] Create test setup file with MSW server
- [ ] Create Salesforce API mock handlers
- [ ] Write phone validation utility
- [ ] Write phone validation tests
- [ ] Create Salesforce API service
- [ ] Write Salesforce API service tests (with mocks)
- [ ] Create Clerk API service (for user deletion)
- [ ] Write Clerk API service tests
- [ ] Update CreateAccount component with Salesforce call
- [ ] Add error handling and rollback logic
- [ ] Write CreateAccount component tests
- [ ] Write integration tests against test Salesforce org
- [ ] Verify all tests pass
- [ ] Manual smoke test
- [ ] Commit and push to GitHub
