-- Storage buckets setup
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    ('media', 'media', false, 52428800, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm', 'application/pdf']),
    ('derived', 'derived', false, 104857600, ARRAY['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'application/pdf']),
    ('ingest', 'ingest', false, 104857600, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm', 'application/pdf', 'text/plain', 'application/json'])
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE grade_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE standards ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE deck_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE deck_grade_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE deck_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE deck_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE deck_standards ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_standards ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_blueprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempt_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingest_files ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Subjects, topics, grade_levels, standards, tags policies (public read, admin write)
CREATE POLICY "Anyone can view subjects" ON subjects
    FOR SELECT USING (true);

CREATE POLICY "Anyone can view topics" ON topics
    FOR SELECT USING (true);

CREATE POLICY "Anyone can view grade_levels" ON grade_levels
    FOR SELECT USING (true);

CREATE POLICY "Anyone can view standards" ON standards
    FOR SELECT USING (true);

CREATE POLICY "Anyone can view tags" ON tags
    FOR SELECT USING (true);

-- Media assets policies
CREATE POLICY "Users can view media assets they own" ON media_assets
    FOR SELECT USING (auth.uid() = owner);

CREATE POLICY "Users can view media assets from public decks" ON media_assets
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM decks d
            JOIN card_media cm ON d.id = cm.card_id
            WHERE cm.media_asset_id = media_assets.id 
            AND d.visibility = 'public'
        )
    );

CREATE POLICY "Users can insert media assets they own" ON media_assets
    FOR INSERT WITH CHECK (auth.uid() = owner);

CREATE POLICY "Users can update media assets they own" ON media_assets
    FOR UPDATE USING (auth.uid() = owner);

CREATE POLICY "Users can delete media assets they own" ON media_assets
    FOR DELETE USING (auth.uid() = owner);

-- Decks policies
CREATE POLICY "Users can view their own decks" ON decks
    FOR SELECT USING (auth.uid() = owner);

CREATE POLICY "Anyone can view public decks" ON decks
    FOR SELECT USING (visibility = 'public');

CREATE POLICY "Users can insert decks they own" ON decks
    FOR INSERT WITH CHECK (auth.uid() = owner);

CREATE POLICY "Users can update decks they own" ON decks
    FOR UPDATE USING (auth.uid() = owner);

CREATE POLICY "Users can delete decks they own" ON decks
    FOR DELETE USING (auth.uid() = owner);

-- Deck relationship policies
CREATE POLICY "Users can view deck relationships for visible decks" ON deck_subjects
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM decks d 
            WHERE d.id = deck_subjects.deck_id 
            AND (d.owner = auth.uid() OR d.visibility = 'public')
        )
    );

CREATE POLICY "Users can manage deck relationships for their decks" ON deck_subjects
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM decks d 
            WHERE d.id = deck_subjects.deck_id 
            AND d.owner = auth.uid()
        )
    );

CREATE POLICY "Users can view deck grade level relationships for visible decks" ON deck_grade_levels
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM decks d 
            WHERE d.id = deck_grade_levels.deck_id 
            AND (d.owner = auth.uid() OR d.visibility = 'public')
        )
    );

CREATE POLICY "Users can manage deck grade level relationships for their decks" ON deck_grade_levels
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM decks d 
            WHERE d.id = deck_grade_levels.deck_id 
            AND d.owner = auth.uid()
        )
    );

CREATE POLICY "Users can view deck topic relationships for visible decks" ON deck_topics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM decks d 
            WHERE d.id = deck_topics.deck_id 
            AND (d.owner = auth.uid() OR d.visibility = 'public')
        )
    );

CREATE POLICY "Users can manage deck topic relationships for their decks" ON deck_topics
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM decks d 
            WHERE d.id = deck_topics.deck_id 
            AND d.owner = auth.uid()
        )
    );

CREATE POLICY "Users can view deck tag relationships for visible decks" ON deck_tags
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM decks d 
            WHERE d.id = deck_tags.deck_id 
            AND (d.owner = auth.uid() OR d.visibility = 'public')
        )
    );

CREATE POLICY "Users can manage deck tag relationships for their decks" ON deck_tags
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM decks d 
            WHERE d.id = deck_tags.deck_id 
            AND d.owner = auth.uid()
        )
    );

CREATE POLICY "Users can view deck standard relationships for visible decks" ON deck_standards
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM decks d 
            WHERE d.id = deck_standards.deck_id 
            AND (d.owner = auth.uid() OR d.visibility = 'public')
        )
    );

CREATE POLICY "Users can manage deck standard relationships for their decks" ON deck_standards
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM decks d 
            WHERE d.id = deck_standards.deck_id 
            AND d.owner = auth.uid()
        )
    );

-- Cards policies
CREATE POLICY "Users can view cards from their decks" ON cards
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM decks d 
            WHERE d.id = cards.deck_id 
            AND d.owner = auth.uid()
        )
    );

CREATE POLICY "Anyone can view cards from public decks" ON cards
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM decks d 
            WHERE d.id = cards.deck_id 
            AND d.visibility = 'public'
        )
    );

CREATE POLICY "Users can insert cards into their decks" ON cards
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM decks d 
            WHERE d.id = cards.deck_id 
            AND d.owner = auth.uid()
        )
    );

CREATE POLICY "Users can update cards in their decks" ON cards
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM decks d 
            WHERE d.id = cards.deck_id 
            AND d.owner = auth.uid()
        )
    );

CREATE POLICY "Users can delete cards from their decks" ON cards
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM decks d 
            WHERE d.id = cards.deck_id 
            AND d.owner = auth.uid()
        )
    );

-- Card relationship policies
CREATE POLICY "Users can view card relationships for accessible cards" ON card_media
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM cards c
            JOIN decks d ON d.id = c.deck_id
            WHERE c.id = card_media.card_id 
            AND (d.owner = auth.uid() OR d.visibility = 'public')
        )
    );

CREATE POLICY "Users can manage card relationships for their cards" ON card_media
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM cards c
            JOIN decks d ON d.id = c.deck_id
            WHERE c.id = card_media.card_id 
            AND d.owner = auth.uid()
        )
    );

CREATE POLICY "Users can view card topic relationships for accessible cards" ON card_topics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM cards c
            JOIN decks d ON d.id = c.deck_id
            WHERE c.id = card_topics.card_id 
            AND (d.owner = auth.uid() OR d.visibility = 'public')
        )
    );

CREATE POLICY "Users can manage card topic relationships for their cards" ON card_topics
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM cards c
            JOIN decks d ON d.id = c.deck_id
            WHERE c.id = card_topics.card_id 
            AND d.owner = auth.uid()
        )
    );

CREATE POLICY "Users can view card tag relationships for accessible cards" ON card_tags
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM cards c
            JOIN decks d ON d.id = c.deck_id
            WHERE c.id = card_tags.card_id 
            AND (d.owner = auth.uid() OR d.visibility = 'public')
        )
    );

CREATE POLICY "Users can manage card tag relationships for their cards" ON card_tags
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM cards c
            JOIN decks d ON d.id = c.deck_id
            WHERE c.id = card_tags.card_id 
            AND d.owner = auth.uid()
        )
    );

CREATE POLICY "Users can view card standard relationships for accessible cards" ON card_standards
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM cards c
            JOIN decks d ON d.id = c.deck_id
            WHERE c.id = card_standards.card_id 
            AND (d.owner = auth.uid() OR d.visibility = 'public')
        )
    );

CREATE POLICY "Users can manage card standard relationships for their cards" ON card_standards
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM cards c
            JOIN decks d ON d.id = c.deck_id
            WHERE c.id = card_standards.card_id 
            AND d.owner = auth.uid()
        )
    );

-- Card regions policies
CREATE POLICY "Users can view card regions for accessible cards" ON card_regions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM cards c
            JOIN decks d ON d.id = c.deck_id
            WHERE c.id = card_regions.card_id 
            AND (d.owner = auth.uid() OR d.visibility = 'public')
        )
    );

CREATE POLICY "Users can manage card regions for their cards" ON card_regions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM cards c
            JOIN decks d ON d.id = c.deck_id
            WHERE c.id = card_regions.card_id 
            AND d.owner = auth.uid()
        )
    );

-- Quiz policies
CREATE POLICY "Users can view their own quiz blueprints" ON quiz_blueprints
    FOR SELECT USING (auth.uid() = owner);

CREATE POLICY "Users can manage their own quiz blueprints" ON quiz_blueprints
    FOR ALL USING (auth.uid() = owner);

CREATE POLICY "Users can view their own quizzes" ON quizzes
    FOR SELECT USING (auth.uid() = owner);

CREATE POLICY "Users can manage their own quizzes" ON quizzes
    FOR ALL USING (auth.uid() = owner);

CREATE POLICY "Users can view quiz items for their quizzes" ON quiz_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM quizzes q 
            WHERE q.id = quiz_items.quiz_id 
            AND q.owner = auth.uid()
        )
    );

CREATE POLICY "Users can manage quiz items for their quizzes" ON quiz_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM quizzes q 
            WHERE q.id = quiz_items.quiz_id 
            AND q.owner = auth.uid()
        )
    );

CREATE POLICY "Users can view their own quiz attempts" ON quiz_attempts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create quiz attempts" ON quiz_attempts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own quiz attempts" ON quiz_attempts
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view quiz attempt answers for their attempts" ON quiz_attempt_answers
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM quiz_attempts qa 
            WHERE qa.id = quiz_attempt_answers.attempt_id 
            AND qa.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage quiz attempt answers for their attempts" ON quiz_attempt_answers
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM quiz_attempts qa 
            WHERE qa.id = quiz_attempt_answers.attempt_id 
            AND qa.user_id = auth.uid()
        )
    );

-- Jobs policies (service role and creator only)
CREATE POLICY "Users can view their own jobs" ON jobs
    FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "Users can create jobs" ON jobs
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Service role can manage all jobs" ON jobs
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Ingest files policies
CREATE POLICY "Users can view their own ingest files" ON ingest_files
    FOR SELECT USING (auth.uid() = owner);

CREATE POLICY "Users can insert their own ingest files" ON ingest_files
    FOR INSERT WITH CHECK (auth.uid() = owner);

CREATE POLICY "Users can update their own ingest files" ON ingest_files
    FOR UPDATE USING (auth.uid() = owner);

CREATE POLICY "Users can delete their own ingest files" ON ingest_files
    FOR DELETE USING (auth.uid() = owner);

-- Storage bucket policies


  -- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload to media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'media');

-- Allow authenticated users to read files
CREATE POLICY "Authenticated users can read from media"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'media');

-- Optional: Allow users to update only their own uploads
CREATE POLICY "Users can update own files from media"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'media' AND auth.uid()::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'media' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Optional: Allow users to delete only their own files
CREATE POLICY "Users can delete own files from media"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'media' AND auth.uid()::text = (storage.foldername(name))[1]);

  -- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload to ingest"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'ingest');

  -- Allow authenticated users to read files
CREATE POLICY "Authenticated users can read from ingest"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'ingest');

-- Optional: Allow users to update only their own uploads
CREATE POLICY "Users can update own files from ingest"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'ingest' AND auth.uid()::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'ingest' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Optional: Allow users to delete only their own files
CREATE POLICY "Users can delete own files from ingest"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'ingest' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Media bucket: Public read for public deck media" ON storage.objects
FOR SELECT USING (
                   bucket_id = 'media'
                   AND EXISTS (
                   SELECT 1 FROM media_assets ma
                   JOIN card_media cm ON ma.id = cm.media_asset_id
                   JOIN cards c ON cm.card_id = c.id
                   JOIN decks d ON c.deck_id = d.id
                   WHERE ma.storage_path = name
                   AND d.visibility = 'public'
                   )
               );

CREATE POLICY "Derived bucket: Service role can manage all files" ON storage.objects
    FOR ALL USING (
        bucket_id = 'derived'
        AND auth.jwt() ->> 'role' = 'service_role'
    );