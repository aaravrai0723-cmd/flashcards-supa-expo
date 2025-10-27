-- Enable Postgres extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "pg_cron";
CREATE EXTENSION IF NOT EXISTS "http";

-- Core tables for flashcards MVP

-- Users table (extends auth.users)
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    username TEXT UNIQUE,
    display_name TEXT,
    email TEXT,
    avatar_url TEXT,
    timezone TEXT DEFAULT 'UTC',
    language_preference TEXT DEFAULT 'en'
);

-- Subjects (hierarchical taxonomy)
CREATE TABLE subjects (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    parent_id BIGINT REFERENCES subjects(id) ON DELETE CASCADE,
    path TEXT NOT NULL, -- materialized path like '/1/2/3'
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Topics (within subjects, hierarchical)
CREATE TABLE topics (
    id BIGSERIAL PRIMARY KEY,
    subject_id BIGINT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    parent_id BIGINT REFERENCES topics(id) ON DELETE CASCADE,
    path TEXT NOT NULL, -- materialized path like '/1/2/3'
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Grade levels (hierarchical)
CREATE TABLE grade_levels (
    id BIGSERIAL PRIMARY KEY,
    code TEXT NOT NULL UNIQUE, -- e.g., 'K', '1', '2', 'HS'
    label TEXT NOT NULL, -- e.g., 'Kindergarten', 'Grade 1', 'High School'
    level_type TEXT NOT NULL CHECK (level_type IN ('elementary', 'middle', 'high', 'college', 'adult')),
    parent_id BIGINT REFERENCES grade_levels(id) ON DELETE CASCADE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Educational standards
CREATE TABLE standards (
    id BIGSERIAL PRIMARY KEY,
    framework TEXT NOT NULL, -- e.g., 'CCSS', 'NGSS', 'TEKS'
    code TEXT NOT NULL, -- e.g., 'CCSS.ELA-LITERACY.RL.1.1'
    description TEXT NOT NULL,
    jurisdiction TEXT, -- e.g., 'US', 'CA', 'TX'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(framework, code)
);

-- Tags for flexible categorization
CREATE TABLE tags (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    color TEXT DEFAULT '#3B82F6',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Media assets
CREATE TABLE media_assets (
    id BIGSERIAL PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN ('image', 'video', 'pdf')),
    storage_path TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    width_px INTEGER,
    height_px INTEGER,
    duration_seconds INTEGER,
    alt_text TEXT,
    captions_path TEXT,
    transcript_path TEXT,
    source_url TEXT,
    license TEXT DEFAULT 'CC BY 4.0',
    owner UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Decks
CREATE TABLE decks (
    id BIGSERIAL PRIMARY KEY,
    owner UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    language_code TEXT DEFAULT 'en',
    default_difficulty TEXT CHECK (default_difficulty IN ('beginner', 'intermediate', 'advanced')),
    default_bloom_level TEXT CHECK (default_bloom_level IN ('remember', 'understand', 'apply', 'analyze', 'evaluate', 'create')),
    visibility TEXT DEFAULT 'private' CHECK (visibility IN ('private', 'public', 'unlisted')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Deck relationships (many-to-many)
CREATE TABLE deck_subjects (
    deck_id BIGINT NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
    subject_id BIGINT NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    PRIMARY KEY (deck_id, subject_id)
);

CREATE TABLE deck_grade_levels (
    deck_id BIGINT NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
    grade_level_id BIGINT NOT NULL REFERENCES grade_levels(id) ON DELETE CASCADE,
    PRIMARY KEY (deck_id, grade_level_id)
);

CREATE TABLE deck_topics (
    deck_id BIGINT NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
    topic_id BIGINT NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    PRIMARY KEY (deck_id, topic_id)
);

CREATE TABLE deck_tags (
    deck_id BIGINT NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
    tag_id BIGINT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (deck_id, tag_id)
);

CREATE TABLE deck_standards (
    deck_id BIGINT NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
    standard_id BIGINT NOT NULL REFERENCES standards(id) ON DELETE CASCADE,
    PRIMARY KEY (deck_id, standard_id)
);

-- Cards
CREATE TABLE cards (
    id BIGSERIAL PRIMARY KEY,
    deck_id BIGINT NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
    title TEXT,
    prompt_text TEXT NOT NULL,
    answer_text TEXT,
    bloom_level TEXT CHECK (bloom_level IN ('remember', 'understand', 'apply', 'analyze', 'evaluate', 'create')),
    learning_objective TEXT,
    difficulty TEXT CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
    language_code TEXT DEFAULT 'en',
    age_min SMALLINT,
    age_max SMALLINT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Card relationships
CREATE TABLE card_media (
    card_id BIGINT NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
    media_asset_id BIGINT NOT NULL REFERENCES media_assets(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'primary' CHECK (role IN ('primary', 'secondary', 'reference')),
    sort_order INTEGER DEFAULT 0,
    PRIMARY KEY (card_id, media_asset_id)
);

CREATE TABLE card_topics (
    card_id BIGINT NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
    topic_id BIGINT NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    PRIMARY KEY (card_id, topic_id)
);

CREATE TABLE card_tags (
    card_id BIGINT NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
    tag_id BIGINT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (card_id, tag_id)
);

CREATE TABLE card_standards (
    card_id BIGINT NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
    standard_id BIGINT NOT NULL REFERENCES standards(id) ON DELETE CASCADE,
    PRIMARY KEY (card_id, standard_id)
);

-- Regions for hotspot/labeling interactions
CREATE TABLE card_regions (
    id BIGSERIAL PRIMARY KEY,
    card_id BIGINT NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
    media_asset_id BIGINT NOT NULL REFERENCES media_assets(id) ON DELETE CASCADE,
    label TEXT,
    shape TEXT CHECK (shape IN ('rect', 'circle', 'polygon')),
    coords JSONB NOT NULL,
    is_correct BOOLEAN DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quiz system
CREATE TABLE quiz_blueprints (
    id BIGSERIAL PRIMARY KEY,
    owner UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    deck_id BIGINT REFERENCES decks(id) ON DELETE CASCADE,
    constraints_json JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE quizzes (
    id BIGSERIAL PRIMARY KEY,
    owner UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    mode TEXT CHECK (mode IN ('practice', 'test')),
    deck_id BIGINT REFERENCES decks(id) ON DELETE CASCADE,
    blueprint_id BIGINT REFERENCES quiz_blueprints(id) ON DELETE SET NULL,
    time_limit_seconds INTEGER,
    settings_json JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE quiz_items (
    id BIGSERIAL PRIMARY KEY,
    quiz_id BIGINT NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    origin_card_id BIGINT REFERENCES cards(id) ON DELETE SET NULL,
    item_type TEXT NOT NULL,
    stem TEXT NOT NULL,
    media_snapshot JSONB,
    scoring_json JSONB NOT NULL,
    options_json JSONB,
    metadata_json JSONB,
    sort_order INTEGER DEFAULT 0
);

CREATE TABLE quiz_attempts (
    id BIGSERIAL PRIMARY KEY,
    quiz_id BIGINT NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    submitted_at TIMESTAMPTZ,
    score_raw NUMERIC,
    score_pct NUMERIC,
    passed BOOLEAN,
    details_json JSONB
);

CREATE TABLE quiz_attempt_answers (
    id BIGSERIAL PRIMARY KEY,
    attempt_id BIGINT NOT NULL REFERENCES quiz_attempts(id) ON DELETE CASCADE,
    quiz_item_id BIGINT NOT NULL REFERENCES quiz_items(id) ON DELETE CASCADE,
    response_json JSONB NOT NULL,
    is_correct BOOLEAN,
    score_awarded NUMERIC,
    time_taken_ms INTEGER
);

-- Jobs and background processing
CREATE TABLE jobs (
    id BIGSERIAL PRIMARY KEY,
    type TEXT CHECK (type IN ('ingest_image', 'ingest_video', 'ingest_pdf', 'ai_generate_cards')),
    status TEXT CHECK (status IN ('queued', 'processing', 'done', 'failed')) DEFAULT 'queued',
    input JSONB NOT NULL,
    output JSONB,
    error TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- File ingest tracking
CREATE TABLE ingest_files (
    id BIGSERIAL PRIMARY KEY,
    owner UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    source TEXT CHECK (source IN ('upload', 'import', 'url')) DEFAULT 'upload',
    storage_path TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    meta JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Useful indexes for performance
CREATE INDEX idx_media_assets_owner ON media_assets(owner);
CREATE INDEX idx_media_assets_type ON media_assets(type);
CREATE INDEX idx_decks_owner ON decks(owner);
CREATE INDEX idx_decks_visibility ON decks(visibility);
CREATE INDEX idx_cards_deck_id ON cards(deck_id);
CREATE INDEX idx_cards_is_active ON cards(is_active);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_type ON jobs(type);
CREATE INDEX idx_topics_subject_id ON topics(subject_id);
CREATE INDEX idx_topics_path ON topics USING GIN(path gin_trgm_ops);
CREATE INDEX idx_subjects_path ON subjects USING GIN(path gin_trgm_ops);
CREATE INDEX idx_quiz_attempts_user_id ON quiz_attempts(user_id);
CREATE INDEX idx_quiz_attempts_quiz_id ON quiz_attempts(quiz_id);
CREATE INDEX idx_ingest_files_owner ON ingest_files(owner);

-- Full-text search indexes
CREATE INDEX idx_decks_search ON decks USING GIN(to_tsvector('english', title || ' ' || COALESCE(description, '')));
CREATE INDEX idx_cards_search ON cards USING GIN(to_tsvector('english', COALESCE(title, '') || ' ' || prompt_text || ' ' || COALESCE(answer_text, '')));
CREATE INDEX idx_media_assets_search ON media_assets USING GIN(to_tsvector('english', COALESCE(alt_text, '')));

-- Trigram indexes for fuzzy search
CREATE INDEX idx_decks_title_trgm ON decks USING GIN(title gin_trgm_ops);
CREATE INDEX idx_cards_prompt_trgm ON cards USING GIN(prompt_text gin_trgm_ops);
