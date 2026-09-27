-- Allow video MIME types in the sketches storage bucket
-- If allowed_mime_types is NULL (unrestricted), leave it as NULL
-- If it's restricted to images, add video types
UPDATE storage.buckets
SET allowed_mime_types = CASE
  WHEN allowed_mime_types IS NULL THEN NULL
  ELSE array_cat(allowed_mime_types, ARRAY['video/mp4', 'video/webm'])
END
WHERE name = 'sketches';
