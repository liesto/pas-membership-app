# Signup Page - Technical Requirements Document

## Overview
Implement Salesforce integration for the existing Signup page (`/src/pages/Signup.tsx`) to create Contact and Opportunity records when a user completes the membership signup form.

**Key Constraints:**
- DO NOT modify the existing UI/UX (keep all form fields, styling, and layout intact)
- Integrate with Salesforce backend following existing patterns from `create-account` page
- Add comprehensive unit tests with 80%+ coverage
- Implement verbose console logging for debugging

---

## 1. Salesforce Integration Architecture

### 1.1 Backend API Extensions

**File:** `/backend/src/services/salesforce.ts`

Add the following functions following the existing pattern:

#### `createMembershipContact()`
```typescript
export interface CreateMembershipContactRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  mailingStreet?: string;
  mailingCity?: string;
  mailingState?: string;
  mailingPostalCode?: string;
  emailOptIn: boolean;
}

export interface MembershipContact extends Contact {
  AccountId?: string;  // Needed for Opportunity creation
}

/**
 * Create a Contact in Salesforce for membership signup
 * Maps additional fields beyond basic contact creation
 */
export async function createMembershipContact(
  data: CreateMembershipContactRequest
): Promise<MembershipContact>
```

**Salesforce Field Mapping:**
- `FirstName` ← firstName
- `LastName` ← lastName
- `Email` ← email
- `Phone` ← phone (optional)
- `MailingStreet` ← mailingStreet (optional)
- `MailingCity` ← mailingCity (optional)
- `MailingState` ← mailingState (optional)
- `MailingPostalCode` ← mailingPostalCode (optional)
- `Email_Opt_In__c` ← emailOptIn
- `PAS_Newsletter__c` ← emailOptIn (boolean: true if checked, false if not)

**Logging Requirements:**
```typescript
console.log('[Salesforce] Creating membership contact:', {
  email: data.email,
  firstName: data.firstName,
  lastName: data.lastName,
  hasPhone: !!data.phone,
  hasAddress: !!(data.mailingStreet || data.mailingCity),
  emailOptIn: data.emailOptIn,
  timestamp: new Date().toISOString()
});

// On success:
console.log('[Salesforce] Contact created successfully:', {
  contactId: result.id,
  accountId: result.AccountId,
  email: data.email,
  timestamp: new Date().toISOString()
});

// On error:
console.error('[Salesforce] Failed to create contact:', {
  email: data.email,
  error: error.message,
  errorDetails: error,
  timestamp: new Date().toISOString()
});
```

#### `createMembershipOpportunity()`
```typescript
export interface CreateMembershipOpportunityRequest {
  firstName: string;
  lastName: string;
  membershipLevel: 'Bronze' | 'Silver' | 'Gold';
  membershipTerm: 'Month' | 'Year';
  contactId: string;
  accountId: string;
}

export interface MembershipOpportunity {
  Id: string;
  Name: string;
  Amount: number;
  StageName: string;
  CloseDate: string;
  MembershipStartDate: string;
  MembershipEndDate: string;
}

/**
 * Create a Membership Opportunity in Salesforce
 * Calculates all required fields based on membership selection
 */
export async function createMembershipOpportunity(
  data: CreateMembershipOpportunityRequest
): Promise<MembershipOpportunity>
```

**Business Logic:**

1. **Amount Calculation:**
```typescript
const PRICING = {
  'Bronze-Year': 50,
  'Bronze-Month': 5,
  'Silver-Year': 100,
  'Silver-Month': 10,
  'Gold-Year': 250,
  'Gold-Month': 25,
};

const amount = PRICING[`${data.membershipLevel}-${data.membershipTerm}`];
```

2. **Date Calculations (EST Timezone):**
```typescript
import { toZonedTime, format } from 'date-fns-tz';

const EST_TIMEZONE = 'America/New_York';
const today = toZonedTime(new Date(), EST_TIMEZONE);
const todayFormatted = format(today, 'yyyy-MM-dd', { timeZone: EST_TIMEZONE });

// Membership End Date calculation
let endDate: Date;
if (data.membershipTerm === 'Month') {
  endDate = addMonths(today, 1); // Same day next month (e.g., Jan 15 → Feb 15)
} else {
  endDate = addYears(today, 1); // Same day next year (e.g., Jan 15, 2024 → Jan 15, 2025)
}
const endDateFormatted = format(endDate, 'yyyy-MM-dd', { timeZone: EST_TIMEZONE });
```

3. **Opportunity Name Format:**
```typescript
const currentDate = format(today, 'MM/dd/yyyy', { timeZone: EST_TIMEZONE });
const opportunityName = `${data.firstName} ${data.lastName} - ${data.membershipLevel} ${currentDate}`;
// Example: "John Doe - Gold 12/04/2025"
```

**Salesforce Field Mapping:**
- `Name` ← `${firstName} ${lastName} - ${membershipLevel} ${MM/DD/YYYY}`
- `RecordTypeId` ← Environment variable `SF_MEMBERSHIP_RECORD_TYPE_ID` (default: `0124x000001aYWcAAM`)
- `npsp__Primary_Contact__c` ← contactId
- `AccountId` ← accountId (from Contact)
- `CloseDate` ← Today's date (EST, format: YYYY-MM-DD)
- `StageName` ← `"Closed Won"` (exact string)
- `CampaignId` ← Environment variable `SF_CAMPAIGN_ID` (default: `701U700000XmsUbIAJ`)
- `Type` ← `"PAS Membership"` (exact string)
- `npe01__Membership_Start_Date__c` ← Today's date (EST)
- `npe01__Membership_End_Date__c` ← Calculated end date (EST)
- `npe01__Membership_Origin__c` ← `"New"` (exact string)
- `Membership_Term__c` ← `"Month"` or `"Year"` (exact strings)
- `npe01__Member_Level__c` ← `"Bronze"`, `"Silver"`, or `"Gold"` (exact case)
- `Amount` ← Calculated amount

**Logging Requirements:**
```typescript
console.log('[Salesforce] Creating membership opportunity:', {
  opportunityName,
  membershipLevel: data.membershipLevel,
  membershipTerm: data.membershipTerm,
  amount,
  contactId: data.contactId,
  accountId: data.accountId,
  closeDate: todayFormatted,
  startDate: todayFormatted,
  endDate: endDateFormatted,
  timestamp: new Date().toISOString()
});

// On success:
console.log('[Salesforce] Opportunity created successfully:', {
  opportunityId: result.id,
  opportunityName,
  amount,
  timestamp: new Date().toISOString()
});

// On error:
console.error('[Salesforce] Failed to create opportunity:', {
  opportunityName,
  error: error.message,
  errorDetails: error,
  timestamp: new Date().toISOString()
});
```

### 1.2 Backend Route Extension

**File:** `/backend/src/routes/salesforce.ts`

Add new endpoint:

```typescript
/**
 * POST /api/salesforce/membership
 * Create both Contact and Opportunity for membership signup
 */
router.post('/membership', async (req, res) => {
  // Implementation details
});
```

**Request Body:**
```typescript
{
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  mailingStreet?: string;
  mailingCity?: string;
  mailingState?: string;
  mailingPostalCode?: string;
  emailOptIn: boolean;
  membershipLevel: 'bronze' | 'silver' | 'gold';  // Lowercase from UI
  membershipTerm: 'monthly' | 'annual';  // Lowercase from UI
}
```

**Response (Success - 201):**
```typescript
{
  success: true;
  contact: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    accountId: string;
  };
  opportunity: {
    id: string;
    name: string;
    amount: number;
    membershipStartDate: string;
    membershipEndDate: string;
  };
}
```

**Response (Error - 400/500):**
```typescript
{
  error: string;
  details?: any;
  stage?: 'contact' | 'opportunity';  // Which stage failed
}
```

**Error Handling:**
- If Contact creation fails: Return 500 error with stage: 'contact'
- If Opportunity creation fails: Return 500 error with stage: 'opportunity', DO NOT delete orphaned Contact
- Include detailed error messages in response

**Logging:**
```typescript
console.log('[API] Membership signup request received:', {
  email: req.body.email,
  membershipLevel: req.body.membershipLevel,
  membershipTerm: req.body.membershipTerm,
  timestamp: new Date().toISOString()
});

// Log each stage
console.log('[API] Contact creation stage starting...');
console.log('[API] Contact created, starting opportunity creation...');
console.log('[API] Membership signup completed successfully');

// Or on error
console.error('[API] Membership signup failed at stage:', stage, error);
```

### 1.3 Frontend API Service

**File:** `/src/services/salesforceApi.ts`

Add new function following existing pattern:

```typescript
export interface CreateMembershipRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  mailingStreet?: string;
  mailingCity?: string;
  mailingState?: string;
  mailingPostalCode?: string;
  emailOptIn: boolean;
  membershipLevel: 'bronze' | 'silver' | 'gold';
  membershipTerm: 'monthly' | 'annual';
}

export interface CreateMembershipResponse {
  success: true;
  contact: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    accountId: string;
  };
  opportunity: {
    id: string;
    name: string;
    amount: number;
    membershipStartDate: string;
    membershipEndDate: string;
  };
}

/**
 * Create a membership signup (Contact + Opportunity)
 * @param membershipData - Complete membership signup data
 * @param token - Optional Clerk authentication token
 * @returns Promise with contact and opportunity data
 * @throws Error if creation fails at any stage
 */
export async function createMembership(
  membershipData: CreateMembershipRequest,
  token?: string
): Promise<CreateMembershipResponse>
```

**Implementation Details:**
- Follow existing `createContact()` pattern
- POST to `${SALESFORCE_API}/membership`
- Include authorization header if token provided
- Parse error responses and throw with stage information
- Add console logging

**Logging:**
```typescript
console.log('[SalesforceAPI] Creating membership:', {
  email: membershipData.email,
  level: membershipData.membershipLevel,
  term: membershipData.membershipTerm,
  timestamp: new Date().toISOString()
});

// On success
console.log('[SalesforceAPI] Membership created successfully:', {
  contactId: response.contact.id,
  opportunityId: response.opportunity.id,
  timestamp: new Date().toISOString()
});

// On error
console.error('[SalesforceAPI] Membership creation failed:', {
  error: error.message,
  stage: errorData.stage,
  timestamp: new Date().toISOString()
});
```

---

## 2. Frontend Form Integration

### 2.1 Form Schema Updates

**File:** `/src/pages/Signup.tsx`

**Current State:**
- Form schema already exists with all required fields
- Validation already implemented
- UI already matches requirements

**Required Changes:**

1. **Update `emailOptIn` default value:**
```typescript
defaultValues: {
  // ... existing defaults
  emailOptIn: true,  // Changed from false to true
}
```

2. **Update schema validation:**
```typescript
const signupSchema = z.object({
  // ... existing fields
  phone: z.string().optional(),  // Make phone optional (not required)
  address: z.string().optional(),  // Make address optional
  city: z.string().optional(),  // Make city optional
  state: z.string().optional(),  // Make state optional
  zipCode: z.string().optional(),  // Make zip optional

  // Remove payment fields (not using payment yet)
  // cardNumber, cardName, expiryDate, cvv - REMOVE from schema
});
```

3. **Add phone formatting utility (reuse from create-account if available):**
```typescript
import { formatPhoneNumber } from '@/utils/validation';

// In phone field onChange:
field.onChange(formatPhoneNumber(field.value))
```

### 2.2 Form Submission Handler

**Replace existing `onSubmit` function:**

```typescript
const [isSubmitting, setIsSubmitting] = useState(false);
const [submissionStage, setSubmissionStage] = useState<string>('');
const navigate = useNavigate();

const onSubmit = async (data: SignupFormValues) => {
  setIsSubmitting(true);
  setSubmissionStage('Preparing signup...');

  try {
    // Log form submission
    console.log('[Signup] Form submitted:', {
      email: data.email,
      membershipLevel: data.membershipLevel,
      paymentFrequency: data.paymentFrequency,
      timestamp: new Date().toISOString()
    });

    // Update stage
    setSubmissionStage('Creating contact...');
    console.log('[Signup] Stage: Creating contact');

    // Prepare membership data
    const membershipData: CreateMembershipRequest = {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone || undefined,
      mailingStreet: data.address || undefined,
      mailingCity: data.city || undefined,
      mailingState: data.state || undefined,
      mailingPostalCode: data.zipCode || undefined,
      emailOptIn: data.emailOptIn,
      membershipLevel: data.membershipLevel,  // 'bronze', 'silver', or 'gold'
      membershipTerm: data.paymentFrequency === 'annual' ? 'annual' : 'monthly',
    };

    // Call Salesforce API
    const result = await createMembership(membershipData);

    console.log('[Signup] Contact created:', result.contact.id);
    setSubmissionStage('Creating membership...');
    console.log('[Signup] Stage: Creating membership opportunity');

    // Log success
    console.log('[Signup] Membership created successfully:', {
      contactId: result.contact.id,
      opportunityId: result.opportunity.id,
      amount: result.opportunity.amount,
      timestamp: new Date().toISOString()
    });

    // Show success toast
    toast.success('Membership Created!', {
      description: `Welcome to Pisgah Area SORBA, ${data.firstName}!`,
    });

    // Redirect to confirmation page
    console.log('[Signup] Redirecting to confirmation page');
    navigate('/confirmation');

  } catch (error) {
    console.error('[Signup] Submission failed:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stage: submissionStage,
      timestamp: new Date().toISOString()
    });

    // Show detailed error message
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    toast.error('Signup Failed', {
      description: errorMessage,
      duration: 10000,  // Show error for 10 seconds
    });
  } finally {
    setIsSubmitting(false);
    setSubmissionStage('');
  }
};
```

### 2.3 Loading State UI

**Update Submit Button:**
```tsx
<Button
  type="submit"
  variant="hero"
  size="lg"
  className="w-full md:w-auto min-w-[200px]"
  disabled={isSubmitting}
>
  {isSubmitting ? (
    <>
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      {submissionStage}
    </>
  ) : (
    'Join Now'
  )}
</Button>
```

### 2.4 Remove Payment Fields from UI

Since we're not processing payments yet, remove the entire "Payment Information" section:

```tsx
{/* Payment Information */}
{/* REMOVE THIS ENTIRE SECTION - Lines 377-440 */}
```

---

## 3. Environment Variables

### 3.1 Backend Environment Variables

**File:** `/backend/.env`

Add the following variables:

```bash
# Salesforce Membership Configuration
SF_MEMBERSHIP_RECORD_TYPE_ID=0124x000001aYWcAAM
SF_CAMPAIGN_ID=701U700000XmsUbIAJ
```

### 3.2 Documentation

Document these variables in the README or environment setup documentation:

- `SF_MEMBERSHIP_RECORD_TYPE_ID`: Salesforce Record Type ID for membership opportunities (default: `0124x000001aYWcAAM`)
- `SF_CAMPAIGN_ID`: Salesforce Campaign ID for membership signups (default: `701U700000XmsUbIAJ`)

---

## 4. Testing Requirements

### 4.1 Backend Service Tests

**File:** `/backend/src/__tests__/services/salesforce-membership.test.ts`

**Test Coverage:**

1. **Contact Creation Tests:**
   - ✅ Create contact with all required fields
   - ✅ Create contact with optional fields (phone, address)
   - ✅ Create contact with email opt-in true
   - ✅ Create contact with email opt-in false (PAS_Newsletter__c = false)
   - ✅ Handle contact creation failure
   - ✅ Verify all field mappings are correct

2. **Opportunity Creation Tests:**
   - ✅ Create opportunity with Bronze/Month ($5)
   - ✅ Create opportunity with Bronze/Year ($50)
   - ✅ Create opportunity with Silver/Month ($10)
   - ✅ Create opportunity with Silver/Year ($100)
   - ✅ Create opportunity with Gold/Month ($25)
   - ✅ Create opportunity with Gold/Year ($250)
   - ✅ Verify opportunity name format
   - ✅ Verify membership end date calculation (Month = +1 month)
   - ✅ Verify membership end date calculation (Year = +1 year)
   - ✅ Verify all hardcoded field values (StageName, Type, Origin)
   - ✅ Verify RecordTypeId from environment variable
   - ✅ Verify CampaignId from environment variable
   - ✅ Handle opportunity creation failure

3. **Date Calculation Tests:**
   - ✅ Test EST timezone handling
   - ✅ Test same-day-next-month calculation (Jan 15 → Feb 15)
   - ✅ Test same-day-next-year calculation (Jan 15, 2024 → Jan 15, 2025)
   - ✅ Test edge cases (Feb 29 leap year, month-end dates)

### 4.2 Backend Route Tests

**File:** `/backend/src/__tests__/routes/salesforce-membership.test.ts`

**Test Coverage:**

1. **Successful Flow:**
   - ✅ POST /api/salesforce/membership with valid data returns 201
   - ✅ Response includes contact and opportunity data
   - ✅ Verify both Contact and Opportunity are created in Salesforce

2. **Error Handling:**
   - ✅ Contact creation fails → returns 500 with stage: 'contact'
   - ✅ Opportunity creation fails → returns 500 with stage: 'opportunity'
   - ✅ Invalid request data → returns 400
   - ✅ Missing required fields → returns 400

3. **Field Transformations:**
   - ✅ UI values (bronze/silver/gold) → Salesforce values (Bronze/Silver/Gold)
   - ✅ UI values (monthly/annual) → Salesforce values (Month/Year)

### 4.3 Frontend Service Tests

**File:** `/src/__tests__/services/salesforce-membership.test.ts`

**Test Coverage:**

1. **createMembership() Function:**
   - ✅ Successful request returns contact and opportunity data
   - ✅ Request includes authorization header when token provided
   - ✅ Request includes all form data correctly
   - ✅ HTTP 400 error throws with error message
   - ✅ HTTP 500 error throws with error message and stage
   - ✅ Network error throws appropriate error

2. **Mock Service Worker Handlers:**
   - Create MSW handlers for `/api/salesforce/membership` endpoint
   - Mock successful response
   - Mock contact creation failure
   - Mock opportunity creation failure

### 4.4 Frontend Component Tests

**File:** `/src/__tests__/components/Signup.test.tsx`

**Test Coverage:**

1. **Form Rendering:**
   - ✅ All form fields render correctly
   - ✅ Email opt-in checkbox defaults to checked (true)
   - ✅ Payment frequency defaults to "Annual"
   - ✅ Membership level defaults to "Silver"

2. **Form Validation:**
   - ✅ First name required
   - ✅ Last name required
   - ✅ Email required and valid format
   - ✅ Phone optional but validated if provided
   - ✅ Address fields optional

3. **Form Submission:**
   - ✅ Submit button disabled while submitting
   - ✅ Loading state shows "Creating contact..." then "Creating membership..."
   - ✅ Successful submission redirects to /confirmation
   - ✅ Failed submission shows error toast with detailed message
   - ✅ Contact creation failure shows error, no orphaned contact cleanup attempted
   - ✅ Opportunity creation failure shows error

4. **User Interactions:**
   - ✅ Changing membership level updates displayed price
   - ✅ Changing payment frequency updates displayed price
   - ✅ Email opt-in checkbox can be toggled
   - ✅ State dropdown shows all US states

### 4.5 Test Coverage Target

**Minimum Coverage: 80%**

Focus areas:
- All business logic (pricing, date calculations, field mapping)
- All error handling paths
- All API integration points

**Coverage Report:**
```bash
npm test:run -- --coverage
```

---

## 5. Utilities & Dependencies

### 5.1 Date Utilities

**Install dependency:**
```bash
npm install date-fns date-fns-tz
```

**Create utility file:** `/backend/src/utils/dateHelpers.ts`

```typescript
import { toZonedTime, format } from 'date-fns-tz';
import { addMonths, addYears } from 'date-fns';

const EST_TIMEZONE = 'America/New_York';

export function getCurrentDateEST(): Date {
  return toZonedTime(new Date(), EST_TIMEZONE);
}

export function formatDateForSalesforce(date: Date): string {
  return format(date, 'yyyy-MM-dd', { timeZone: EST_TIMEZONE });
}

export function formatDateDisplay(date: Date): string {
  return format(date, 'MM/dd/yyyy', { timeZone: EST_TIMEZONE });
}

export function calculateMembershipEndDate(
  startDate: Date,
  term: 'Month' | 'Year'
): Date {
  if (term === 'Month') {
    return addMonths(startDate, 1);
  } else {
    return addYears(startDate, 1);
  }
}
```

### 5.2 Pricing Utility

**Create utility file:** `/backend/src/utils/pricing.ts`

```typescript
export type MembershipLevel = 'Bronze' | 'Silver' | 'Gold';
export type MembershipTerm = 'Month' | 'Year';

const PRICING_TABLE: Record<string, number> = {
  'Bronze-Year': 50,
  'Bronze-Month': 5,
  'Silver-Year': 100,
  'Silver-Month': 10,
  'Gold-Year': 250,
  'Gold-Month': 25,
};

export function calculateMembershipPrice(
  level: MembershipLevel,
  term: MembershipTerm
): number {
  const key = `${level}-${term}`;
  const price = PRICING_TABLE[key];

  if (!price) {
    throw new Error(`Invalid membership combination: ${level} / ${term}`);
  }

  return price;
}
```

---

## 6. Logging Standards

### 6.1 Log Format

All logs should follow this format:

```typescript
console.log('[Component] Action:', {
  key: value,
  timestamp: new Date().toISOString()
});
```

**Components:**
- `[Signup]` - Frontend Signup page
- `[SalesforceAPI]` - Frontend API service
- `[API]` - Backend API routes
- `[Salesforce]` - Backend Salesforce service

### 6.2 What to Log

**Frontend:**
- Form submission attempts
- API calls (start and completion)
- Navigation actions
- Errors with full context

**Backend:**
- Incoming API requests
- Salesforce API calls (before and after)
- Field transformations
- Success/failure outcomes
- Errors with full stack traces

### 6.3 Sensitive Data

**DO NOT LOG:**
- Credit card numbers (not applicable yet, but future-proofing)
- Full phone numbers (log `hasPhone: true` instead)
- Full addresses (log `hasAddress: true` instead)

**Safe to log:**
- Email addresses (for debugging)
- Names
- Membership levels and terms
- Salesforce IDs
- Timestamps

---

## 7. Error Handling Strategy

### 7.1 Contact Creation Failure

**Backend Response:**
```json
{
  "error": "Failed to create Salesforce contact: [detailed error]",
  "stage": "contact",
  "details": { ... }
}
```

**Frontend Handling:**
- Show detailed error message in toast
- Do NOT attempt any cleanup
- Log full error context
- Keep form data so user can retry

### 7.2 Opportunity Creation Failure

**Backend Response:**
```json
{
  "error": "Failed to create membership opportunity: [detailed error]",
  "stage": "opportunity",
  "details": { ... },
  "contactId": "003XXXXXX"  // Include created contact ID for manual cleanup
}
```

**Frontend Handling:**
- Show detailed error message in toast
- Do NOT delete orphaned Contact
- Log full error context including contactId
- Inform user to contact support with error details

### 7.3 Network Errors

**Frontend Handling:**
- Catch network errors separately
- Show user-friendly message: "Unable to connect to server. Please check your internet connection."
- Log technical details to console
- Allow retry

---

## 8. Implementation Checklist

### Phase 1: Backend (Salesforce Service)
- [ ] Install `date-fns` and `date-fns-tz` dependencies
- [ ] Create `/backend/src/utils/dateHelpers.ts`
- [ ] Create `/backend/src/utils/pricing.ts`
- [ ] Add `createMembershipContact()` to `/backend/src/services/salesforce.ts`
- [ ] Add `createMembershipOpportunity()` to `/backend/src/services/salesforce.ts`
- [ ] Write unit tests for date utilities
- [ ] Write unit tests for pricing utility
- [ ] Write unit tests for `createMembershipContact()`
- [ ] Write unit tests for `createMembershipOpportunity()`
- [ ] Verify 80%+ coverage for backend services

### Phase 2: Backend (API Route)
- [ ] Add environment variables to `/backend/.env`
- [ ] Add `/membership` endpoint to `/backend/src/routes/salesforce.ts`
- [ ] Implement contact creation stage with logging
- [ ] Implement opportunity creation stage with logging
- [ ] Implement error handling for both stages
- [ ] Write integration tests for `/membership` endpoint
- [ ] Test success flow
- [ ] Test contact creation failure
- [ ] Test opportunity creation failure
- [ ] Verify 80%+ coverage for routes

### Phase 3: Frontend (API Service)
- [ ] Add `CreateMembershipRequest` interface to `/src/services/salesforceApi.ts`
- [ ] Add `CreateMembershipResponse` interface
- [ ] Implement `createMembership()` function
- [ ] Add console logging
- [ ] Create MSW handlers in `/src/__tests__/mocks/salesforceHandlers.ts`
- [ ] Write unit tests for `createMembership()`
- [ ] Verify 80%+ coverage for API service

### Phase 4: Frontend (Form Integration)
- [ ] Update form schema (remove payment fields, make fields optional)
- [ ] Change `emailOptIn` default to `true`
- [ ] Remove payment information section from UI
- [ ] Add `isSubmitting` and `submissionStage` state
- [ ] Implement new `onSubmit` handler
- [ ] Add loading state to submit button
- [ ] Add console logging
- [ ] Import and use `createMembership()` from service
- [ ] Test form submission manually in dev environment

### Phase 5: Frontend (Component Tests)
- [ ] Write form rendering tests
- [ ] Write form validation tests
- [ ] Write form submission tests (success)
- [ ] Write form submission tests (failures)
- [ ] Write user interaction tests
- [ ] Verify 80%+ coverage for Signup component

### Phase 6: Integration Testing
- [ ] Run full test suite: `npm test:run`
- [ ] Verify all tests pass
- [ ] Check coverage report (80%+ target)
- [ ] Test in dev environment with real Salesforce sandbox
- [ ] Verify Contact creation in Salesforce
- [ ] Verify Opportunity creation in Salesforce
- [ ] Verify all field mappings are correct
- [ ] Test error scenarios (invalid data, network failures)

### Phase 7: Documentation
- [ ] Update README with new environment variables
- [ ] Document the `/membership` API endpoint
- [ ] Add inline code comments for complex logic
- [ ] Update CLAUDE.md if needed

---

## 9. Acceptance Criteria

### Functional Requirements
✅ User can submit signup form with all required fields
✅ User can submit signup form with optional fields blank
✅ Email opt-in checkbox defaults to checked
✅ Form validates required fields (First, Last, Email)
✅ Form validates optional phone number if provided
✅ Contact is created in Salesforce with correct field mappings
✅ Opportunity is created in Salesforce with correct field mappings
✅ Pricing is calculated correctly for all 6 combinations
✅ Membership end date is calculated correctly (EST timezone)
✅ Opportunity name follows format: "FirstName LastName - Level MM/DD/YYYY"
✅ Loading states show progress ("Creating contact...", "Creating membership...")
✅ Success redirects to `/confirmation` page
✅ Errors show detailed messages to user

### Technical Requirements
✅ UI/UX unchanged from current implementation
✅ Code follows existing patterns from `create-account` page
✅ All business logic has unit tests
✅ Test coverage ≥ 80%
✅ All tests pass (`npm test:run`)
✅ Verbose console logging implemented
✅ Environment variables used for Salesforce IDs
✅ Error handling for both Contact and Opportunity stages
✅ No orphaned Contact cleanup (as per requirements)

### Code Quality
✅ TypeScript types defined for all interfaces
✅ Zod validation schemas updated
✅ ESLint passes with no errors
✅ No console errors in browser
✅ Code is documented with JSDoc comments
✅ Follows existing code style and conventions

---

## 10. Future Enhancements (Out of Scope)

The following items are explicitly out of scope for this implementation:

- ❌ Payment processing integration (Stripe)
- ❌ Clerk authentication for signup
- ❌ Email confirmation/verification
- ❌ Duplicate contact detection
- ❌ Orphaned contact cleanup on opportunity failure
- ❌ Membership confirmation email
- ❌ Analytics/tracking integration
- ❌ A/B testing for conversion optimization

---

## 11. Dependencies

### New Dependencies
```json
{
  "date-fns": "^3.0.0",
  "date-fns-tz": "^3.0.0"
}
```

### Existing Dependencies (Verify)
- `react-hook-form` - Form state management
- `zod` - Schema validation
- `@hookform/resolvers` - Zod + React Hook Form integration
- `sonner` - Toast notifications
- `react-router-dom` - Navigation

---

## 12. Salesforce Field Reference

### Contact Fields
| Form Field | Salesforce API Name | Type | Required |
|------------|---------------------|------|----------|
| First Name | `FirstName` | String | Yes |
| Last Name | `LastName` | String | Yes |
| Email | `Email` | Email | Yes |
| Phone | `Phone` | Phone | No |
| Street Address | `MailingStreet` | String | No |
| City | `MailingCity` | String | No |
| State | `MailingState` | String | No |
| Zip Code | `MailingPostalCode` | String | No |
| Email Opt-in | `Email_Opt_In__c` | Boolean | Yes |
| Email Opt-in | `PAS_Newsletter__c` | Boolean | Yes |

### Opportunity Fields
| Field | Salesforce API Name | Source | Type |
|-------|---------------------|--------|------|
| Name | `Name` | Calculated | String |
| Record Type | `RecordTypeId` | Environment | ID (18) |
| Primary Contact | `npsp__Primary_Contact__c` | Contact.Id | ID (18) |
| Account | `AccountId` | Contact.AccountId | ID (18) |
| Close Date | `CloseDate` | Today (EST) | Date |
| Stage | `StageName` | "Closed Won" | String |
| Campaign | `CampaignId` | Environment | ID (18) |
| Type | `Type` | "PAS Membership" | String |
| Start Date | `npe01__Membership_Start_Date__c` | Today (EST) | Date |
| End Date | `npe01__Membership_End_Date__c` | Calculated | Date |
| Origin | `npe01__Membership_Origin__c` | "New" | String |
| Term | `Membership_Term__c` | "Month" or "Year" | String |
| Level | `npe01__Member_Level__c` | "Bronze", "Silver", "Gold" | String |
| Amount | `Amount` | Calculated | Currency |

---

## 13. API Contract

### Endpoint: POST /api/salesforce/membership

**Request:**
```typescript
{
  firstName: string;          // Required
  lastName: string;           // Required
  email: string;              // Required, valid email
  phone?: string;             // Optional, validated if provided
  mailingStreet?: string;     // Optional
  mailingCity?: string;       // Optional
  mailingState?: string;      // Optional
  mailingPostalCode?: string; // Optional
  emailOptIn: boolean;        // Required
  membershipLevel: 'bronze' | 'silver' | 'gold';     // Required
  membershipTerm: 'monthly' | 'annual';              // Required
}
```

**Success Response (201):**
```typescript
{
  success: true;
  contact: {
    id: string;              // Salesforce Contact ID
    firstName: string;
    lastName: string;
    email: string;
    accountId: string;       // Salesforce Account ID
  };
  opportunity: {
    id: string;              // Salesforce Opportunity ID
    name: string;            // "FirstName LastName - Level MM/DD/YYYY"
    amount: number;          // Calculated price
    membershipStartDate: string;  // YYYY-MM-DD
    membershipEndDate: string;    // YYYY-MM-DD
  };
}
```

**Error Response (400/500):**
```typescript
{
  error: string;            // Human-readable error message
  details?: any;            // Additional error context
  stage?: 'contact' | 'opportunity';  // Where the failure occurred
  contactId?: string;       // Contact ID if opportunity creation failed
}
```

---

## End of Requirements Document

This document provides complete technical specifications for implementing Salesforce integration on the Signup page. All requirements are based on the clarifying questions answered by the user and follow existing patterns in the codebase.
