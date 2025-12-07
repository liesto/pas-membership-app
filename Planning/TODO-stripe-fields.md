# TODO: Fix Stripe Processing Fees and Net Amount Fields

## Issue
The `Stripe_Processing_Fees__c` and `Stripe_Net_Amount__c` fields on Opportunity records in Salesforce are not being populated. All existing opportunities show `null` for both fields.

## Current Status
- **Date Identified**: 2025-12-06
- **Status**: UNRESOLVED - Investigation in progress
- **Commit**: cbad7f3 - Added enhanced logging for debugging

## Investigation Summary

### Code Analysis (Completed)
The data flow path is correctly implemented:
1. ✅ **Frontend** (src/pages/Signup.tsx:227-228): Extracts `stripeNetAmount` and `stripeProcessingFees` from `balanceTransaction`
2. ✅ **Frontend** (src/pages/Signup.tsx:257-258): Passes values to `createMembership()`
3. ✅ **Backend API** (backend/src/routes/salesforce.ts:227-228): Receives values in request body
4. ✅ **Backend API** (backend/src/routes/salesforce.ts:321-322): Passes to `createMembershipOpportunity()`
5. ✅ **Salesforce Service** (backend/src/services/salesforce.ts:419-425): Sets fields on Opportunity if values are defined
6. ✅ **Stripe Service** (backend/src/services/stripe.ts:85): Expands `latest_charge.balance_transaction` when retrieving payment intent

### Root Cause Hypothesis
The `balance_transaction` object is likely `null` or `undefined` when the payment intent is retrieved, causing:
- `balanceTransaction?.net` → `undefined`
- `balanceTransaction?.fee` → `undefined`
- Values not sent to backend → Fields remain null in Salesforce

### Evidence
Query of recent Opportunities:
```sql
SELECT Id, Name, Amount, Stripe_Payment_ID__c, Stripe_Net_Amount__c, Stripe_Processing_Fees__c
FROM Opportunity
ORDER BY CreatedDate DESC LIMIT 5
```

Results show:
- ✅ `Stripe_Payment_ID__c` is populated (e.g., `pi_3SbVOeRJqJzsvxBZ0l30PTzu`)
- ✅ `Stripe_Payment_Method_ID__c` is populated
- ❌ `Stripe_Net_Amount__c` is `null`
- ❌ `Stripe_Processing_Fees__c` is `null`

This confirms the payment intent IS being retrieved successfully, but the balance_transaction data is missing.

## Next Steps

### 1. Complete Test Signup (Requires Backend Running)
- Start backend server (`cd backend && npm run dev`)
- Complete a test signup in browser
- Review enhanced logging output to see actual Stripe response:
  - Full payment intent JSON
  - Type of `latest_charge` (string ID vs expanded object)
  - Type of `balance_transaction` (string ID vs expanded object)
  - Values of `net` and `fee` fields

### 2. Investigate Stripe API Behavior
Possible causes to investigate:
- **Timing Issue**: Balance transactions might not be available immediately after payment
- **Test Mode**: Stripe test mode may not generate real balance_transaction objects
- **Expand Parameter**: The expand parameter may not be working as expected
- **API Version**: Different Stripe API versions may return different data structures

### 3. Potential Solutions

#### Option A: Add Delay and Retry
If balance_transaction isn't immediately available:
```typescript
// After payment succeeds, wait briefly then retrieve payment intent
await new Promise(resolve => setTimeout(resolve, 1000));
const fullPaymentIntent = await getPaymentIntent(paymentIntent.id);
```

#### Option B: Fallback Calculation
For test mode or when balance_transaction unavailable:
```typescript
// Calculate approximate fees using Stripe's standard US rates
// 2.9% + $0.30 per transaction
// NOTE: This should ONLY be a fallback, not primary method
```

#### Option C: Use Webhooks
Listen for `charge.succeeded` webhook which includes complete balance_transaction:
```typescript
// In webhook handler
const charge = event.data.object;
const balanceTransaction = charge.balance_transaction; // Fully expanded
```

#### Option D: Query Balance Transaction Directly
Retrieve balance transaction separately if expand doesn't work:
```typescript
const charge = paymentIntent.latest_charge;
const balanceTransaction = await stripe.balanceTransactions.retrieve(charge.balance_transaction);
```

## Files Modified
- `src/pages/Signup.tsx` - Added enhanced logging
- All backend files unchanged (no code changes needed yet)

## Related Documentation
- Stripe API: Payment Intents - https://stripe.com/docs/api/payment_intents
- Stripe API: Balance Transactions - https://stripe.com/docs/api/balance_transactions
- Stripe API: Expanding Objects - https://stripe.com/docs/api/expanding_objects

## Testing Checklist
- [ ] Start backend server
- [ ] Complete test signup with test card (4242 4242 4242 4242)
- [ ] Review browser console logs for payment intent data
- [ ] Review backend logs for balance_transaction extraction
- [ ] Query created Opportunity to verify fields are still null
- [ ] Analyze Stripe response to determine why balance_transaction is missing
- [ ] Implement fix based on findings
- [ ] Test fix with another signup
- [ ] Verify Opportunity has populated Stripe fields
