# Troubleshooting Standards

## The Authority Bias Trap

**The Problem:**
When debugging issues, there's a tendency to blame external systems (Clerk, Salesforce, third-party libraries) because they're established, mature services. This feels safer than questioning the code we just wrote. This leads to:
- Speculative hypotheses instead of evidence-based debugging
- Wasted time investigating external systems that aren't the problem
- False test passes that hide actual runtime errors
- Delayed resolution of the real issue

**Example of Wrong Approach:**
```
Issue: Blank page render
Hypothesis 1: "Clerk authentication key must be wrong"
Hypothesis 2: "Salesforce API is failing"
Result: Both wrong. Real problem: missing clerkApi.ts file causing import error
```

## The Right Approach

When troubleshooting, follow this priority order:

### 1. **Look at the Actual Error**
- Open DevTools Console and read the error message verbatim
- Don't assume or guess what the error might be
- The error message is your primary data source
- Stack traces point directly to the problem location

**Example:**
```
Error: "Uncaught ReferenceError: process is not defined at salesforceApi.ts:30:22"
→ This tells you exactly where and what the problem is
```

### 2. **Read the Source Code at That Location**
- Use `Read` tool to examine the actual file mentioned in the error
- Don't theorize about what code might be there
- Verify the code matches your assumptions
- Look at 5+ lines of context around the error

**Example:**
```typescript
// salesforceApi.ts:30
const API_BASE_URL = process.env.VITE_API_URL || '...'; // ❌ process is undefined in browser
// Should be:
const API_BASE_URL = import.meta.env.VITE_API_URL || '...'; // ✅ Vite syntax for client
```

### 3. **Verify the Fix is in Your Code, Not External**
- The error location is almost always in code you can fix
- External systems typically fail with clear API errors (HTTP 401, 500, etc)
- Network requests show up in Network tab with status codes
- Authorization issues appear as specific error responses, not reference errors

**Red flags for external blame (usually wrong):**
- "The API must be down" → Check Network tab first
- "Authentication must be misconfigured" → Look for actual error message
- "The library must have changed" → Read the actual code using the library

### 4. **Fix the Code, Don't Speculate**
- Once you've identified the source, make the minimal fix
- Re-read the fixed code to confirm it's correct
- Run tests (they should catch most issues)
- Test in the browser to verify real-world behavior

## When to Escalate or Investigate External Systems

Only investigate external systems if:
1. You've confirmed the error is NOT in your code
2. DevTools shows a network request with an HTTP error (4xx, 5xx)
3. The API returns an explicit error message indicating the external system is the problem
4. You've read the actual code and it's correct

**Example of legitimate external issue:**
```
GET /api/salesforce/contacts → HTTP 401 Unauthorized
Error response: "Invalid OAuth token"
→ Now it makes sense to check Salesforce credentials
```

## Testing Pitfall: False Positives

**The Problem:**
Tests that mock external dependencies can pass while the real app fails.

**Signs of false positive tests:**
- Tests pass but app doesn't render in browser
- Tests mock away large portions of functionality
- Tests don't catch runtime errors that appear in DevTools
- Tests pass but DevTools shows actual JavaScript errors

**What to do instead:**
- Run the actual app after tests pass
- Check DevTools Console for errors
- If tests pass but app fails: the tests aren't testing the right thing
- Consider integration tests that use real or realistic mocking (MSW)

## Checklist for Troubleshooting

Use this checklist when stuck on an issue for more than 2 attempts:

- [ ] Did I read the actual DevTools Console error message verbatim?
- [ ] Did I open the file mentioned in the error and read the code?
- [ ] Did I check that my code is actually the source, not external?
- [ ] Did I verify the fix by reading the corrected code?
- [ ] Did I test in the browser (not just in tests)?
- [ ] Are my tests actually testing what I think they are?

## Summary

**Default to:**
1. Read the actual error
2. Read the actual code
3. Fix the actual code
4. Test in the actual app

**Don't default to:**
- Blaming external systems
- Creating tests that hide real problems
- Speculating without evidence
- Assuming you know what the error is before reading it
