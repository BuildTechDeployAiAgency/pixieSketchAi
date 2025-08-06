# Complete PixieSketch Credit System Testing Suite

## 🎯 Testing Overview
This comprehensive test suite validates all credit system fixes after resetting all user credits to 0.

## 📋 Pre-Test Setup Checklist
- [ ] Reset all user credits to 0 via Supabase SQL Editor
- [ ] Confirm dev server running on localhost:8081
- [ ] Ensure using Stripe test keys (not live)
- [ ] Clear browser cache/localStorage if needed

## 🧪 Test Suite Execution

### PHASE 1: Authentication & UI Display
**Objective**: Verify basic functionality and credit display

#### Test 1.1: User Authentication
- [ ] Navigate to localhost:8081
- [ ] Sign in with test account
- [ ] Verify email appears in header
- [ ] **Expected**: User successfully authenticated

#### Test 1.2: Zero Credits Display
- [ ] Check header credit display
- [ ] **Expected**: Shows "0 Credits" 
- [ ] **Pass Criteria**: Credit count matches database (should be 0)

#### Test 1.3: Buy Credits Button
- [ ] Locate "Buy Credits" button in header
- [ ] Click to open payment modal
- [ ] **Expected**: Modal opens with 3 pricing options

#### Test 1.4: Pricing Options Verification
- [ ] Verify $1.00 = "1 credit" option exists
- [ ] Verify $4.99 = "10 credits" option exists  
- [ ] Verify $9.99 = "25 credits" option exists
- [ ] **Expected**: All 3 packages display correct credit amounts

### PHASE 2: Credit Purchase Testing
**Objective**: Test credit purchase flow and verify correct amounts

#### Test 2.1: $1.00 Single Magic Purchase
- [ ] Click $1.00 option in payment modal
- [ ] Complete Stripe checkout (use test card: 4242 4242 4242 4242)
- [ ] Return to application
- [ ] Check credit balance in header
- [ ] **Expected**: Balance shows exactly 1 credit
- [ ] **Pass Criteria**: Database shows 1 credit, UI shows 1 credit

#### Test 2.2: $4.99 Magic Pack Purchase  
- [ ] Click $4.99 option
- [ ] Complete Stripe checkout
- [ ] Check credit balance
- [ ] **Expected**: Previous credits + 10 = total credits
- [ ] **Pass Criteria**: Correct addition (should be 11 total)

#### Test 2.3: $9.99 Super Magic Purchase
- [ ] Click $9.99 option  
- [ ] Complete Stripe checkout
- [ ] Check credit balance
- [ ] **Expected**: Previous credits + 25 = total credits
- [ ] **Pass Criteria**: Correct addition (should be 36 total)

#### Test 2.4: Payment History Verification
- [ ] Navigate to Payment History page
- [ ] Verify all 3 transactions are recorded
- [ ] Check transaction details match purchases
- [ ] **Expected**: All purchases logged with correct amounts

### PHASE 3: Credit Deduction & Processing
**Objective**: Test image processing and credit usage

#### Test 3.1: Image Upload with Sufficient Credits
- [ ] Go to Upload tab
- [ ] Upload a test image (JPG/PNG)
- [ ] Select "Cartoon" preset
- [ ] Click transform button
- [ ] Wait for processing to complete
- [ ] **Expected**: Image transforms successfully
- [ ] **Expected**: Credits reduced by 1 ONLY after success
- [ ] **Pass Criteria**: Final credit count = previous - 1

#### Test 3.2: Real-time Credit Update
- [ ] Monitor credit display during processing
- [ ] **Expected**: Credits don't change until processing completes
- [ ] **Expected**: Credit balance updates immediately after success
- [ ] **Pass Criteria**: No premature deduction

#### Test 3.3: Multiple Transformations
- [ ] Upload another image
- [ ] Select "Pixar" preset and transform
- [ ] Upload third image  
- [ ] Select "Realistic" preset and transform
- [ ] **Expected**: Each successful transformation deducts exactly 1 credit
- [ ] **Pass Criteria**: Credits decrease correctly with each success

### PHASE 4: Error Handling & Edge Cases
**Objective**: Test insufficient credits and error scenarios

#### Test 4.1: Spend Down to Zero Credits
- [ ] Continue processing images until credits = 0
- [ ] **Expected**: Credit balance reaches 0
- [ ] **Pass Criteria**: Header shows "0 Credits"

#### Test 4.2: Insufficient Credits Handling
- [ ] Try to upload and transform with 0 credits
- [ ] **Expected**: Clear error message about insufficient credits
- [ ] **Expected**: No processing occurs
- [ ] **Pass Criteria**: User prevented from processing without credits

#### Test 4.3: Purchase More Credits When Depleted
- [ ] Click "Buy Credits" with 0 balance
- [ ] Purchase $1.00 package
- [ ] **Expected**: Credits restored to 1
- [ ] **Expected**: Can process images again

### PHASE 5: Advanced Testing
**Objective**: Test system reliability and edge cases

#### Test 5.1: Concurrent Operations Test
- [ ] Open application in 2 browser tabs
- [ ] Perform credit purchase in tab 1
- [ ] Check if tab 2 updates automatically
- [ ] **Expected**: Real-time sync works across tabs

#### Test 5.2: Browser Refresh Test
- [ ] Note current credit balance
- [ ] Refresh browser page
- [ ] **Expected**: Credit balance persists correctly

#### Test 5.3: Payment Webhook Idempotency
- [ ] Make a purchase
- [ ] Check payment_history table for duplicate entries
- [ ] **Expected**: Only one record per payment session
- [ ] **Pass Criteria**: No double-crediting

## 📊 Test Results Recording

### Test Result Template
```
Test: [Test Name]
Date: [Date/Time]
Result: [PASS/FAIL]
Expected: [What should happen]
Actual: [What actually happened]
Notes: [Any additional observations]
```

### Critical Success Criteria
- [ ] All credit purchases add exact correct amounts
- [ ] Credits only deducted AFTER successful processing
- [ ] Real-time credit balance updates work
- [ ] No double-crediting occurs
- [ ] Insufficient credit errors handled gracefully
- [ ] Payment history accurately recorded

## 🚨 Known Issues to Watch For
1. **Double Crediting**: Check payment_history for duplicates
2. **Premature Deduction**: Credits should NOT decrease before processing success
3. **Stale UI**: Credit display should update in real-time
4. **Race Conditions**: Multiple concurrent operations should work safely

## 📈 Success Metrics
- **100% Accurate Credit Math**: All purchases/deductions match expectations
- **Zero Double-Credits**: No duplicate payment processing
- **Real-time Updates**: Credit balance changes immediately visible
- **Error Handling**: Clear messages for insufficient credits
- **Data Integrity**: Payment history matches actual transactions

## 🎉 Post-Test Validation
After completing all tests:
1. Check Supabase database directly for data consistency
2. Verify payment_history table has all transactions
3. Confirm no orphaned or duplicate records
4. Test with multiple user accounts if available

---

**Ready to test?** 
1. First reset credits in Supabase dashboard
2. Then run through this test suite systematically
3. Document any issues found
4. Report results for further fixes if needed