-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for jobs table to keep updated_at current
CREATE TRIGGER update_jobs_updated_at 
    BEFORE UPDATE ON jobs 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for decks table to keep updated_at current
CREATE TRIGGER update_decks_updated_at 
    BEFORE UPDATE ON decks 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for cards table to keep updated_at current
CREATE TRIGGER update_cards_updated_at 
    BEFORE UPDATE ON cards 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically create jobs when files are ingested
CREATE OR REPLACE FUNCTION create_ingest_job()
RETURNS TRIGGER AS $$
DECLARE
    job_type TEXT;
BEGIN
    -- Determine job type based on MIME type
    CASE 
        WHEN NEW.mime_type LIKE 'image/%' THEN
            job_type := 'ingest_image';
        WHEN NEW.mime_type LIKE 'video/%' THEN
            job_type := 'ingest_video';
        WHEN NEW.mime_type = 'application/pdf' THEN
            job_type := 'ingest_pdf';
        ELSE
            -- Unknown type, don't create job
            RETURN NEW;
    END CASE;

    -- Insert job
    INSERT INTO jobs (type, status, input, created_by)
    VALUES (
        job_type,
        'queued',
        jsonb_build_object(
            'ingest_file_id', NEW.id,
            'storage_path', NEW.storage_path,
            'mime_type', NEW.mime_type,
            'meta', NEW.meta
        ),
        NEW.owner
    );

    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to create jobs when files are inserted into ingest_files
CREATE TRIGGER create_ingest_job_trigger
    AFTER INSERT ON ingest_files
    FOR EACH ROW
    EXECUTE FUNCTION create_ingest_job();

-- Function to create user profile on auth.users insert
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO users (id, username, display_name, email)
    VALUES (
        NEW.id,
        NEW.raw_user_meta_data->>'username',
        COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name'),
        NEW.email
    );
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to create user profile when new user signs up
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- Function to maintain materialized paths for hierarchical tables
CREATE OR REPLACE FUNCTION update_subject_path()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.parent_id IS NULL THEN
        NEW.path := '/' || NEW.id::text || '/';
    ELSE
        NEW.path := (
            SELECT path FROM subjects WHERE id = NEW.parent_id
        ) || NEW.id::text || '/';
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION update_topic_path()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.parent_id IS NULL THEN
        NEW.path := '/' || NEW.id::text || '/';
    ELSE
        NEW.path := (
            SELECT path FROM topics WHERE id = NEW.parent_id
        ) || NEW.id::text || '/';
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for maintaining materialized paths
CREATE TRIGGER update_subject_path_trigger
    BEFORE INSERT OR UPDATE ON subjects
    FOR EACH ROW
    EXECUTE FUNCTION update_subject_path();

CREATE TRIGGER update_topic_path_trigger
    BEFORE INSERT OR UPDATE ON topics
    FOR EACH ROW
    EXECUTE FUNCTION update_topic_path();

-- Function to validate quiz attempt completion
CREATE OR REPLACE FUNCTION validate_quiz_attempt_submission()
RETURNS TRIGGER AS $$
DECLARE
    quiz_item_count INTEGER;
    answer_count INTEGER;
    total_score NUMERIC := 0;
    correct_count INTEGER := 0;
BEGIN
    -- Only validate on submission (when submitted_at is set)
    IF NEW.submitted_at IS NOT NULL AND OLD.submitted_at IS NULL THEN
        -- Count total quiz items
        SELECT COUNT(*) INTO quiz_item_count
        FROM quiz_items 
        WHERE quiz_id = NEW.quiz_id;

        -- Count answers provided
        SELECT COUNT(*) INTO answer_count
        FROM quiz_attempt_answers
        WHERE attempt_id = NEW.id;

        -- Calculate score if all items answered
        IF answer_count = quiz_item_count THEN
            SELECT 
                COALESCE(SUM(score_awarded), 0),
                COUNT(CASE WHEN is_correct THEN 1 END)
            INTO total_score, correct_count
            FROM quiz_attempt_answers
            WHERE attempt_id = NEW.id;

            NEW.score_raw := total_score;
            NEW.score_pct := CASE 
                WHEN quiz_item_count > 0 THEN (total_score::NUMERIC / quiz_item_count::NUMERIC) * 100
                ELSE 0
            END;
            NEW.passed := NEW.score_pct >= 70; -- 70% passing threshold
        END IF;
    END IF;

    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to validate quiz completion
CREATE TRIGGER validate_quiz_attempt_submission_trigger
    BEFORE UPDATE ON quiz_attempts
    FOR EACH ROW
    EXECUTE FUNCTION validate_quiz_attempt_submission();
