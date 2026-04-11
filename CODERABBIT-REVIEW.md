# PixieSketchMobile — CodeRabbit Review Report

**Date:** 2026-04-11
**Scope:** Committed changes (2dc1c49..HEAD)
**Goal:** iOS App Store readiness
**Total findings:** 99

## Severity Breakdown

| Severity | Count |
|----------|-------|
| CRITICAL | 15 |
| MAJOR | 40 |
| MINOR | 44 |

## CRITICAL Findings

### 1. package.json

In @package.json around lines 12 - 14, The package.json is missing devDependencies required by your test scripts (vitest and related packages); add devDependencies for "vitest", "@vitest/ui", and a coverage provider like "@vitest/coverage-v8", and optionally "jsdom" for React Native DOM simulation so the scripts that call vitest --ui and --coverage succeed; update package.json's devDependencies section accordingly and run npm/yarn install to ensure the test scripts (scripts referencing vitest) can execute.

### 2. supabase/functions/send-email/index.ts

In @supabase/functions/send-email/index.ts at line 2, The code references an undefined corsHeaders variable causing a runtime ReferenceError; fix by either calling the exported function getCorsHeaders() once and assign its result to a corsHeaders constant used throughout the handler (e.g., const corsHeaders = getCorsHeaders();), or change the import to bring in the actual exported constant name if the shared module exports corsHeaders directly; update usages in the request handler and retain handleCorsRequest import as-is.

### 3. src/components/PaymentModal.tsx

In @src/components/PaymentModal.tsx around lines 38 - 40, The snippet in PaymentModal.tsx contains the body of handleBuyCredits but is missing its declaration; add a proper async arrow function declaration like const handleBuyCredits = async (amount: number, price: number) => { before the existing body and ensure it closes with a matching }; update any callers to use handleBuyCredits and keep the existing internal logic and references (e.g., payment state, APIs) unchanged so the function is properly scoped within the component.

### 4. src/components/PaymentModal.tsx

In @src/components/PaymentModal.tsx around lines 17 - 18, Remove the orphaned type lines and fix the broken PaymentModalProps definition by declaring a proper interface (including isAuthenticated: boolean) and using it in the PaymentModal component; then choose one platform (web or React Native) and make the imports and JSX consistent — either import Dialog, DialogContent, Button and update the component to use those web components, or import View, Text, Pressable, StyleSheet and rewrite the JSX to use RN primitives; ensure the PaymentModal component signature references the corrected PaymentModalProps and remove any stray braces or semicolons left outside type declarations.

### 5. supabase/functions/analyze-drawing/index.ts

In @supabase/functions/analyze-drawing/index.ts at line 4, The handler in analyze-drawing/index.ts uses an undefined corsHeaders variable causing runtime ReferenceErrors; fix it by defining corsHeaders inside the request handler using the imported getCorsHeaders function (e.g., call getCorsHeaders(req) once at the start of the handler and store the result in a const named corsHeaders) and keep all existing spread usages (...corsHeaders) as-is, or alternatively replace each ...corsHeaders usage with ...getCorsHeaders(req) consistently; ensure the change is applied where corsHeaders is referenced so every response uses the defined headers.

### 6. supabase/functions/process-sketch/credit-service.ts

In @supabase/functions/process-sketch/credit-service.ts around lines 119 - 130, The optimistic update in the function (the update call on the "profiles" table in credit-service.ts) uses .eq("credits", currentCredits) but never verifies a row was actually updated, so concurrent changes can cause zero-row updates while returning success; modify the update to request returned rows (e.g., use .select() / .select("*") or .select().single() on the same update call or inspect the returned data/count) and only return { success: true } when the update returned a non-empty row (or affected row count > 0), otherwise return { success: false, error: /* concurrency error */ } so the function (the block handling deductError and the update result) reliably detects and fails on no-op updates.

### 7. src/test/__tests__/sketch-status.property.test.ts

In @src/test/__tests__/sketch-status.property.test.ts around lines 85 - 108, The test's logic is flawed: the computed variable startsWithProcessing is never asserted and the property uses a random status generator that can produce invalid sequences (e.g., ["completed","processing"]) yet the test asserts "completed" must be last. Fix by either (A) updating the generator used in this test to produce only valid histories that follow your state machine rules (so "completed" can only appear at the end) or (B) keep the random generator but change the test to exercise the real history-building/validation function and assert its output/enforcement rather than assuming the generator produces valid histories; also either remove the unused startsWithProcessing variable or add an explicit assertion about it in the test to reflect intended behavior (reference startsWithProcessing and the status generator used in this test).

### 8. supabase/functions/create-payment/index.ts

In @supabase/functions/create-payment/index.ts at line 4, The file imports getCorsHeaders and handleCorsRequest but uses an undefined corsHeaders variable (referenced in places like the handlers around the request flow), causing a ReferenceError; fix by replacing every use of corsHeaders with a call to getCorsHeaders(req) (so handlers use getCorsHeaders(req) when building responses) or alternatively import corsHeaders from the shared module if a static header object is intended—ensure consistency by updating the code paths that currently reference corsHeaders to use the chosen approach (getCorsHeaders(req) or an imported corsHeaders) and keep handleCorsRequest usage unchanged.

**Suggestions:**
- import { corsHeaders, handleCorsRequest } from "../_shared/cors.ts";

### 9. supabase/functions/analyze-drawing/index.ts

In @supabase/functions/analyze-drawing/index.ts around lines 44 - 50, The code uses supabaseUrl and supabaseServiceKey when calling createClient but those env vars are never initialized, causing a ReferenceError; before calling serve() (or before the createClient invocation) initialize these from process.env (e.g., const supabaseUrl = process.env.SUPABASE_URL and const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY), validate they exist and throw or return a clear error if missing, then pass them into createClient so the supabase client is constructed safely.

### 10. supabase/functions/admin-operations/index.ts

In @supabase/functions/admin-operations/index.ts at line 3, The file imports getCorsHeaders but never calls it, so the corsHeaders variable used in the request handler is undefined; fix this by invoking getCorsHeaders at the top of the exported request handler (before any early returns) and assign its result to a const named corsHeaders (await if getCorsHeaders is async), then use that corsHeaders when building Response objects (the same variable referenced around lines where corsHeaders is currently used); ensure this happens before calling handleCorsRequest or returning any Response.

### 11. src/hooks/useAdminAuth.ts

In @src/hooks/useAdminAuth.ts at line 5, Replace the hardcoded SUPER_USER_EMAIL constant in useAdminAuth.ts with a value read from the environment (e.g., VITE_SUPER_USER_EMAIL) so the super user email is not stored in source; update the code that references SUPER_USER_EMAIL (search for the symbol SUPER_USER_EMAIL and any checks in functions in useAdminAuth) to read from import.meta.env.VITE_SUPER_USER_EMAIL (or process.env in non-Vite setups), add a sensible fallback or explicit runtime error if the env var is missing, and add the VITE_SUPER_USER_EMAIL entry to the .env file used for local/dev environments.

**Suggestions:**
- const SUPER_USER_EMAIL = import.meta.env.VITE_SUPER_USER_EMAIL;

### 12. src/hooks/sketch/useSketchOperations.ts

In @src/hooks/sketch/useSketchOperations.ts around lines 165 - 168, The code wrongly expects setSketches to return the deleted sketch (sketchToDelete) — instead, capture the sketch before or inside the state updater: declare a sketchToDelete variable outside, then use the functional setSketches updater to locate the sketch (e.g., prev => { const found = prev.find(s => s.id === id); sketchToDelete = found; return prev.filter(s => s.id !== id); }) or simply find it from the current sketches state before calling setSketches; update any subsequent logic to use that captured sketchToDelete rather than the (undefined) return value of setSketches.

### 13. supabase/functions/process-sketch/index.original.ts

In @supabase/functions/process-sketch/index.original.ts around lines 134 - 137, The responses use an undefined variable corsHeaders causing runtime ReferenceError; fix by obtaining the headers from the exported helper instead of referencing corsHeaders directly — either import a corsHeaders constant if available or call getCorsHeaders(request) at the top of the request handler and replace all direct corsHeaders usages (e.g., in Response headers for the 401/other responses) with the returned value; ensure handleCorsRequest remains used for preflight and that every occurrence (including the lines flagged) uses the defined variable returned from getCorsHeaders or the properly imported constant.

### 14. supabase/functions/process-sketch/index.original.ts

In @supabase/functions/process-sketch/index.original.ts around lines 834 - 856, The fallbackImageGeneration function currently references req.headers.get("Authorization") and calls supabase.auth.getUser() but req is not passed in and the supabase client is the service-role client, causing a ReferenceError and incorrect auth behavior; fix by changing fallbackImageGeneration to accept the user's auth context (either pass the IncomingRequest/headers or the resolved user object/id) and use that to fetch the profile (e.g., query profiles by user.id or use the auth header with a user-scoped supabase client), then update all call sites that invoke fallbackImageGeneration to pass the new parameter (the req or user), and remove the unsupported supabase.auth.getUser() call from the service-role client path.

### 15. Architecture_Tracker.md

In @Architecture_Tracker.md around lines 216 - 217, The system currently only deducts credits on successful processing, causing financial loss when OpenAI API calls incur costs but processing fails; update the request flow in the main handler (e.g., processRequest / handleUserRequest) to pre-deduct or reserve credits before calling OpenAI by invoking a new chargeCreditsPreemptive(userId, estimatedAmount, requestId) that marks a reserved charge, then call callOpenAI/performApiWork; on success call finalizeProcessing(requestId) which converts the reservation into a settled deduction, and on any failure call refundCredits(requestId) and recordApiCost(requestId, actualCost) so costs are tracked; ensure idempotency by using requestId in chargeCreditsPreemptive, finalizeProcessing, refundCredits and a persisted processedRequests set to prevent double-charging or double-refunding.

## MAJOR Findings

### 1. vercel.json

In @vercel.json around lines 48 - 49, Confirm that changing the Cross-Origin-Resource-Policy header value from "same-origin" to "cross-origin" in vercel.json is intentional: identify the exact header entry "Cross-Origin-Resource-Policy" and the deployment target(s) it applies to, document the specific use case requiring cross-origin access (e.g., public assets, CDN, API endpoints), audit which paths/resources are affected and ensure none expose sensitive data (authentication cookies, private APIs, user data), and if only a subset should be public, scope the header change to those routes or add conditional logic to keep sensitive endpoints as "same-origin".

### 2. src/pages/PaymentCanceled.tsx

In @src/pages/PaymentCanceled.tsx around lines 32 - 38, In the PaymentCanceled component, the "Try Payment Again" button currently navigates to "/" which mismatches its label; update the button's navigation target to the actual payment retry route (e.g., change router.push("/") or Link href="/" in PaymentCanceled to router.push("/payment") or the app's payment route) so clicking retries the payment, or alternatively change the button text to "Return to Home" if keeping "/" is intentional—ensure the change is applied where the "Try Payment Again" button is defined.

### 3. supabase/functions/send-email/index.ts

In @supabase/functions/send-email/index.ts around lines 86 - 91, The current handling assumes emailResponse.json() and result.id exist; change send-email handling to account for SendGrid's 202 with empty body by not calling json() blindly: inspect emailResponse.status and if 202 (or body is empty) avoid parsing JSON, else safely parse; derive a single emailId value (e.g., from result.id when present or from response headers/metadata) and use that variable in the success log/response instead of result.id; update references around emailResponse, result, emailId, to and subject so the success path logs and returns emailId robustly across providers.

### 4. supabase/functions/process-sketch/credit-service.ts

In @supabase/functions/process-sketch/credit-service.ts around lines 84 - 86, The current logic treats budgetError as a fail-open (logs error and returns allowed: true), which can permit unbounded spending; update the budget check handling in credit-service.ts where budgetError is inspected (the budgetError variable and the returned allowed flag) to enforce fail-closed behavior: when budgetError is non-null, return allowed: false (or throw/propagate an error) instead of true, and emit an alert/metric via the existing logger/monitoring utility (e.g., processLogger or metrics.increment) so failures are tracked; ensure any callers of the function handle the new false/throw semantics appropriately.

### 5. supabase/functions/process-sketch/rate-limit.ts

In @supabase/functions/process-sketch/rate-limit.ts around lines 5 - 7, The current in-memory limiter (rateLimitMap, RATE_LIMIT, RATE_LIMIT_WINDOW) is unreliable in serverless/edge environments because cold starts and multiple isolates lose or fragment state and the Map can grow without bounds; replace it with a persistent, atomic counter store (Supabase Redis, KV, or a DB-backed atomic increment) and use that store's TTL/expiry to enforce RATE_LIMIT_WINDOW and eviction, or if you intend a best-effort limiter add a clear comment documenting these limitations and implement entry eviction for rateLimitMap (e.g., store timestamps and run periodic/inline cleanup to remove expired entries) so the Map cannot grow unbounded.

### 6. src/test/__tests__/file-validation.property.test.ts

In @src/test/__tests__/file-validation.property.test.ts around lines 1 - 219, The property tests in src/test/__tests__/file-validation.property.test.ts are tautological because they reimplement the validation rules inline; update each property test to import and call the real validation functions (e.g., validateFileSize, validateMimeType) from the module (suggested ../validators/file-validation) instead of performing inline checks, use the same fast-check generators (fc.integer, fc.string, etc.) to produce inputs, and assert the validation functions' return values (or thrown errors) — e.g., for size tests assert validateFileSize(fileSize) === false for sizes > MAX_SIZE and true for sizes <= MAX_SIZE, and for mime tests call validateMimeType(mimeType) and assert expected boolean based on prefixes like "image/"; ensure all tests reference the actual exported function names (validateFileSize, validateMimeType) rather than duplicating rule logic.

### 7. src/test/__tests__/credit-system.property.test.ts

In @src/test/__tests__/credit-system.property.test.ts around lines 44 - 61, Replace the tautological assertions with a real exercise of the credit system by importing and using the production class/methods (e.g., CreditAccount, addCredits, balance) instead of computing finalCredits locally; create an account with startingCredits, call account.addCredits(...) for each generated purchase amount, then assert account.balance === startingCredits + totalPurchased (and any non-decrease invariant) inside the property-based test so the test actually validates the implementation rather than re-asserting a computed expression.

### 8. src/test/__tests__/credit-system.property.test.ts

In @src/test/__tests__/credit-system.property.test.ts around lines 1 - 4, The tests currently only assert inline logic and never exercise the real credit system; import and use the actual implementation (e.g., the CreditSystem class or functions like calculateCredits, applyTransaction, processTransaction, CreditAccount) in this test file so property inputs are fed into real code paths instead of local mocks; replace the inline logic in each property test with calls to the real API (construct a CreditSystem or CreditAccount, call calculateCredits/applyTransaction or processTransaction with generated inputs, then assert the same invariants against the returned state or outputs) so the property tests validate real behavior and surface implementation edge cases.

### 9. src/test/__tests__/credit-system.property.test.ts

In @src/test/__tests__/credit-system.property.test.ts around lines 120 - 138, The test is tautological because it computes finalCredits from operationSucceeded and userCredits and then asserts that same expression; instead call the actual code path that should deduct credits (e.g., invoke the credit system method under test such as CreditSystem.consumeCredit / performOperationThatConsumesCredit with the test user) and then read the stored credits for that user to assert real behavior: if operationSucceeded then expect readCredits === userCredits - 1 else expect readCredits === userCredits. Replace usage of the computed finalCredits variable with the value returned or fetched from the system after performing the operation (use the existing operationSucceeded, userCredits identifiers to decide expected values).

### 10. src/test/__tests__/credit-system.property.test.ts

In @src/test/__tests__/credit-system.property.test.ts around lines 6 - 17, The test currently asserts a tautology using Math.max(0, startingCredits - deduction); replace this with a property that imports and exercises the real credit system functions/classes (e.g., CreditManager.deduct, CreditAccount.deductCredits, or whichever exports manage credits in your implementation) and assert the implementation enforces non-negative balances: call the actual deduct method with randomized startingCredits and deduction values, then read the account's balance (e.g., getBalance/getCredits) and assert it's >= 0 and that deductions were applied correctly (balance decreased by min(deduction, startingCredits)). Remove the Math.max(...) assertion and use the real module exports from your credit system instead.

### 11. src/hooks/__tests__/useDrawingAnalysis.test.ts

In @src/hooks/__tests__/useDrawingAnalysis.test.ts around lines 1 - 9, Add a vi.mock for the Supabase client module so vi.mocked(supabase.functions.invoke) is valid: at the top of useDrawingAnalysis.test.ts call vi.mock('@/integrations/supabase/client') (or the exact module specifier used in the tests) and provide a mock implementation that exports a supabase object with a functions.invoke method (or use vi.mocked to type the mocked import); ensure the mock returns the shapes your tests expect so calls to supabase.functions.invoke inside useDrawingAnalysis tests are intercepted.

**Suggestions:**
- import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useDrawingAnalysis } from "../useDrawingAnalysis";
import { supabase } from "@/integrations/supabase/client";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    functions: {
      invoke: vi.fn(),
    },
  },
}));

describe("useDrawingAnalysis", () => {

### 12. src/test/__tests__/sketch-status.property.test.ts

In @src/test/__tests__/sketch-status.property.test.ts around lines 177 - 196, The property test currently uses fc.constantFrom("processing") and then reproduces the same conditional to compute resultStatus from errorOccurs, making the test tautological; change the generator to a meaningful one (e.g., fc.boolean() or an arbitrary that can vary error occurrence) and drive the actual code under test that handles errors (invoke the function/method that sets status instead of computing resultStatus locally), then assert the observed status matches the expected behavior (e.g., when the real error path runs the system returns "failed" or similar) rather than mirroring the same conditional; locate references to fc.constantFrom, errorOccurs, and resultStatus in the sketch-status.property.test.ts test and replace the setup so the test exercises real error handling code and verifies its output.

### 13. src/test/__tests__/sketch-status.property.test.ts

In @src/test/__tests__/sketch-status.property.test.ts around lines 1 - 198, The tests in src/test/__tests__/sketch-status.property.test.ts only exercise locally defined helpers instead of production code; replace the tautological checks by importing the real sketch status functions (e.g., transitionStatus, validateStatus, handleTimeout) from the application, generate inputs with the existing property-based generator(s), call those imported functions with the generated inputs, and assert the real invariants the application expects (for example: valid transitions from transitionStatus, validation results from validateStatus, timeout handling via handleTimeout). Ensure each property test calls the production function under test, uses arbitraries to cover edge cases, and asserts outcomes or invariants rather than reimplementing the logic in the test.

### 14. src/test/__tests__/sketch-status.property.test.ts

In @src/test/__tests__/sketch-status.property.test.ts around lines 110 - 125, The test currently just sets shouldTimeout and assigns finalStatus directly then asserts the assigned value, which is tautological; instead, invoke the actual timeout-handling logic (the function under test that observes shouldTimeout and sets finalStatus) and assert its effect: when shouldTimeout is true, simulate the timeout (e.g., with jest.useFakeTimers() and advanceTimersByTime or by mocking the timer/Promise) and assert finalStatus === "failed"; when shouldTimeout is false, run the same code path and assert the expected non-timeout status (or that finalStatus was not changed). Locate and update the test around the shouldTimeout and finalStatus variables to call the real handler (the function that updates finalStatus) and replace direct assignment+assert with simulated timing and assertions on the function's outcome.

### 15. src/test/__tests__/sketch-status.property.test.ts

In @src/test/__tests__/sketch-status.property.test.ts around lines 8 - 29, The test currently computes a local isValidTransition and only asserts its type, so replace the local logic with calls to the real transition function exported from your production code (e.g., import validateSketchStatusTransition or isValidTransition from the module that implements the state machine), then rewrite the property-based assertions to: (1) generate pairs of statuses and assert that known-invalid transitions either return false or throw (use try/catch for throws), (2) assert that known-valid transitions return true, and (3) assert invariants across generated inputs (e.g., no transition changes the identity or allowed-next-states mapping). Use the same property framework (fast-check) to feed generated status pairs into the imported function and assert actual boolean/exception outcomes rather than checking typeof isValidTransition.

### 16. src/test/__tests__/sketch-status.property.test.ts

In @src/test/__tests__/sketch-status.property.test.ts around lines 128 - 143, The test currently only checks that a generated finalStatus is in validStatuses, which tests the generator not concurrency; replace it with a test that simulates concurrent updates (e.g., two differing status updates with different timestamps or versions), invokes the module's concurrent-resolution function (call it resolveStatusConflict or handleConcurrentStatusUpdate in the status handling module), and asserts the returned final status matches the expected resolution rule (timestamp/version ordering or precedence). Keep references to the existing test variables finalStatus and validStatuses to build inputs and expected outputs, and ensure the test covers at least one race scenario and one equal-timestamp tie-breaker path.

### 17. src/test/__tests__/sketch-status.property.test.ts

In @src/test/__tests__/sketch-status.property.test.ts around lines 45 - 51, Replace the tautological assertion with a fast-check property that actually exercises the retry logic: import the production retry function (e.g., fetchSketchStatusWithRetry or retryOperation) and the configured maxRetries constant from the sketch status service, create a fake async implementation that fails a generated number of times then succeeds (or throws non-retryable errors), and use fast-check to generate failureCounts and verify that when failureCount < = maxRetries the call eventually succeeds and when failureCount > maxRetries it rejects; mock or spy the underlying call to assert attempt count and ensure the test covers both success-after-retries and eventual-failure paths.

### 18. src/hooks/sketch/useSketchSubscription.ts

In @src/hooks/sketch/useSketchSubscription.ts around lines 75 - 82, In the INSERT branch of useSketchSubscription (where convertToSketch(newRecord) is called and sketches are added), only increment the new sketch counter when the incoming record is actually new: check newRecord.is_new === true before calling the counter updater (e.g., setNewSketchCount or newSketchCount increment). Update the logic that currently increments unconditionally so it becomes conditional on newRecord.is_new, leaving the existing dedupe (prev.some) and prepend behavior intact.

**Suggestions:**
-         if (payload.eventType === "INSERT" && newRecord) {
          const newSketch = convertToSketch(newRecord);
          console.log("➕ Adding new sketch:", newSketch.id);
          setSketches((prev) => {
            if (prev.some((s) => s.id === newSketch.id)) return prev;
            return [newSketch, ...prev];
          });
          if (newSketch.is_new) {
            setNewSketchCount((prev) => prev + 1);
          }
        }

### 19. src/hooks/sketch/useSketchTimeout.ts

In @src/hooks/sketch/useSketchTimeout.ts around lines 10 - 88, The hook useSketchTimeout currently starts an interval via startTimeoutChecker stored in timeoutCheckRef but never cleans it up automatically; add a React useEffect inside the hook that imports useEffect and runs once on mount and returns a cleanup function which clears the interval (use stopTimeoutChecker or clearInterval(timeoutCheckRef.current) and set timeoutCheckRef.current = null) to ensure the interval is cleared on unmount and prevent memory leaks and stale state updates.

**Suggestions:**
- import { useRef, useEffect, useCallback } from "react";

export const useSketchTimeout = ({ setSketches }: UseSketchTimeoutProps) => {
  const { toast } = useToast();
  const timeoutCheckRef = useRef<NodeJS.Timeout | null>(null);

  const checkForStuckSketches = useCallback(async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return;

      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();

      const { data: stuckSketches, error } = await supabase
        .from("sketches")
        .select("*")
        .eq("status", "processing")
        .eq("user_id", user.user.id)
        .lt("updated_at", tenMinutesAgo);

      if (error) {
        console.error("Error checking for stuck sketches:", error);
        return;
      }

      if (stuckSketches && stuckSketches.length > 0) {
        console.log(
          `⚠️ Found ${stuckSketches.length} sketches stuck in processing for >10 minutes`,
        );

        setSketches((prev) =>
          prev.map((sketch) => {
            if (stuckSketches.some((stuck) => stuck.id === sketch.id)) {
              return { ...sketch, status: "failed" as const };
            }
            return sketch;
          }),
        );

        for (const stuckSketch of stuckSketches) {
          await supabase
            .from("sketches")
            .update({
              status: "failed",
              updated_at: new Date().toISOString(),
            })
            .eq("id", stuckSketch.id);
        }

        toast({
          title: "Processing Timeout",
          description: `${stuckSketches.length} sketch(es) took too long to process. You can retry them from the gallery.`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error in timeout checker:", error);
    }
  }, [setSketches, toast]);

  const startTimeoutChecker = useCallback(() => {
    if (timeoutCheckRef.current) {
      clearInterval(timeoutCheckRef.current);
    }

    timeoutCheckRef.current = setInterval(checkForStuckSketches, 60000); // Check every minute
  }, [checkForStuckSketches]);

  const stopTimeoutChecker = useCallback(() => {
    if (timeoutCheckRef.current) {
      clearInterval(timeoutCheckRef.current);
      timeoutCheckRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutCheckRef.current) {
        clearInterval(timeoutCheckRef.current);
      }
    };
  }, []);

  return {
    checkForStuckSketches,
    startTimeoutChecker,
    stopTimeoutChecker,
  };
};

### 20. src/test/__tests__/file-validation.property.test.ts

In @src/test/__tests__/file-validation.property.test.ts around lines 97 - 110, The property test fails because fc.stringOf can emit empty strings which match the regex and make isValidFormat true; update the test to ensure generated strings are non-empty (e.g., use fc.stringOf(..., { minLength: 1 }) or fc.string({ minLength: 1 }) or apply .filter(s => s.length > 0)) so that the input to isValidFormat never is empty and the assertion behaves as intended; change the generator usage in the test around fc.stringOf and the code that computes isValidFormat to use the non-empty constraint.

### 21. src/hooks/sketch/useSketchTimeout.ts

In @src/hooks/sketch/useSketchTimeout.ts around lines 47 - 55, Replace the sequential await loop that updates each stuckSketch with a batched approach: map stuckSketches to an array of update promises calling supabase.from("sketches").update(...).eq("id", stuckSketch.id), run them with Promise.allSettled, then iterate the results to log or surface any failures and reconcile local state (e.g., remove or mark failed sketches in your local list/state the hook manages) only for the successfully updated IDs; ensure you include error details from rejected promises so failed DB updates don't leave local state out of sync.

**Suggestions:**
-         const stuckIds = stuckSketches.map((s) => s.id);
        const { error: updateError } = await supabase
          .from("sketches")
          .update({
            status: "failed",
            updated_at: new Date().toISOString(),
          })
          .in("id", stuckIds);

        if (updateError) {
          console.error("Error updating stuck sketches:", updateError);
        }

### 22. src/test/__tests__/sketch-status.property.test.ts

In @src/test/__tests__/sketch-status.property.test.ts around lines 31 - 43, The test declares a generated parameter newStatus but never uses it and instead asserts a hardcoded constant; update the test that declares newStatus to actually call the code-under-test (e.g., the function that updates a sketch's status such as updateSketchStatus / setStatus / the method invoked in this test) with newStatus, then assert the resulting object's status equals newStatus (or that the persisted entity has status === newStatus) instead of asserting a constant false === false; also remove the useless hardcoded assertion and ensure any setup/teardown or mocks reflect the status change so the generated input is validated.

### 23. supabase/migrations/20260315000001_create_stories_tables.sql

In @supabase/migrations/20260315000001_create_stories_tables.sql around lines 61 - 67, The INSERT/UPDATE policies on story_pages ("Service role can insert story pages" and "Service role can update story pages") are overly permissive; either delete these two policies if only the service role writes pages (service role bypasses RLS), or tighten them to enforce parent story ownership similar to the SELECT policy: replace WITH CHECK (true) and USING (true) with checks that the parent story belongs to the current user (e.g., an EXISTS/JOIN against public.stories where stories.id = story_pages.story_id and stories.owner_id = auth.uid()) so only the story owner (or service role) can create/update pages.

**Suggestions:**
- CREATE POLICY "Service role can delete story pages"
  ON public.story_pages FOR DELETE
  USING (true);  -- edge functions use service role key
- CREATE POLICY "Users can insert pages to their own stories"
  ON public.story_pages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.stories
      WHERE stories.id = story_id
        AND stories.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update pages of their own stories"
  ON public.story_pages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.stories
      WHERE stories.id = story_pages.story_id
        AND stories.user_id = auth.uid()
    )
  );

### 24. src/hooks/useAdminAuth.ts

In @src/hooks/useAdminAuth.ts at line 31, The console.error calls in the useAdminAuth hook are logging whole Error objects (e.g., the console.error("Admin auth error:", error) occurrences) which may contain sensitive PII; replace those direct logs with sanitized output: extract and log only non-sensitive fields (e.g., error.name, error.message, and an error.code or safe flag) or pass the error through a small sanitizer function (e.g., sanitizeError) that strips session/user fields before logging, and ensure in catch blocks you never stringify the whole error or include request/response bodies or tokens—use the hook name useAdminAuth and the existing console.error sites as anchors to update the logging.

### 25. src/components/SketchGallery/ImagePreviewModal.tsx

In @src/components/SketchGallery/ImagePreviewModal.tsx around lines 14 - 26, The ImagePreviewModal component is missing accessibility features: add role="dialog" and aria-modal="true" to the modal container (outer div) so screen readers announce it; implement Escape-key handling by adding a keydown listener in useEffect that calls the existing close handler (e.g., handleClose or the onClose prop) when Escape is pressed; manage focus by saving the trigger element before open, moving focus into the modal (set focus to the modal container or a designated focusable element) and restoring focus to the trigger on close; trap focus inside the modal by cycling between the first and last focusable elements (or integrate a tiny focus-trap utility) while open; and add a visible, keyboard-focusable close button inside ImagePreviewModal with an accessible label (aria-label="Close") that calls the same close handler.

### 26. src/hooks/sketch/useSketchSubscription.ts

In @src/hooks/sketch/useSketchSubscription.ts around lines 147 - 162, The reconnection logic in setupRealtimeSubscription can loop forever and capture a stale isAuthenticated; introduce a retryCountRef (e.g., retryCountRef.current) and an isAuthenticatedRef to hold live auth state, increment retryCountRef.current on each scheduled retry and stop retrying (or abort and log) when it exceeds a chosen MAX_RETRIES, and reset retryCountRef.current = 0 when a subscription succeeds (where you currently set isSubscribedRef.current = true / log success); in the setTimeout closure, read isAuthenticatedRef.current instead of the primitive isAuthenticated to avoid stale closures and only call setupRealtimeSubscription() when retryCountRef.current < MAX_RETRIES and isAuthenticatedRef.current is true.

### 27. src/hooks/useDrawingAnalysis.ts

In @src/hooks/useDrawingAnalysis.ts at line 22, In the useDrawingAnalysis hook, remove or guard all console.log statements that print potentially sensitive data (e.g., console.log("Full error object:", error) and logs that reference imageUrl, prompt, or API response objects); instead either (a) replace them with calls to a structured logger (e.g., processLogger.debug or safeLogger) that explicitly redacts or omits PII fields, or (b) conditionally emit these logs only when NODE_ENV !== 'production' (wrap in an if) and ensure you never log raw image URLs, full prompts, or full API responses. Locate the console.log calls in useDrawingAnalysis and update the error, imageUrl, prompt, and response logging to use redaction or environment-guarded debug logging.

### 28. .planning/phases/06-story-generation-backend/06-CONTEXT.md

In @.planning/phases/06-story-generation-backend/06-CONTEXT.md at line 18, The implementation repeatedly downloads and base64-encodes the same reference image for each gpt-image-1 illustration call; instead, fetch the animated_image_url once, convert it to a base64 string and store it in a cached variable (e.g., cachedBase64Reference or cached_base64_reference) and reuse that value for all five page illustration requests; update the code paths that build the gpt-image-1 payloads to read from this cached variable rather than re-downloading/encoding, and ensure the cache is populated before the loop that issues the five illustration calls so all requests reuse the single encoded payload.

### 29. .planning/PROJECT.md

In @.planning/PROJECT.md at line 41, The entry listing models/services is using incorrect or unverified names; update the .planning/PROJECT.md line that currently mentions "gpt-image-1", "GPT-4o-mini", and "fal.ai Seedance" to use the correct, documented product names: replace "gpt-image-1" with the appropriate OpenAI image/edit model (e.g., "DALL·E 3" for image generation/edits or "GPT‑4o Vision" / "GPT‑4V" for multimodal vision if you intend vision capabilities), verify whether "GPT-4o-mini" is a published variant and replace it with the confirmed name (e.g., "GPT‑4o" or the exact published variant) or remove it if unverified, and confirm fal.ai’s actual video product name and replace "Seedance" with the vendor’s documented product name (or note "fal.ai (verify product)")—make these substitutions in the single line that lists AI services so the file uses only validated model/service names.

### 30. src/hooks/useUserProfile.ts

In @src/hooks/useUserProfile.ts at line 147, The console.log in useUserProfile.ts that prints "Profile updated via realtime:" with payload.new exposes PII (email); change it to avoid logging the full profile object—either remove the log or log only non-PII fields (e.g., id, username, updatedAt) or a sanitized summary. Locate the realtime update handler (the code referencing payload.new) and replace the full-object log with a sanitized object or minimal debug message that omits email and other PII.

**Suggestions:**
-               console.log("Profile updated via realtime:", { 
                id: payload.new.id, 
                credits: payload.new.credits 
              });

### 31. src/hooks/useAdminAuth.ts

In @src/hooks/useAdminAuth.ts around lines 64 - 66, The auth listener in useAdminAuth uses direct state updates (setAdminState({...})) which can cause stale updates; update the SIGNED_OUT and SIGNED_IN/TOKEN_REFRESHED branches to use the functional setState form (pass prev => ({...prev, ...})) so you merge changes safely; locate the listener inside useAdminAuth (the event handler checking event === "SIGNED_OUT" / "SIGNED_IN" / "TOKEN_REFRESHED") and replace direct setAdminState calls with functional updates that preserve any existing fields and only change isAdmin, isLoading, and user accordingly, mirroring the pattern used in checkAdminAccess.

**Suggestions:**
-       if (event === "SIGNED_OUT") {
        setAdminState((prev) => ({ isAdmin: false, isLoading: false, user: null }));
      } else if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {

### 32. supabase/functions/admin-operations/index.ts

In @supabase/functions/admin-operations/index.ts around lines 143 - 148, The resetPasswordForEmail call is using new URL(req.url).origin (the Edge Function URL) as the redirectTo, causing invalid reset links; change the redirectTo to use the configured frontend URL instead (e.g., read from an env var like FRONTEND_URL or a project config constant) when calling supabaseService.auth.resetPasswordForEmail in this handler, and ensure you validate or provide a sensible fallback if the FRONTEND_URL is missing so the redirect becomes `${FRONTEND_URL}/reset-password` rather than using new URL(req.url).origin.

**Suggestions:**
- 
        const frontendUrl = Deno.env.get("FRONTEND_URL") || "https://yourapp.com";

        // Send password reset email
        const { error } = await supabaseService.auth.resetPasswordForEmail(
          email,
          {
            redirectTo: `${frontendUrl}/reset-password`,

### 33. supabase/functions/admin-operations/index.ts

In @supabase/functions/admin-operations/index.ts at line 5, Replace the hardcoded ADMIN_EMAIL constant with a value read from process.env (e.g., process.env.ADMIN_EMAIL) and update the isAdmin function to use that environment value; ensure you reference the new ENV-backed ADMIN_EMAIL symbol (or inline process.env access) in the isAdmin implementation, and add handling for the case where ADMIN_EMAIL is not set (return false and/or throw a clear error/log a warning) so the function behaves safely when the env var is absent.

**Suggestions:**
- const ADMIN_EMAIL = Deno.env.get("ADMIN_EMAIL");

### 34. .planning/phases/06-story-generation-backend/06-02-SUMMARY.md

In @.planning/phases/06-story-generation-backend/06-02-SUMMARY.md at line 36, Update the summary to explicitly document the error handling and rollback strategy for the asynchronous story generation workflow: describe what happens when partial inserts to story_pages occur (rollback vs preserve), whether credits are charged on partial success or only after the final commit that sets story.status to "completed", and how the system surfaces "processing" vs "failed" states to users (e.g., retries, timeouts, error flags, or compensating cleanup) for the fire-and-forget pattern that returns storyId while generation continues; reference the entities story_pages, storyId, and the story.status "processing"/"completed" and include a recommended behavior (e.g., transactional rollback on partial failure or a cleanup job plus credit refund policy) so the document clearly prescribes the expected handling and user-visible signals.

### 35. supabase/functions/process-sketch/index.original.ts

In @supabase/functions/process-sketch/index.original.ts around lines 6 - 9, The in-memory rateLimitMap (and constants RATE_LIMIT, RATE_LIMIT_WINDOW) is unsafe in a serverless Edge Function; replace it with a persistent, atomic rate-limiter (e.g., Redis or Supabase DB). Implement a new helper (e.g., checkRateLimit) that uses Supabase RPC or a dedicated rate_limit table and performs an atomic increment+expire or SQL stored procedure to return {allowed, waitTime}, then call that helper instead of reading/updating rateLimitMap in the request handler; keep RATE_LIMIT and RATE_LIMIT_WINDOW as config values and ensure the function handles RPC errors (fail-open or fail-closed per your policy).

### 36. Git_Synchronization_Plan.md

In @Git_Synchronization_Plan.md around lines 307 - 335, The workflow pushes docs directly to main and creates the feature branch after the push; instead create the feature branch first, commit there, sync with remote main before pushing, and push the branch (not main) for a PR. Specifically, run git checkout -b fix/image-generation-errors, then git add and git commit -m as currently shown, run git fetch && git pull --rebase origin main to incorporate remote changes/conflicts, and then git push origin fix/image-generation-errors followed by opening a PR instead of running git push origin main.

**Suggestions:**
- ## Commands to Execute Now


### 37. ImageGeneration_Debugging_Plan.md

In @ImageGeneration_Debugging_Plan.md around lines 171 - 176, Extend the "Audit credit deduction flow" plan to specify concrete race-condition mitigation techniques: recommend using atomic DB updates (e.g., an UPDATE that decrements only when balance >= amount and returns the row) for the credit deduction step, or wrap operations in a transaction with row-level locking via SELECT FOR UPDATE for the transaction handling path; alternatively offer optimistic locking using a version counter on the credits row and retry on conflict; also add a DB-level CHECK constraint to prevent negative balances and include testing guidance to simulate concurrent requests to validate each approach.

### 38. src/screens/HomeScreen.tsx

In @src/screens/HomeScreen.tsx around lines 194 - 200, The polling loop stops on exceptions but doesn't mark the sketch as failed when maxAttempts is reached; modify the exception handling in the polling logic that uses attempts, maxAttempts, storyPollIntervalRef and stopPolling so that when attempts >= maxAttempts you call updateSketchStatus(sketchId, "failed") before clearing the interval (same behavior as the other error branch). Ensure you reference the same sketchId in that catch branch and then call stopPolling() (or clear the interval) to avoid duplicate timers.

### 39. Architecture_Tracker.md

In @Architecture_Tracker.md at line 196, The current 67MB base64 (50MB original) payload risks exceeding Supabase Edge Function isolate resource limits and may cause 546 errors; update the upload/processing pipeline to ensure headroom by either (A) reducing the allowed original upload size from 50MB to a safer threshold (e.g., 20–30MB) in your upload validation/config variable (the setting that currently enforces "Current Limit: 67MB base64 encoded (50MB original)"), or (B) add an image preprocessing step that compresses/resizes images before base64 encoding and OpenAI processing (implement compression in the upload handler or a preprocessor function so functions like the image-to-base64 and OpenAI call receive a smaller payload). Also add a runtime memory check or conservative buffer before invoking the Edge Function-heavy operations to avoid hitting the 50% isolate cutoff.

### 40. Architecture_Tracker.md

In @Architecture_Tracker.md at line 243, The line "API Key Exposure: OpenAI API key stored in environment variables" is misleading; update the wording to clarify that storing API keys in environment variables is the recommended practice and note the actual risks to guard against (e.g., committing env files, inadequate CI secret handling). Replace the heading "API Key Exposure" with something like "API Key Storage" or "API Key Handling", reword the sentence to state that environment variables are preferred, and add a short note to avoid committing .env files and to use secure secret management in CI/CD (refer to the phrase "API Key Exposure" and the sentence "OpenAI API key stored in environment variables" to locate and change the text).

**Suggestions:**
- 1. **API Key Management**: OpenAI API key properly secured in environment variables (✓ best practice)

## MINOR Findings

### 1. supabase/functions/send-email/index.ts

In @supabase/functions/send-email/index.ts around lines 87 - 91, The current logging call (console.log that prints to, subject, and result.id) exposes recipient emails; change it to avoid logging raw PII by either omitting the `to` field or replacing it with a non-reversible identifier (e.g., a SHA-256 hash of `to`) before logging; specifically update the console.log usage near the email send result so it logs subject and emailId (result.id) but not the plaintext `to`, or log a hashed version of `to` instead and ensure the hashing logic is applied where the current variables `to`, `subject`, and `result.id` are available.

### 2. supabase/functions/process-sketch/rate-limit.ts

In @supabase/functions/process-sketch/rate-limit.ts around lines 21 - 24, The window reset check in the rate limiter uses a strict greater-than which can delay resets by one millisecond; update the condition in the block that checks userRateLimit.resetTime (the if within process-sketch/rate-limit.ts that compares now and userRateLimit.resetTime) to use >= instead of > so that when now === userRateLimit.resetTime the count is reset and resetTime is advanced by RATE_LIMIT_WINDOW (leave the assignments to userRateLimit.count and userRateLimit.resetTime unchanged).

**Suggestions:**
-   if (now >= userRateLimit.resetTime) {
    userRateLimit.count = 0;
    userRateLimit.resetTime = now + RATE_LIMIT_WINDOW;
  }

### 3. src/integrations/supabase/client.ts

In @src/integrations/supabase/client.ts around lines 1 - 10, This file (src/integrations/supabase/client.ts) shows signs of manual formatting although its header states it is auto-generated; either revert the manual edits and restore the original generated file or update the generator so the desired formatting persists. Locate the auto-generated header at the top of the file, then either (A) replace the current file with the exact output from the generator (undo changes around imports and constant declarations such as createClient, AsyncStorage, SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY) or (B) modify the generator/template that emits this file so it produces the corrected formatting and values (ensuring symbols createClient, Database import, AsyncStorage and the SUPABASE_* constants are emitted consistently). Ensure no manual edits remain if the file stays auto-generated.

### 4. src/components/ui/menubar.tsx

In @src/components/ui/menubar.tsx at line 215, The component's casing for the React display name is incorrect—change the lowercase property `displayname` to `displayName` so React DevTools recognizes it; locate the Menubar component (or the exported component symbol in this file, e.g., Menubar / MenuBar) and update its static property or assignment from `displayname = ...` to `displayName = ...` to match the exact React casing used elsewhere in this file.

**Suggestions:**
- MenubarShortcut.displayName = "MenubarShortcut";

### 5. src/components/ui/breadcrumb.tsx

In @src/components/ui/breadcrumb.tsx at line 105, The component's displayName is misspelled as "BreadcrumbElipssis"; update the displayName property for the BreadcrumbEllipsis component to the correct string "BreadcrumbEllipsis" so React DevTools shows the proper name (locate the displayName assignment for the BreadcrumbEllipsis component and correct the typo).

**Suggestions:**
- BreadcrumbEllipsis.displayName = "BreadcrumbEllipsis";

### 6. src/test/setup.ts

In @src/test/setup.ts around lines 46 - 50, The current useToast() mock creates a new spy on every call so tests cannot assert against the same instance; fix it by creating and exporting a single shared mock function (e.g. export const mockToast = vi.fn()) and then updating the mocked useToast implementation to return that mockToast instead of creating a new vi.fn() inside useToast; reference the useToast mock and the new mockToast symbol so components under test and test files import the same instance for assertions.

### 7. src/test/__tests__/file-validation.property.test.ts

In @src/test/__tests__/file-validation.property.test.ts around lines 43 - 51, The test uses the non-standard MIME type "image/jpg"; update the test (and any related allowed MIME list) to use the standard "image/jpeg" instead. Locate occurrences in src/test/__tests__/file-validation.property.test.ts (e.g., references to the test case name or helper that asserts allowed types, and any constants like allowedMimeTypes or validateFileType/validateMime) and replace "image/jpg" with "image/jpeg" (or explicitly add both if you intentionally support the alias), then adjust assertions to expect the standard MIME value.

### 8. .planning/STATE.md

In @.planning/STATE.md around lines 48 - 53, The "Recent Trend" block is contradictory: it says "Not yet tracked" but immediately shows tracking rows for "Phase 06-story-generation-backend P01/P02/P03" without headers; either remove the rows or update the header and the status. Fix by either deleting lines containing the three phase rows if tracking really hasn't started, or change "Not yet tracked" to something like "Tracked metrics" and add proper table headers (e.g., Phase | Points | Tasks | Files) above the rows so the entries for Phase 06-story-generation-backend P01/P02/P03 are clearly labeled and consistent with the section.

**Suggestions:**
- **Recent Trend:** Not yet tracked

*Updated after each plan completion*

### 9. supabase/functions/poll-story/index.ts

In @supabase/functions/poll-story/index.ts at line 27, The JWT extraction using authHeader.replace("Bearer ", "") is fragile; update the extraction logic around authHeader/jwt to robustly handle missing headers, case-insensitive schemes, and extra whitespace: first validate authHeader exists, split on whitespace (e.g., const parts = authHeader.trim().split(/\s+/)), verify parts.length === 2 and parts[0].toLowerCase() === "bearer", then set jwt = parts[1]; if validation fails return an authorization error or null so the rest of the code doesn't treat the entire header as the token.

**Suggestions:**
-     const jwt = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
    if (!jwt) {
      return new Response(
        JSON.stringify({ error: "Invalid authorization format", success: false }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 },
      );
    }

### 10. supabase/functions/analyze-drawing/index.ts

In @supabase/functions/analyze-drawing/index.ts around lines 287 - 299, In the catch block of the analyze-drawing handler, don't access error.message directly because caught exceptions are unknown; update the block that builds the JSON response (the catch handling around console.error and the Response return) to safely extract the message by checking if error is an instance of Error and using error.message, otherwise use String(error) or JSON.stringify(error) as a fallback, and include that safeMessage in the response.details and in the console.error call so non-Error throw values are handled without runtime type errors.

**Suggestions:**
-     });
  } catch (error) {
    console.error("Error in analyze-drawing function:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({
        error: "An unexpected error occurred",
        code: "INTERNAL_ERROR",
        details: errorMessage,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },

### 11. supabase/functions/create-payment/index.ts

In @supabase/functions/create-payment/index.ts around lines 112 - 115, The catch block in the create-payment handler currently treats the caught value as an Error and accesses error.message; instead narrow the unknown by checking the caught value with a type guard (e.g. error instanceof Error) and extract a safe message fallback using String(error) when it’s not an Error, log that safe message via console.error, and return the Response using the derived message (preserving existing status/body behavior); update the catch in the create-payment/index.ts file where the Response is constructed so it never assumes error has a .message property.

### 12. src/components/__tests__/FileUpload.test.tsx

In @src/components/__tests__/FileUpload.test.tsx around lines 168 - 195, The FileReader mock used in FileUpload.test.tsx should trigger errors during readAsDataURL (not in the constructor), invoke the instance.onerror with a ProgressEvent-like object (not an Error), and always restore global.FileReader even if the test fails; update the mock so readAsDataURL calls this.onerror({ type: 'error', target: { result: null } } as ProgressEvent) (or similar shape) to simulate failure timing, and ensure global.FileReader is restored in an afterEach or a try/finally around the test that assigns the mock (reference global.FileReader and readAsDataURL in the test file).

### 13. src/hooks/__tests__/useAdminAuth.test.ts

In @src/hooks/__tests__/useAdminAuth.test.ts around lines 1 - 6, The test is calling vi.mocked(supabase.auth.getUser) without first mocking the Supabase module; add an explicit module mock call (e.g., vi.mock('@/integrations/supabase/client')) before using or importing the supabase client in this test file so vi.mocked(...) will work; ensure the vi.mock call appears at the top of useAdminAuth.test.ts (before any imports that resolve the supabase client) and then keep using vi.mocked(supabase.auth.getUser) to set return values or spies.

### 14. .planning/ROADMAP.md

In @.planning/ROADMAP.md around lines 41 - 43, Phase 6 checklist entries are still unchecked despite the phase being marked complete; update the three plan lines for 06-01-PLAN.md, 06-02-PLAN.md, and 06-03-PLAN.md in the Phase 6 section to mark them completed by changing their checkboxes from "- [ ]" to "- [x]" so the checklist matches the "3/3" progress and the phase completion date.

**Suggestions:**
- - [x] 06-01-PLAN.md — Database schema: stories + story_pages tables with RLS, TypeScript types
- [x] 06-02-PLAN.md — generate-story edge function: story text + per-page illustrations + credit deduction
- [x] 06-03-PLAN.md — poll-story edge function + useStories hook + HomeScreen story creation UI

### 15. .planning/ROADMAP.md

In @.planning/ROADMAP.md around lines 70 - 75, The Phase 6 row in the roadmap table has a misaligned "Milestone" value ("3/3") which shifts subsequent columns; update the row corresponding to "6. Story Generation Backend" so the Milestone column reads "v2.0" (matching Phases 7 and 8) and ensure the remaining columns ("Plans Complete", "Status", "Completed") are moved back into their correct cells to restore column alignment for that row.

**Suggestions:**
- | Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1–5. Core App | v1.0 | — | Complete | 2026-03-15 |
| 6. Story Generation Backend | v2.0 | 3/3 | Complete | 2026-03-16 |
| 7. Story Reader + PDF Export | v2.0 | 0/? | Not started | - |
| 8. Videobook | v2.0 | 0/? | Not started | - |

### 16. .planning/phases/06-story-generation-backend/.continue-here.md

In @.planning/phases/06-story-generation-backend/.continue-here.md at line 6, The checkpoint's metadata field 'last_updated' is stale (2026-03-16); either refresh it to the current ISO timestamp to mark the checkpoint active or remove/resolve the checkpoint entry if it's no longer relevant; locate the 'last_updated' key in the .continue-here.md checkpoint block, update the value to the current date/time (and optionally add a brief note with the verifier's name or resolution status) to clear the stale alert.

### 17. supabase/migrations/20260315000001_create_stories_tables.sql

In @supabase/migrations/20260315000001_create_stories_tables.sql around lines 42 - 44, The UPDATE policy "Users can update their own stories" on public.stories currently only uses USING and must also include a WITH CHECK to prevent ownership transfer; update the policy definition for the FOR UPDATE command so the WITH CHECK expression enforces that auth.uid() = user_id for the new row values (i.e., ensure both USING and WITH CHECK use auth.uid() = user_id) to prevent a user from changing user_id when updating a story.

**Suggestions:**
- CREATE POLICY "Users can update their own stories"
  ON public.stories FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

### 18. supabase/migrations/20260315000001_create_stories_tables.sql

In @supabase/migrations/20260315000001_create_stories_tables.sql around lines 13 - 21, The story_pages table allows duplicate page_number values per story; add a uniqueness constraint on the (story_id, page_number) pair to enforce one page per number per story. Update the CREATE TABLE for public.story_pages (or add an ALTER TABLE) to add a UNIQUE constraint on columns story_id and page_number (e.g., CONSTRAINT story_pages_story_id_page_number_key UNIQUE (story_id, page_number)) so the DB enforces the rule and prevents duplicate page numbers within a story.

### 19. src/test/__tests__/credit-system.property.test.ts

In @src/test/__tests__/credit-system.property.test.ts around lines 140 - 151, The test currently uses fc.integer({ min: 0, max: 0 }) which always yields 0 and defeats property testing; change the generators so credits vary and exercise the insufficient-credit branch. Replace fc.integer({ min: 0, max: 0 }) with a variable userCredits generator like fc.integer({ min: 0, max: 10 }) and ensure requiredCredits is generated as fc.integer({ min: 1, max: 10 }), then assert the insufficient-credit behavior when userCredits < requiredCredits (or filter/generate pairs where userCredits < requiredCredits) in the property test to cover varied inputs instead of the hardcoded zero.

### 20. src/components/FileUpload.tsx

In @src/components/FileUpload.tsx around lines 116 - 117, The file extension extraction using split(".").pop() in the FileUpload component can return undefined and cause type issues; update the code where the template literal builds the filename (the expression using split(".").pop()) to provide a safe fallback or assert a string (e.g., use ?? '' or a default extension) so the resulting value is always a string; ensure the change targets the FileUpload component's file extension extraction logic and update any related variable (e.g., fileExtension or the template literal that constructs the uploaded filename) accordingly.

### 21. src/hooks/useStories.ts

In @src/hooks/useStories.ts around lines 58 - 71, The current invoke error handling in useStories (around supabase.functions.invoke in the createStory flow) relies on undocumented invokeError.context/.json() and only console.logs errors; change it to handle errors using documented properties: check for invokeError and use invokeError.message (or parse JSON from data if the function returns an error payload in data) instead of invokeError.context/.json(), and ensure you call the hook's setError state (e.g., setError or whatever error setter exists in useStories) when creation fails so the UI can show feedback; keep the AbortController/timeout cleanup (clearTimeout and controller.abort handling) but make sure errors from both the invoke call and any thrown exceptions are captured and passed to the error state rather than only logged.

### 22. src/hooks/useStories.ts

In @src/hooks/useStories.ts around lines 89 - 91, The race causes duplicate stories because fetchStories() and setupSubscription() run concurrently; fix by either awaiting fetchStories() before calling setupSubscription() where they are invoked (ensure fetchStories() completes and populates state before subscribing) or add deduplication in the realtime INSERT handler (in the subscription callback that currently calls setPendingStoryId / prepends new story: check existing stories by id via the stories state or updater and skip/prevent adding if an item with the same storyId already exists). Update the logic in the functions fetchStories(), setupSubscription(), and the INSERT handler to implement one of these approaches consistently.

### 23. supabase/functions/process-sketch/validation.ts

In @supabase/functions/process-sketch/validation.ts around lines 139 - 141, The error message currently hardcodes "cartoon, pixar, realistic"; update the JSON.stringify error to derive allowed values from the availablePresets parameter (e.g., availablePresets.join(', ')) so the message always reflects the actual presets, and ensure you reference the availablePresets variable used in the validation function (where the response JSON is created) when constructing the error string.

### 24. .planning/phases/06-story-generation-backend/06-CONTEXT.md

In @.planning/phases/06-story-generation-backend/06-CONTEXT.md at line 43, Decide and codify an error-handling strategy for page illustration failures in the story-generation pipeline: choose one approach (recommend: generate all text first, then illustrations, and retry each illustration up to N times before marking the story failed) and update the planning docs and implementation points — e.g., implement retryIllustration(maxAttempts) called from generatePageIllustration, ensure persistStory only saves complete stories or add persistPartialStory with a clear state flag, and add observability hooks (logs/metrics) and a clear fail-fast vs all-or-nothing flag in the story generation orchestration to match the chosen strategy.

### 25. .planning/phases/06-story-generation-backend/06-02-SUMMARY.md

In @.planning/phases/06-story-generation-backend/06-02-SUMMARY.md around lines 109 - 112, Add local Deno installation and developer checks: install the Deno runtime on your dev machine and verify types with `deno check` during local development, then document the steps in the project setup docs (add a short "Install Deno" section and sample `deno check` command), and enforce automated checking by adding a `deno check` step to the CI workflow and/or a pre-commit hook (e.g., run `deno check` as part of pre-commit or pre-push) so type verification runs before or during commits and CI.

### 26. supabase/functions/generate-story/index.ts

In @supabase/functions/generate-story/index.ts around lines 180 - 194, The handler captures currentCredits early (currentCredits) and later calls deductUserCredits after a long async generation, creating a race; modify the flow so you re-fetch the user's latest credits immediately before calling deductUserCredits (or replace deductUserCredits with an atomic DB decrement operation) to avoid using the stale currentCredits value—update code paths around generateStory (or the function invoking deductUserCredits) to read the latest balance from the DB and/or perform a single atomic decrement query (e.g., SQL UPDATE ... SET credits = credits - X WHERE id = ? AND credits >= X) and handle the failure case if insufficient credits.

### 27. src/hooks/sketch/useSketchFetcher.ts

In @src/hooks/sketch/useSketchFetcher.ts around lines 64 - 71, The loading flicker happens because the finally block sets isLoading = false while a retry delay is pending; update the fetch logic in fetchSketches so retries do not clear loading: either (A) move the retry scheduling out of the try/catch/finally flow (so the function returns early and skips the finally that sets isLoading), or (B) add a retryPending ref/flag and set retryPending = true before scheduling the setTimeout retry and only set isLoading = false in finally when retryPending is false (clear retryPending when the retry starts). Reference symbols: fetchSketches, isLoading, retryCount, maxRetries, error.code === "57014".

### 28. supabase/functions/admin-operations/index.ts

In @supabase/functions/admin-operations/index.ts around lines 474 - 478, The catch block currently logs the error and builds a response that exposes internal details; keep logging the full error/server stack via console.error(error) (or processLogger.error) but remove error.stack from the outgoing payload and return only a sanitized message (use the existing errorMessage variable) and an appropriate status code; update the Response creation in the catch handler that follows the console.error("Admin operation error:", error) so the client gets a minimal JSON error (no stack or internals) while the server log retains the full error.stack for debugging.

### 29. supabase/functions/generate-story/story-service.ts

In @supabase/functions/generate-story/story-service.ts around lines 213 - 218, The code assumes (supabase as any).storage.from("sketches").getPublicUrl(storageData.path) always returns urlData with a publicUrl; add a null/undefined check for urlData and for urlData.publicUrl before returning. Inside the function that calls getPublicUrl (reference getPublicUrl and the local variable urlData and storageData.path), verify urlData && typeof urlData.publicUrl === "string" and either throw a clear error or return a safe fallback (e.g., empty string or null) when missing; update callers or types accordingly so consumers handle the potential null/fallback.

**Suggestions:**
-   const { data: urlData } = (supabase as any)
    .storage
    .from("sketches")
    .getPublicUrl(storageData.path);

  if (!urlData?.publicUrl) {
    throw new Error("Failed to get public URL for uploaded illustration");
  }

  return urlData.publicUrl as string;

### 30. supabase/functions/process-sketch/index.original.ts

In @supabase/functions/process-sketch/index.original.ts around lines 639 - 657, The current flow logs deduction failures but still returns the processed image, enabling free generations; update the logic around the supabase profiles update (the optimistic-locking update using .eq("id", user.id) and .eq("credits", profile.credits)) in the processing function to retry the deduction (e.g., 2–3 attempts: re-read credits via supabase.from("profiles").select("credits").eq("id", user.id).single(), then attempt the same optimistic update) and only proceed to return success if a deduction succeeds, otherwise call logWithContext("error", ...) and trigger a reconciliation path (flag the user/job for async/manual review or enqueue a retry task) so failed deductions don’t allow free processing.

### 31. supabase/functions/process-sketch/index.ts

In @supabase/functions/process-sketch/index.ts around lines 162 - 163, The code currently uses non-null assertions on SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (e.g., where createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!) is called) which can crash at runtime; add the same runtime validation you use for OPENAI_API_KEY: check process.env.SUPABASE_URL and process.env.SUPABASE_SERVICE_ROLE_KEY before constructing the Supabase client, throw or return a clear error (or 500 response) if either is missing, and remove the non-null `!` assertions so the client is only created when both env vars are present.

### 32. src/hooks/useSketches.original.ts

In @src/hooks/useSketches.original.ts around lines 148 - 154, The retry setTimeout in useSketches is not tracked and may call setState after unmount; fix by adding a ref (e.g., retryTimeoutRef) to store the timeout ID where the retry is scheduled (the retry logic inside the fetch/retry function in useSketches), use clearTimeout(retryTimeoutRef.current) before assigning a new timeout, and ensure you clearTimeout(retryTimeoutRef.current) in the useEffect cleanup that currently unmounts the hook (the effect return where fetchSketches is cleaned up) so no timeout fires after the component unmounts.

### 33. supabase/functions/generate-story/story-service.ts

In @supabase/functions/generate-story/story-service.ts around lines 176 - 178, The code reads base64Data into a Uint8Array (`uint8`) and assigns `imageBytes = uint8.buffer`, which can expose the entire underlying ArrayBuffer; change this to use a sliced buffer to capture only the view's bytes (e.g., replace `imageBytes = uint8.buffer` with `imageBytes = uint8.slice().buffer` or use `uint8.buffer.slice(uint8.byteOffset, uint8.byteOffset + uint8.byteLength)`) so `imageBytes` contains only the intended bytes derived from `imageBase64OrUrl`.

**Suggestions:**
-     const base64Data = imageBase64OrUrl.split(",")[1];
    const uint8 = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
    imageBytes = uint8.buffer.slice(uint8.byteOffset, uint8.byteOffset + uint8.byteLength);

### 34. Git_Synchronization_Plan.md

In @Git_Synchronization_Plan.md around lines 40 - 44, The instruction to run "git push origin main" conflicts with the documented feature-branch + PR workflow and the policy that "main" is production-only; update the step so it follows the PR flow or explicitly permits direct docs commits: either replace the push with pushing the current feature branch (e.g., "git push origin <your-branch-name>") and add the follow-up to open a pull request for merging into main, or add a short policy sentence that authorizes direct documentation commits to main and keep "git push origin main" only if that exception is explicitly allowed.

### 35. supabase/functions/generate-story/story-service.ts

In @supabase/functions/generate-story/story-service.ts around lines 191 - 196, The raw-base64 branch currently assigns imageBytes = uint8.buffer which can be incorrect when the Uint8Array has a non-zero byteOffset; mirror the defensive fix used for the data-URI path by creating a copied ArrayBuffer view: after building uint8 via Uint8Array.from(atob(imageBase64OrUrl), ...), set imageBytes = uint8.buffer.slice(uint8.byteOffset, uint8.byteOffset + uint8.byteLength) (or otherwise copy the bytes into a new ArrayBuffer) so imageBytes contains the exact bytes for the image.

**Suggestions:**
-   } else {
    // Assume raw base64 (no data URI prefix)
    const uint8 = Uint8Array.from(atob(imageBase64OrUrl), (c) =>
      c.charCodeAt(0),
    );
    imageBytes = uint8.buffer.slice(uint8.byteOffset, uint8.byteOffset + uint8.byteLength);

### 36. src/hooks/useSketches.original.ts

In @src/hooks/useSketches.original.ts around lines 245 - 252, The INSERT branch of the realtime/subscription handler is incrementing newSketchCount unconditionally; update the INSERT case (the handler that receives newSketch/newRow) to first check that newSketch?.is_new === true (or Boolean(newSketch?.is_new)) before incrementing newSketchCount, and only increment when that condition passes; also guard against missing newSketch to avoid runtime errors.

### 37. supabase/functions/process-sketch/index.original.ts

In @supabase/functions/process-sketch/index.original.ts around lines 864 - 875, The response currently returns HTTP 200 even when generation fails (animatedImageUrl is falsy); update the response logic in the function that constructs the Response (the return block building JSON with animatedImageUrl, sketchId, success, usedFallback) so that if animatedImageUrl is empty you return a non-2xx status (e.g., 500 or 502) while keeping success: false and usedFallback: true; if animatedImageUrl is present return status 200 as before. Locate the Response creation near the end of the process handler (the block that returns JSON with animatedImageUrl and success) and change the status to conditionalStatus = animatedImageUrl ? 200 : 500 and use that when constructing the Response.

**Suggestions:**
-     return new Response(
      JSON.stringify({
        animatedImageUrl,
        sketchId,
        success: !!animatedImageUrl,
        usedFallback: true,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: animatedImageUrl ? 200 : 500,
      },
    );

### 38. src/hooks/useSketches.original.ts

In @src/hooks/useSketches.original.ts around lines 461 - 479, markSketchAsViewed currently always decrements newSketchCount on success which can make the count negative or inaccurate; modify markSketchAsViewed to check the sketch's is_new flag (sketch.is_new) before decrementing and only call setNewSketchCount(newSketchCount - 1) when is_new is true, also update the sketch's is_new state (e.g., setSketch or similar) to false after successful view and guard the decrement with Math.max(0, ...) to prevent negative counts.

### 39. supabase/functions/generate-story/index.ts

In @supabase/functions/generate-story/index.ts around lines 239 - 241, Replace any non-null assertions on environment variables (process.env.SOME_VAR!) used in this module with explicit runtime validation before they are used (e.g., at module init or at start of the handler that contains the "Verify sketch ownership" logic). Locate usages of process.env in this file (and any constants that initialize from them) and add checks that throw or return a clear error if a required variable is missing, then use the validated value onward; ensure the error message names the missing variable so logs indicate exactly which env var is unset.

### 40. Git_Synchronization_Plan.md

In @Git_Synchronization_Plan.md around lines 85 - 88, Replace the unsafe staging and inconsistent commit prefix: avoid using "git add ." in the plan and instead instruct interactive or explicit staging (e.g., use "git add -p" or list specific files) to prevent accidentally committing temp/IDE/sensitive files, and change the commit message prefix from "Fix:" to the lowercase "fix:" to match the project's commit message convention; update the two lines in the plan accordingly (the git staging instruction and the commit message string).

**Suggestions:**
- 

### 41. Architecture_Tracker.md

In @Architecture_Tracker.md at line 39, Replace the hardcoded admin email "diogo@diogoppedro.com" in the Architecture_Tracker.md entry with a role-based identifier (e.g., "Admin users with elevated privileges") or a reference to a secure configuration key (e.g., ADMIN_CONTACT or admin_role) so the documentation no longer exposes a personal email address.

### 42. src/screens/HomeScreen.tsx

In @src/screens/HomeScreen.tsx around lines 430 - 439, When a content policy violation causes the handler to return early, ensure the sketch's state is updated to a terminal status instead of leaving it as "processing"; before the early return add a call to the sketch status updater (e.g., updateSketchStatus or setSketchStatus) to mark the sketch as failed/policy_violation and persist that change so the Gallery no longer shows it as processing—locate the early-return in the same handler that references selectedPreset and isVideoPreset and invoke the existing status update function there with an appropriate error message/flag before returning.

### 43. Architecture_Tracker.md

In @Architecture_Tracker.md at line 291, Replace the hardcoded Supabase project ID string "uihnpebacpcndtkdizxd" in Architecture_Tracker.md with a redacted placeholder (e.g., <SUPABASE_PROJECT_ID> or [REDACTED]) or remove the line entirely; ensure any references that relied on that exact string (the mentioned "**Backend**: Supabase project (uihnpebacpcndtkdizxd)") are updated to use the placeholder and, if needed, add a short note explaining where to obtain the real ID for authorized internal users.

**Suggestions:**
- - **Backend**: Supabase project (managed hosting)

### 44. src/screens/HomeScreen.tsx

In @src/screens/HomeScreen.tsx around lines 220 - 270, pollStoryStatus lacks the session validation/refresh that pollVideoStatus performs and fails to surface a user-facing message when maxAttempts is reached in the catch block; update pollStoryStatus to call the same session-check/refresh routine used by pollVideoStatus before each poll attempt (reuse the session validation logic and any referenced helpers) and ensure on the catch branch where attempts >= maxAttempts you call stopPolling(), setIsProcessing(false), and display a toast (e.g., same “Still Generating” title/description used in the existing else-if) so users get feedback; keep references to pollStoryStatus, pollVideoStatus, stopPolling, setIsProcessing, toast, and maxAttempts to locate and modify the code.

**Suggestions:**
-       } catch (err) {
        console.warn("Story poll exception:", err);
        if (attempts >= maxAttempts) {
          stopPolling();
          setIsProcessing(false);
          toast({
            title: "Generation Timeout",
            description: "Generation is taking longer than expected. Check Gallery soon.",
            variant: "destructive",
          });
        }
      }


