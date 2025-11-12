-- Création du bucket pour les images de notifications
-- À exécuter dans Supabase SQL Editor

-- Créer le bucket pour les images de notifications
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'notification-images',
  'notification-images', 
  true,
  5242880, -- 5MB max
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
);

-- Policy pour permettre l'upload aux admins
CREATE POLICY "Admins can upload notification images" ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'notification-images' AND
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Policy pour permettre la lecture publique
CREATE POLICY "Public can view notification images" ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'notification-images');

-- Policy pour permettre la suppression aux admins
CREATE POLICY "Admins can delete notification images" ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'notification-images' AND
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);
