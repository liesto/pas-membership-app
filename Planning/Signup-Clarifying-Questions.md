# Signup Page - Clarifying Questions

## Form Field Mapping Questions

### 1. Contact Field Mapping
The scope shows form fields without their Salesforce API names. Please confirm the exact Salesforce field API names:

- **First Name** → `FirstName`? yes
- **Last Name** → `LastName`? yes
- **Email** → `Email`? yes
- **Phone** → `Phone`? yes
- **Street Address** → `MailingStreet`? yes
- **City** → `MailingCity`? yes
- **State** → `MailingState`? yes
- **Zip Code** → `MailingPostalCode`? yes
- **Email Opt-in** → Email_Opt_In__c
Answer - see above
Let's add 1 more Salesforce field.  If the Email Opt-in form is checked then set PAS_Newsletter__c to True (boolean)

### 2. Form Validation Requirements

#### Required Fields
- Which fields are required vs optional?
Answer - First, Last, Email are required
- Should we use the same phone validation pattern from the create-account page? 
Answer - yes
- Should email validation follow the same pattern as create-account?
Answer - yes

#### Field Formats
- **Phone**: Use existing US phone validation (XXX-XXX-XXXX)?
Answer - yes
- **State**: Dropdown with all US states (like create-account) or free text?
Answer - Like Create-account
- **Zip Code**: Validation pattern (5 digits, or 5+4)?
Answer - 5
- **Email Opt-in**: Checkbox? Toggle? Default value?
Answer - The UI is a styled checkbox.  Let's default it to True

### 3. Membership Selection UI

#### Payment Frequency Field
- **UI Component**: Radio buttons? Dropdown? Toggle between "Monthly" and "Annual"?
Answer - Don't change the current UI.  It looks the way I want it.  You're talking about the Payment Frequency section of the form. 

- **Labels**: "Month" or "Monthly"? "Year" or "Annual"?
Answer - Don't change the current UI.  Monthly in the UI maps to Month in Salesforce.  Annual in the UI maps to Year in Salesforce. 

- **Default Selection**: Should one be pre-selected?
Answer - Annual

#### Membership Level Field
- **UI Component**: Radio buttons? Dropdown? Card selection with pricing?
Answer - Don't change the current UI.
- **Display Format**: Show pricing alongside level names?
Answer - Don't change the current UI.
- **Default Selection**: Should one be pre-selected?
Answer - Silver

### 4. Pricing Display

The scope includes these prices:
- Bronze/Year = $50, Bronze/Month = $5
- Silver/Year = $100, Silver/Month = $10
- Gold/Year = $250, Gold/Month = $25

**Questions:**
- Should pricing be displayed on the form?
Answer - Don't change the current UI.
- If yes, where? (next to membership level, in a summary section, both?)
- Should there be a "Total" or "Amount Due" display that updates based on selections?
- Any specific formatting? (e.g., "$50/year", "$5/month")
Answer - Don't change the current UI.

### 5. Form Submission & User Experience

#### Loading States
- Loading spinner during Salesforce contact creation?
Answer - Yes
- Loading spinner during Salesforce opportunity creation?
Answer - Yes
- Should we show progress (e.g., "Creating contact...", "Creating membership...")?
Answer - Yes

#### Success State
- What should happen after successful signup?
Answer - Redirect to the confirmation page
- Redirect to a success page? Show a success message on the same page?
Answer - Redirect to the confirmation page
- Should we display the membership details to the user?
Answer - That's a later project
- Should we mention that payment will be collected separately?
Answer - No.  We'll work on that after we finish this. 

#### Error Handling
- If Contact creation succeeds but Opportunity creation fails, what should happen?
Answer - For now, just post an error message & stop the process
- Should we attempt to delete the orphaned Contact?
Answer - No
- Should we show detailed error messages or generic ones?
Answer - Detailed
- Should errors be logged to a service (e.g., Sentry) or just console?
Answer - Just console for now

### 6. Code Structure & Patterns

#### Salesforce API Service
- Should we create a dedicated `salesforceService.ts` similar to existing patterns?
Answer - I don't know.  Whatever's best practice
- Should Contact and Opportunity creation be separate functions or combined?
Answer - I don't know.  Whatever's best practice
- Should we reuse any utilities from create-account page?
Answer - I don't know.  Whatever's best practice

#### Form State Management
- Use React Hook Form (like create-account)?
Answer - Yes
- Use simple useState?
Answer - I don't know.  Whatever's best practice
- Any specific validation library preferences?
Answer - Stay consistent with what's already been built

### 7. Testing Requirements

#### Unit Tests
- Test Contact creation with valid data?
- Test Opportunity creation with valid data?
- Test all price calculation scenarios (6 combinations)?
- Test error handling for failed Salesforce calls?
- Test form validation for all fields?
- Test date calculations (membership end date)?
Answer - I don't know.  Whatever's best practice

#### Test Coverage
- What's the minimum acceptable code coverage? (80%+?)
Answer - I don't know.  Whatever's best practice
- Should we test the full integration flow or mock Salesforce responses?
Answer - I don't know.  Whatever's best practice

### 8. Logging Requirements

You mentioned "verbose console logging" - please clarify:
- Log level for development vs production?
Answer - We're only concerned with development now
- What should we log? (form submissions, API calls, responses, errors, all of the above?)
Answer - Whatever we need to be able to effectively troubleshoot. 
- Should we include timestamps, user context, request IDs?
Answer - I don't know.  Whatever's best practice
- Any specific format preferences for logs?
Answer - I don't know.  Whatever's best practice

### 9. Page Routing & Access

- What route should this page be at? (e.g., `/signup`, `/join`, `/new-member`)
Answer - /signup
- Should this page be public or require authentication?
Answer - Public
- Should there be a link to this page from the home page or nav?
Answer - Not yet

### 10. Date Calculation Clarifications

For `npe01__Membership_End_Date__c`:
- "Today's date + 1 month" - Should this be exactly 30 days, or same day next month (e.g., Jan 15 → Feb 15)?
Answer - Same day next month
- "Today's date + 1 year" - Same day next year (e.g., Jan 15, 2024 → Jan 15, 2025)?
Answer - Same day next year
- What timezone should be used for "Today's Date"? User's local time or UTC or specific timezone?
Answer - EST

### 11. Opportunity Name Format

Scope shows: `Name: Conactenate (FirstName," ",LastName" - ",Member Level," "Date)`

- Should this be: "John Doe - Gold 12/4/2025"?
Answer - yes
- Date format preference? (MM/DD/YYYY, YYYY-MM-DD, other?)
- Should Member Level be "Gold" or "Gold Membership"?

### 12. Field Values - Exact Strings

Please confirm the exact string values for Salesforce:

**Membership_Term__c:**
- "Month" or "Monthly"?
- "Year" or "Annual" or "Yearly"?
Answer - Month & Year

**npe01__Member_Level__c:**
- "Bronze", "Silver", "Gold" (exact case)?
Answer - Yes

**StageName:**
- "Closed Won" (exact string with space)?
Answer - Yes

**Type:**
- "PAS Membership" (exact string)?
Answer - Yes

**npe01__Membership_Origin__c:**
- "New" (exact string)?
Answer - Yes

### 13. Hardcoded Values Verification

Please confirm these hardcoded IDs are correct for the sandbox:

- **RecordTypeId**: `0124x000001aYWcAAM`
- **CampaignId**: `701U700000XmsUbIAJ`
Answer - Yes
Should these be configurable via environment variables for flexibility?
Answer - Yes
---

## Instructions
Please answer these questions and I'll create a comprehensive requirements document for development.
