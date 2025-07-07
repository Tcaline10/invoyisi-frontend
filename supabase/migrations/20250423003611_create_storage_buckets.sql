-- Create storage buckets for the application

-- Create avatars bucket for user profile pictures
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  2097152, -- 2MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 2097152,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']::text[];

-- Create company_logos bucket for company logos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'company_logos',
  'company_logos',
  true,
  2097152, -- 2MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 2097152,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']::text[];

-- Create invoices bucket for invoice PDFs and attachments
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'invoices',
  'invoices',
  false, -- private
  10485760, -- 10MB
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['application/pdf', 'image/jpeg', 'image/png', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']::text[];

-- Create a policy to allow authenticated users to upload their own avatars
CREATE POLICY "Users can upload their own avatars"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Create a policy to allow authenticated users to read any avatar
CREATE POLICY "Anyone can view avatars"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'avatars');

-- Create a policy to allow authenticated users to upload their own company logos
CREATE POLICY "Users can upload their own company logos"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'company_logos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Create a policy to allow authenticated users to read any company logo
CREATE POLICY "Anyone can view company logos"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'company_logos');

-- Create a policy to allow authenticated users to upload their own invoice files
CREATE POLICY "Users can upload their own invoice files"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'invoices' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Create a policy to allow authenticated users to read only their own invoice files
CREATE POLICY "Users can view their own invoice files"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'invoices' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );
