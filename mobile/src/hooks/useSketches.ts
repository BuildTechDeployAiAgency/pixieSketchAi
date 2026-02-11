import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/services/supabase';
import { useAuth } from '@/lib/AuthContext';
import type { Sketch, PresetOption } from '@/types';

export function useSketches() {
  const { user, credits, setCredits, refreshProfile } = useAuth();
  const [sketches, setSketches] = useState<Sketch[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch sketches
  const fetchSketches = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('sketches')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSketches((data as Sketch[]) || []);
    } catch (error) {
      console.error('Error fetching sketches:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSketches();
  }, [fetchSketches]);

  // Realtime subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('sketch-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sketches',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setSketches((prev) => [payload.new as Sketch, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setSketches((prev) =>
              prev.map((s) =>
                s.id === (payload.new as Sketch).id ? (payload.new as Sketch) : s
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setSketches((prev) =>
              prev.filter((s) => s.id !== (payload.old as Sketch).id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Create a new sketch
  const createSketch = async (
    name: string,
    originalImageUrl: string
  ): Promise<Sketch | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('sketches')
        .insert({
          user_id: user.id,
          name,
          original_image_url: originalImageUrl,
          status: 'processing',
          is_new: true,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Sketch;
    } catch (error) {
      console.error('Error creating sketch:', error);
      return null;
    }
  };

  // Process a sketch with AI transformation
  const processSketch = async (
    imageBase64: string,
    preset: PresetOption,
    fileName: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'Not authenticated' };
    if (credits <= 0)
      return { success: false, error: 'No credits available' };

    setIsProcessing(true);

    try {
      // Upload to Supabase storage
      const fileExt = fileName.split('.').pop() || 'jpg';
      const storageName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('sketches')
        .upload(storageName, decode(imageBase64), {
          contentType: `image/${fileExt}`,
        });

      if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

      const { data: { publicUrl } } = supabase.storage
        .from('sketches')
        .getPublicUrl(storageName);

      // Create sketch record
      const sketchName = `Drawing ${new Date().toLocaleDateString()}, ${new Date().toLocaleTimeString()}`;
      const sketch = await createSketch(sketchName, publicUrl);

      if (!sketch) throw new Error('Failed to create sketch record');

      // Call the Supabase edge function
      const { data: processData, error: processError } =
        await supabase.functions.invoke('process-sketch', {
          body: {
            imageData: imageBase64,
            preset,
            sketchId: sketch.id,
          },
        });

      if (processError) {
        await updateSketchStatus(sketch.id, 'failed');
        throw new Error(processError.message || 'Processing failed');
      }

      if (!processData?.success) {
        await updateSketchStatus(sketch.id, 'failed');
        throw new Error(processData?.error || 'Processing failed');
      }

      // Update sketch with result
      await updateSketchStatus(sketch.id, 'completed', processData.animatedImageUrl);

      // Refresh credits
      setCredits(Math.max(0, credits - 1));
      refreshProfile();

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    } finally {
      setIsProcessing(false);
    }
  };

  // Update sketch status
  const updateSketchStatus = async (
    id: string,
    status: string,
    animatedImageUrl?: string
  ) => {
    const updateData: Record<string, unknown> = { status };
    if (animatedImageUrl) {
      updateData.animated_image_url = animatedImageUrl;
    }
    if (status === 'completed') {
      updateData.is_new = true;
    }

    await supabase.from('sketches').update(updateData).eq('id', id);
  };

  // Delete a sketch
  const deleteSketch = async (id: string) => {
    try {
      const sketch = sketches.find((s) => s.id === id);

      // Delete from storage if exists
      if (sketch?.original_image_url) {
        const fileName = sketch.original_image_url.split('/').pop();
        if (fileName) {
          await supabase.storage.from('sketches').remove([fileName]);
        }
      }

      const { error } = await supabase.from('sketches').delete().eq('id', id);
      if (error) throw error;

      setSketches((prev) => prev.filter((s) => s.id !== id));
    } catch (error) {
      console.error('Error deleting sketch:', error);
    }
  };

  // Mark sketch as viewed
  const markAsViewed = async (id: string) => {
    await supabase.from('sketches').update({ is_new: false }).eq('id', id);
    setSketches((prev) =>
      prev.map((s) => (s.id === id ? { ...s, is_new: false } : s))
    );
  };

  // Retry failed sketch
  const retrySketch = async (id: string, preset: PresetOption) => {
    const sketch = sketches.find((s) => s.id === id);
    if (!sketch) return;

    await updateSketchStatus(id, 'processing');

    const { error: processError } = await supabase.functions.invoke(
      'process-sketch',
      {
        body: {
          sketchId: id,
          preset,
        },
      }
    );

    if (processError) {
      await updateSketchStatus(id, 'failed');
    }
  };

  const newSketchCount = sketches.filter((s) => s.is_new && s.status === 'completed').length;

  return {
    sketches,
    isLoading,
    isProcessing,
    newSketchCount,
    fetchSketches,
    createSketch,
    processSketch,
    deleteSketch,
    markAsViewed,
    retrySketch,
  };
}

// Helper to decode base64 to Uint8Array for storage upload
function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}
