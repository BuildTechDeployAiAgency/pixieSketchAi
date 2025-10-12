# PixieSketch AI - Image Generation Debugging Plan

## Overview

This document outlines a systematic approach to diagnose and fix the image generation errors in PixieSketch AI based on the findings from the architecture analysis.

## Priority 1: Critical Infrastructure Checks

### 1.1 OpenAI API Configuration

**Issue**: Missing or invalid OpenAI API key in Supabase environment

**Debugging Steps**:

1. Check Supabase Edge Function environment variables
   ```bash
   # In Supabase Dashboard
   # Go to Project Settings > Edge Functions
   # Verify OPENAI_API_KEY is set and valid
   ```
2. Test OpenAI API key validity

   - Create a simple test function to verify API key
   - Check if the key has sufficient credits
   - Verify the key has DALL-E 3 access enabled

3. Check OpenAI API usage limits
   - Verify current usage against rate limits
   - Check if quota is exceeded
   - Review billing status

**Expected Outcome**: Confirm OpenAI API is properly configured and accessible

### 1.2 Supabase Connection & Authentication

**Issue**: Potential connection issues between frontend and Supabase

**Debugging Steps**:

1. Verify Supabase configuration in frontend

   - Check `.env.local` for correct VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
   - Test basic Supabase connection from frontend
   - Verify authentication flow is working

2. Check Edge Function deployment

   - Verify all Edge Functions are deployed correctly
   - Test Edge Function health endpoints
   - Check function logs for errors

3. Test CORS configuration
   - Verify allowed origins in `supabase/functions/_shared/cors.ts`
   - Test preflight requests
   - Check if production domain is properly configured

**Expected Outcome**: Confirm all Supabase connections are working properly

### 1.3 Storage Bucket Configuration

**Issue**: Storage bucket permissions or existence issues

**Debugging Steps**:

1. Verify "sketches" bucket exists

   ```sql
   -- Run in Supabase SQL Editor
   SELECT * FROM storage.buckets WHERE name = 'sketches';
   ```

2. Check RLS policies for storage

   ```sql
   -- Check storage policies
   SELECT * FROM storage.policies WHERE bucket_id = 'sketches';
   ```

3. Test file upload permissions
   - Try uploading a test file directly
   - Check if public URLs are accessible
   - Verify file size limits

**Expected Outcome**: Confirm storage bucket is properly configured and accessible

## Priority 2: Image Processing Pipeline Checks

### 2.1 Base64 Image Processing

**Issue**: Invalid base64 encoding or format issues

**Debugging Steps**:

1. Add logging to track image processing steps

   - Log original file size
   - Log base64 encoded size
   - Log image format detection

2. Test with different image formats

   - PNG, JPEG, WebP
   - Various file sizes (small, medium, large)
   - Different aspect ratios

3. Implement image validation
   - Add format validation before encoding
   - Add size checks at multiple stages
   - Implement image corruption detection

**Expected Outcome**: Identify if image format/size is causing issues

### 2.2 OpenAI Vision API Integration

**Issue**: Failures in Vision API calls

**Debugging Steps**:

1. Add detailed logging to `openai-service.ts`

   - Log request payloads
   - Log response status and headers
   - Log specific error messages

2. Test Vision API directly

   - Create isolated test function
   - Test with known good images
   - Test with different prompts

3. Check timeout settings
   - Verify Edge Function timeout limits
   - Implement retry logic with exponential backoff
   - Add timeout handling

**Expected Outcome**: Isolate Vision API issues and implement proper error handling

### 2.3 DALL-E 3 Image Generation

**Issue**: Failures in image generation step

**Debugging Steps**:

1. Test prompt generation

   - Log enhanced prompts
   - Test prompts manually in OpenAI playground
   - Check for prompt length issues

2. Verify DALL-E 3 parameters

   - Check model availability
   - Verify quality settings
   - Test different size options

3. Implement fallback mechanism
   - Test current fallback implementation
   - Add alternative generation methods
   - Implement graceful degradation

**Expected Outcome**: Ensure reliable image generation with proper fallbacks

## Priority 3: System Integration Checks

### 3.1 Credit System Validation

**Issue**: Race conditions or credit handling errors

**Debugging Steps**:

1. Audit credit deduction flow

   - Check transaction handling
   - Verify credit check timing
   - Test concurrent requests

2. Implement credit logging

   - Log all credit transactions
   - Track failed deductions
   - Monitor credit balance changes

3. Test edge cases
   - Zero credit scenarios
   - Negative credit prevention
   - Concurrent credit usage

**Expected Outcome**: Ensure credit system works reliably

### 3.2 Real-time Subscription Issues

**Issue**: WebSocket connection problems

**Debugging Steps**:

1. Test subscription connections

   - Monitor connection stability
   - Check reconnection logic
   - Verify subscription cleanup

2. Add connection monitoring

   - Implement heartbeat checks
   - Add connection status indicators
   - Log connection events

3. Test subscription updates
   - Verify status updates propagate
   - Test multiple simultaneous updates
   - Check subscription filtering

**Expected Outcome**: Ensure real-time updates work reliably

## Implementation Strategy

### Phase 1: Immediate Fixes (1-2 days)

1. Add comprehensive logging to all Edge Functions
2. Verify OpenAI API configuration
3. Test basic image upload flow
4. Implement error reporting dashboard

### Phase 2: Core Fixes (3-5 days)

1. Fix identified OpenAI integration issues
2. Implement proper error handling and retries
3. Add image validation and preprocessing
4. Fix credit system race conditions

### Phase 3: Enhancement (1-2 weeks)

1. Add monitoring and alerting
2. Implement performance optimizations
3. Add comprehensive test suite
4. Document troubleshooting procedures

## Testing Plan

### Unit Tests

- Test all Edge Functions independently
- Test image processing pipeline
- Test credit system logic
- Test error handling paths

### Integration Tests

- Test complete image generation flow
- Test payment integration
- Test real-time updates
- Test error scenarios

### End-to-End Tests

- Test user journey from upload to completion
- Test multiple concurrent users
- Test failure recovery
- Test performance under load

## Monitoring & Alerting

### Key Metrics to Track

1. Image generation success rate
2. Processing time per image
3. OpenAI API usage and errors
4. Credit transaction success rate
5. Real-time subscription health

### Alert Thresholds

- Image generation failure rate > 10%
- Processing time > 5 minutes
- OpenAI API error rate > 5%
- Credit transaction failures
- WebSocket connection drops

## Rollout Plan

### Staging Environment

1. Deploy fixes to staging first
2. Test with production-like data
3. Verify all fixes work as expected
4. Get stakeholder approval

### Production Rollout

1. Deploy during low-traffic period
2. Monitor all metrics closely
3. Have rollback plan ready
4. Communicate with stakeholders

## GitHub Synchronization Steps

### Pre-Deployment

1. Commit all changes with descriptive messages
2. Create feature branches for major fixes
3. Ensure all tests pass
4. Update documentation

### Deployment

1. Create pull requests for review
2. Get code review and approval
3. Merge to main branch
4. Deploy through CI/CD pipeline

### Post-Deployment

1. Monitor deployment health
2. Fix any issues quickly
3. Update documentation
4. Communicate resolution to stakeholders

## Success Criteria

1. Image generation success rate > 95%
2. Processing time < 3 minutes average
3. Zero credit system errors
4. Stable real-time updates
5. Comprehensive error logging
6. All tests passing
7. Documentation updated

## Contingency Plans

### If OpenAI API Issues Persist

1. Implement alternative AI providers
2. Add queue system for processing
3. Implement manual processing option
4. Communicate transparently with users

### If Performance Issues Continue

1. Implement caching strategies
2. Optimize image processing
3. Scale infrastructure as needed
4. Implement rate limiting for users

## Next Steps

1. Execute Priority 1 checks immediately
2. Implement logging and monitoring
3. Fix identified issues systematically
4. Test thoroughly at each step
5. Deploy and monitor closely
6. Document all changes
7. Share results with team
