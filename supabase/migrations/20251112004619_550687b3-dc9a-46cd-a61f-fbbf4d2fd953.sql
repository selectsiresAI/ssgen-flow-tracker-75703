-- Create storage bucket for order result files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('order-results', 'order-results', false)
ON CONFLICT (id) DO NOTHING;

-- Allow admins to upload files
CREATE POLICY "Admins can upload order result files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'order-results' AND
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'ADM'
  )
);

-- Allow admins to update files
CREATE POLICY "Admins can update order result files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'order-results' AND
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'ADM'
  )
);

-- Allow admins to delete files
CREATE POLICY "Admins can delete order result files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'order-results' AND
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'ADM'
  )
);

-- Allow all authenticated users to download files
CREATE POLICY "Authenticated users can download order result files"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'order-results');

-- Add column to track result file in service_orders table
ALTER TABLE public.service_orders
ADD COLUMN IF NOT EXISTS result_file_path TEXT;

-- Add comment to explain the column
COMMENT ON COLUMN public.service_orders.result_file_path IS 'Path to the uploaded result file in storage';