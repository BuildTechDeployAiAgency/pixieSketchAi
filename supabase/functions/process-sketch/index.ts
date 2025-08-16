
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import "https://deno.land/x/xhr@0.1.0/mod.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const allowedOrigins = [
  'http://localhost:8080',
  'https://pixie-sketch-ai.vercel.app',
  'https://pixiesketch.com',
  'https://www.pixiesketch.com'
];

function getCorsHeaders(origin: string | null) {
  const allowedOrigin = origin && allowedOrigins.includes(origin) ? origin : null;
  
  return {
    'Access-Control-Allow-Origin': allowedOrigin || 'null',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Max-Age': '86400',
    'Access-Control-Allow-Credentials': 'true'
  };
}

// Rate limiting
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 5; // 5 requests per minute for expensive image generation
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute

const PRESET_PROMPTS = {
  cartoon: "Please convert the uploaded children's drawing into a clean, 2-D hand-drawn cartoon. Keep every line, shape, and character exactly where the child placed them, but redraw with smooth bold outlines, flat vibrant colors, and minimal shading. Preserve the whimsical imperfections so it still feels like a kid's artwork, just in polished Saturday-morning-cartoon style.",
  pixar: "Transform the uploaded children's drawing into a high-quality Pixar-style 3-D scene. Maintain the original layout, proportions, and color placement of every character and object. Rebuild them with soft rounded geometry, expressive Pixar eyes, gentle subsurface lighting, and a cheerful cinematic palette. Aim for a final render that looks like a frame from a modern Pixar short while clearly echoing the child's design.",
  realistic: "Bring the uploaded children's drawing to life in a semi-realistic storybook illustration. Keep the exact composition and whimsical shapes, but add believable textures, depth, and dynamic lighting. Use rich painterly brushstrokes and subtle gradients so the scene feels tangible and vibrant, yet retains the playful spirit and color blocking of the child's original art."
}

// Enhanced logging with timestamp and context
function logWithContext(level: string, message: string, context?: any) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${level.toUpperCase()}: ${message}`, context ? JSON.stringify(context, null, 2) : '');
}

// Utility function to reliably update sketch status with enhanced logging
async function updateSketchWithRetry(supabase: any, sketchId: string, status: string, animatedImageUrl?: string, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      logWithContext('info', `Attempt ${attempt}/${maxRetries}: Updating sketch ${sketchId}`, { status, hasAnimatedUrl: !!animatedImageUrl });
      
      const updateData: any = { 
        status,
        updated_at: new Date().toISOString()
      }
      
      if (animatedImageUrl) {
        updateData.animated_image_url = animatedImageUrl
      }

      const { data, error } = await supabase
        .from('sketches')
        .update(updateData)
        .eq('id', sketchId)
        .select()

      if (error) {
        logWithContext('error', `Database update error (attempt ${attempt})`, error);
        if (attempt === maxRetries) {
          throw error
        }
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
        continue
      }

      logWithContext('success', `Successfully updated sketch ${sketchId} on attempt ${attempt}`, data);
      return data
    } catch (error) {
      logWithContext('error', `Update attempt ${attempt} failed`, error);
      if (attempt === maxRetries) {
        throw error
      }
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
    }
  }
}

// Enhanced error handler with detailed logging
async function handleProcessingError(supabase: any, sketchId: string, error: any, stage: string) {
  logWithContext('error', `Processing failed at stage: ${stage}`, {
    sketchId,
    error: error.message || error,
    stack: error.stack
  });
  
  try {
    await updateSketchWithRetry(supabase, sketchId, 'failed');
  } catch (updateError) {
    logWithContext('error', 'Failed to update sketch status to failed', updateError);
  }
}

serve(async (req) => {
  const origin = req.headers.get('Origin');
  const corsHeaders = getCorsHeaders(origin);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  let sketchId = ''
  const requestStartTime = Date.now();
  
  try {
    // Verify authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      logWithContext('error', 'No authorization header provided');
      return new Response(
        JSON.stringify({ 
          error: 'Authentication required',
          success: false 
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: {
          Authorization: authHeader
        }
      }
    })

    // Verify the user's session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      logWithContext('error', 'Invalid authentication:', authError);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid authentication token',
          success: false 
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    logWithContext('info', 'Authenticated user:', { userId: user.id });

    // Check rate limit
    const now = Date.now();
    const userRateLimit = rateLimitMap.get(user.id) || { count: 0, resetTime: now + RATE_LIMIT_WINDOW };
    
    if (now > userRateLimit.resetTime) {
      // Reset the rate limit window
      userRateLimit.count = 0;
      userRateLimit.resetTime = now + RATE_LIMIT_WINDOW;
    }
    
    if (userRateLimit.count >= RATE_LIMIT) {
      const waitTime = Math.ceil((userRateLimit.resetTime - now) / 1000);
      logWithContext('error', `Rate limit exceeded for user ${user.id}`);
      return new Response(
        JSON.stringify({ 
          error: `Rate limit exceeded. Please wait ${waitTime} seconds before trying again.`,
          success: false,
          retryAfter: waitTime
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Retry-After': waitTime.toString() } }
      );
    }
    
    userRateLimit.count++;
    rateLimitMap.set(user.id, userRateLimit);

    const { imageData, preset, sketchId: requestSketchId } = await req.json()
    sketchId = requestSketchId
    
    logWithContext('info', '🎨 Processing sketch request started', {
      sketchId,
      preset,
      imageDataLength: imageData?.length,
      requestId: Math.random().toString(36).substr(2, 9)
    });

    // Enhanced input validation
    if (!imageData || !preset || !sketchId) {
      logWithContext('error', 'Missing required fields', { 
        hasImageData: !!imageData, 
        hasPreset: !!preset, 
        hasSketchId: !!sketchId 
      });
      return new Response(
        JSON.stringify({ 
          error: 'Missing required fields: imageData, preset, and sketchId are required',
          success: false 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Validate image data format and size
    if (typeof imageData !== 'string') {
      logWithContext('error', 'Invalid image data type', { type: typeof imageData });
      return new Response(
        JSON.stringify({ 
          error: 'Image data must be a base64 string',
          success: false 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Check if base64 string is valid and not too large (50MB limit = ~67MB base64)
    const base64SizeLimit = 67 * 1024 * 1024; // 67MB for base64 encoded 50MB file
    if (imageData.length > base64SizeLimit) {
      logWithContext('error', 'Image data too large', { size: imageData.length, limit: base64SizeLimit });
      return new Response(
        JSON.stringify({ 
          error: 'Image file too large. Maximum size is 50MB.',
          success: false 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 413 }
      )
    }

    // Validate base64 format
    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
    if (!base64Regex.test(imageData.replace(/\s/g, ''))) {
      logWithContext('error', 'Invalid base64 format');
      return new Response(
        JSON.stringify({ 
          error: 'Invalid image data format',
          success: false 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    if (!PRESET_PROMPTS[preset as keyof typeof PRESET_PROMPTS]) {
      logWithContext('error', 'Invalid preset provided', { preset, availablePresets: Object.keys(PRESET_PROMPTS) });
      return new Response(
        JSON.stringify({ 
          error: 'Invalid preset. Must be one of: cartoon, pixar, realistic',
          success: false 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openAIApiKey) {
      logWithContext('error', 'OpenAI API key not configured');
      await handleProcessingError(supabase, sketchId, new Error('OpenAI API key missing'), 'initialization');
      return new Response(
        JSON.stringify({ 
          error: 'OpenAI API key not configured',
          success: false 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // Check user credits before processing (but don't deduct yet)
    logWithContext('info', 'Checking user credits...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('credits')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      logWithContext('error', 'Failed to fetch user profile', profileError);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to fetch user profile',
          success: false 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    if (profile.credits <= 0) {
      logWithContext('error', 'Insufficient credits', { userId: user.id, credits: profile.credits });
      return new Response(
        JSON.stringify({ 
          error: 'Insufficient credits. Please purchase more credits to continue.',
          success: false 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 402 }
      );
    }

    // Check budget limits before processing
    logWithContext('info', 'Checking budget limits...');
    try {
      const { data: budgetCheck, error: budgetError } = await supabase
        .rpc('check_budget_limit', { credits_to_use: 1 });

      if (budgetError) {
        logWithContext('error', 'Budget check failed', budgetError);
        // Continue processing if budget check fails (don't block users for system issues)
      } else if (budgetCheck && !budgetCheck.allowed) {
        logWithContext('error', 'Budget limit exceeded', { 
          budgetCheck,
          userId: user.id,
          reason: budgetCheck.reason 
        });
        return new Response(
          JSON.stringify({ 
            error: 'Service temporarily unavailable due to budget limits. Please try again later.',
            success: false,
            code: 'BUDGET_LIMIT_EXCEEDED'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 503 }
        );
      } else if (budgetCheck) {
        logWithContext('info', 'Budget check passed', { 
          remaining: budgetCheck.remaining_credits,
          used: budgetCheck.used_credits,
          limit: budgetCheck.total_limit,
          approaching_limit: budgetCheck.approaching_limit
        });
        
        // Log warning if approaching budget limit
        if (budgetCheck.approaching_limit) {
          logWithContext('warning', 'Approaching budget limit', {
            remaining: budgetCheck.remaining_credits,
            alert_threshold: budgetCheck.alert_threshold
          });
        }
      }
    } catch (budgetCheckError) {
      logWithContext('error', 'Budget check exception', budgetCheckError);
      // Continue processing if budget check fails (don't block users for system issues)
    }

    logWithContext('info', 'User has sufficient credits', { 
      userId: user.id, 
      availableCredits: profile.credits
    });

    logWithContext('info', '🔘 Starting transformation', { preset });
    const presetPrompt = PRESET_PROMPTS[preset as keyof typeof PRESET_PROMPTS]
    logWithContext('debug', 'Using preset prompt', { preset, promptLength: presetPrompt.length });

    // Enhanced multimodal request payload
    const requestPayload = {
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `You are an AI artist assistant. Please analyze this drawing and then provide a detailed description for generating a transformed version. ${presetPrompt}. 

Please provide a comprehensive description that captures:
1. The main subject/character in the drawing
2. The setting and background elements  
3. The artistic style requested (${preset})
4. Specific visual details and composition

Your response should be a detailed visual description suitable for image generation, incorporating the transformation style requested.`
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/png;base64,${imageData}`,
                detail: 'high'
              }
            }
          ]
        }
      ],
      max_tokens: 500,
      temperature: 0.7
    }

    logWithContext('info', '🤖 Calling OpenAI Vision API...');

    // Call OpenAI Vision API to analyze and create transformation prompt
    const visionResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestPayload),
    })

    logWithContext('info', 'OpenAI Vision API response received', { 
      status: visionResponse.status,
      statusText: visionResponse.statusText 
    });
    
    if (!visionResponse.ok) {
      const errorText = await visionResponse.text()
      logWithContext('error', 'OpenAI Vision API error', { status: visionResponse.status, error: errorText });
      
      await handleProcessingError(supabase, sketchId, new Error(`Vision API error: ${errorText}`), 'vision_analysis');
      return await fallbackImageGeneration(openAIApiKey, presetPrompt, sketchId, supabase)
    }

    const visionData = await visionResponse.json()
    logWithContext('success', 'OpenAI Vision API analysis complete');

    if (!visionData.choices || !visionData.choices[0] || !visionData.choices[0].message) {
      logWithContext('error', 'Invalid vision response structure', visionData);
      await handleProcessingError(supabase, sketchId, new Error('Invalid vision response'), 'vision_parsing');
      return await fallbackImageGeneration(openAIApiKey, presetPrompt, sketchId, supabase)
    }

    const enhancedPrompt = visionData.choices[0].message.content
    logWithContext('info', '🎯 Enhanced prompt generated', { promptLength: enhancedPrompt.length });

    // Generate the image using the enhanced prompt
    logWithContext('info', '🖼️ Starting image generation...');
    const imageGenResponse = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: enhancedPrompt,
        n: 1,
        size: '1024x1024',
        quality: 'hd',
        response_format: 'b64_json'
      }),
    })

    logWithContext('info', 'Image generation API response received', { 
      status: imageGenResponse.status,
      statusText: imageGenResponse.statusText 
    });
    
    if (!imageGenResponse.ok) {
      const errorText = await imageGenResponse.text()
      logWithContext('error', 'Image generation API error', { status: imageGenResponse.status, error: errorText });
      await handleProcessingError(supabase, sketchId, new Error(`Image generation error: ${errorText}`), 'image_generation');
      
      return new Response(
        JSON.stringify({ 
          error: 'Failed to generate image', 
          details: errorText,
          success: false 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: imageGenResponse.status }
      )
    }

    const imageData_result = await imageGenResponse.json()
    logWithContext('success', 'Image generation completed');

    // Process the generated image
    let animatedImageUrl = ''
    
    if (imageData_result.data && imageData_result.data[0]) {
      if (imageData_result.data[0].b64_json) {
        animatedImageUrl = `data:image/png;base64,${imageData_result.data[0].b64_json}`
        logWithContext('info', 'Generated image processed as base64 data URL');
      } else if (imageData_result.data[0].url) {
        animatedImageUrl = imageData_result.data[0].url
        logWithContext('info', 'Generated image URL received');
      }
    }

    if (!animatedImageUrl) {
      logWithContext('error', 'No image URL or base64 data in response', imageData_result);
      await handleProcessingError(supabase, sketchId, new Error('No image generated'), 'image_processing');
      
      return new Response(
        JSON.stringify({ 
          error: 'No image generated in response',
          success: false 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // Update the database with the completed result
    logWithContext('info', '💾 Updating database with completed result...');
    await updateSketchWithRetry(supabase, sketchId, 'completed', animatedImageUrl)

    // IMPORTANT: Deduct credit ONLY after successful processing
    logWithContext('info', '💳 Deducting credit after successful processing...');
    const { error: deductError } = await supabase
      .from('profiles')
      .update({ credits: profile.credits - 1 })
      .eq('id', user.id)
      .eq('credits', profile.credits); // Optimistic locking to prevent race conditions

    if (deductError) {
      logWithContext('error', 'Failed to deduct credit after processing', deductError);
      // Note: Processing was successful, so we still return success but log the credit error
    } else {
      logWithContext('info', 'Credit deducted successfully after processing', { 
        userId: user.id, 
        previousCredits: profile.credits, 
        newCredits: profile.credits - 1 
      });

      // Log credit usage for budget tracking
      try {
        const { error: budgetLogError } = await supabase
          .rpc('log_credit_usage', {
            p_user_id: user.id,
            p_credits_used: 1,
            p_operation_type: 'sketch_generation',
            p_sketch_id: sketchId
          });

        if (budgetLogError) {
          logWithContext('error', 'Failed to log credit usage for budget tracking', budgetLogError);
        } else {
          logWithContext('info', 'Credit usage logged for budget tracking', { 
            userId: user.id, 
            sketchId: sketchId,
            creditsUsed: 1
          });
        }
      } catch (budgetLogException) {
        logWithContext('error', 'Budget logging exception', budgetLogException);
      }
    }

    const processingTime = Date.now() - requestStartTime;
    logWithContext('success', '🎉 Successfully processed sketch', {
      sketchId,
      processingTimeMs: processingTime,
      enhancedPromptLength: enhancedPrompt.length
    });
    
    return new Response(
      JSON.stringify({ 
        animatedImageUrl,
        sketchId,
        success: true,
        processingTimeMs: processingTime,
        enhancedPrompt: enhancedPrompt.substring(0, 100) + '...'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    const processingTime = Date.now() - requestStartTime;
    logWithContext('error', '💥 Error in process-sketch function', {
      error: error.message,
      stack: error.stack,
      processingTimeMs: processingTime,
      sketchId
    });
    
    // Try to update sketch status to failed and refund credit if we have the sketchId
    if (sketchId) {
      try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        const supabase = createClient(supabaseUrl, supabaseKey)
        
        // Update sketch status to failed
        await updateSketchWithRetry(supabase, sketchId, 'failed')
        
        // No need to refund credit since we now deduct AFTER successful processing
        logWithContext('info', 'Processing failed but no credit was deducted (credits only deducted after success)');
      } catch (updateError) {
        logWithContext('error', 'Failed to update sketch status or refund credit', updateError);
      }
    }
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message,
        success: false,
        processingTimeMs: processingTime
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 500 
      }
    )
  }
})

// Enhanced fallback function with better logging
async function fallbackImageGeneration(openAIApiKey: string, prompt: string, sketchId: string, supabase: any) {
  logWithContext('info', '🔄 Using fallback image generation');
  
  try {
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: prompt,
        n: 1,
        size: '1024x1024',
        quality: 'hd',
        response_format: 'b64_json'
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      logWithContext('error', 'Fallback generation failed', { status: response.status, error: errorText });
      await updateSketchWithRetry(supabase, sketchId, 'failed')
      
      return new Response(
        JSON.stringify({ 
          error: 'Both primary and fallback generation failed', 
          details: errorText,
          success: false 
        }),
        { headers: { ...getCorsHeaders(null), 'Content-Type': 'application/json' }, status: response.status }
      )
    }

    const data = await response.json()
    let animatedImageUrl = ''
    
    if (data.data && data.data[0]) {
      if (data.data[0].b64_json) {
        animatedImageUrl = `data:image/png;base64,${data.data[0].b64_json}`
      } else if (data.data[0].url) {
        animatedImageUrl = data.data[0].url
      }
    }

    if (animatedImageUrl) {
      await updateSketchWithRetry(supabase, sketchId, 'completed', animatedImageUrl)
      
      // Deduct credit after successful fallback generation
      logWithContext('info', '💳 Deducting credit after successful fallback generation...');
      const authHeader = req.headers.get('Authorization');
      if (authHeader) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: currentProfile } = await supabase
            .from('profiles')
            .select('credits')
            .eq('id', user.id)
            .single();
          
          if (currentProfile && currentProfile.credits > 0) {
            await supabase
              .from('profiles')
              .update({ credits: currentProfile.credits - 1 })
              .eq('id', user.id)
              .eq('credits', currentProfile.credits);
            
            logWithContext('info', 'Credit deducted after fallback success');
          }
        }
      }
      
      logWithContext('success', 'Fallback generation successful');
    } else {
      await updateSketchWithRetry(supabase, sketchId, 'failed')
      logWithContext('error', 'Fallback generation failed - no image URL');
    }
    
    return new Response(
      JSON.stringify({ 
        animatedImageUrl,
        sketchId,
        success: !!animatedImageUrl,
        usedFallback: true
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error) {
    logWithContext('error', 'Fallback generation exception', error);
    await updateSketchWithRetry(supabase, sketchId, 'failed')
    
    return new Response(
      JSON.stringify({ 
        error: 'Fallback generation failed', 
        details: error.message,
        success: false 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
}
