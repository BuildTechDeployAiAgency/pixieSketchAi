# Credit System Testing Plan - PixieSketch

## Critical Issues Identified

### 1. **Race Condition in Credit Deduction** (process-sketch/index.ts:281-297)
- **Issue**: Credit is deducted BEFORE processing starts, not after success
- **Risk**: If processing fails, user loses credit but gets no result
- **Current**: Line 281 deducts credit immediately
- **Fix**: Move credit deduction to AFTER successful processing

### 2. **Missing Real-time Credit Sync**
- **Issue**: Frontend credit display may be stale after operations
- **Risk**: Users don't see updated balances immediately
- **Fix**: Add real-time credit updates via Supabase realtime subscriptions

### 3. **Credit Refund Logic Issues** (process-sketch/index.ts:496-499)
- **Issue**: Uses non-existent RPC function 'increment'
- **Should use**: Existing `increment_credits` function from rls-policies.sql:67

### 4. **Double Credit Addition Risk** (webhook + manual verification)
- **Issue**: Payment verification could add credits twice
- **Risk**: Users get more credits than they paid for

## Test Plan Execution

### Phase 1: Basic Credit Flow Testing ✅ In Progress
- [x] Test credit display accuracy on page load
- [ ] Test credit purchase flow for all packages ($1=1, $4.99=10, $9.99=25)
- [ ] Verify frontend/backend credit sync

### Phase 2: Credit Deduction Testing
- [ ] Test credit deduction timing (should be AFTER success)
- [ ] Test insufficient credits error handling
- [ ] Test credit refund on processing failure

### Phase 3: Advanced Testing
- [ ] Test concurrent operations (race conditions)
- [ ] Test payment webhook security
- [ ] Test real-time credit updates

## Expected Test Results

| Test | Expected Result |
|------|----------------|
| Credit Display | Shows exact current balance from database |
| $1.00 Purchase | Adds exactly 1 credit |
| $4.99 Purchase | Adds exactly 10 credits |
| $9.99 Purchase | Adds exactly 25 credits |
| Processing Success | Deducts 1 credit AFTER success |
| Processing Failure | Refunds 1 credit if deducted |
| Insufficient Credits | Clear error message, no processing |

## Fix Implementation Priority

1. **HIGH**: Fix credit deduction timing (move to post-success)
2. **HIGH**: Fix credit refund RPC call
3. **HIGH**: Add idempotency to prevent double-crediting
4. **MEDIUM**: Add real-time credit sync
5. **LOW**: Performance optimizations