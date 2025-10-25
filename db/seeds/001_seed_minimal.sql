-- Seed data for flashcards application

-- Grade levels
INSERT INTO grade_levels (code, label, level_type, sort_order) VALUES
    ('PK', 'Pre-Kindergarten', 'elementary', 1),
    ('K', 'Kindergarten', 'elementary', 2),
    ('1', 'Grade 1', 'elementary', 3),
    ('2', 'Grade 2', 'elementary', 4),
    ('3', 'Grade 3', 'elementary', 5),
    ('4', 'Grade 4', 'elementary', 6),
    ('5', 'Grade 5', 'elementary', 7),
    ('6', 'Grade 6', 'middle', 8),
    ('7', 'Grade 7', 'middle', 9),
    ('8', 'Grade 8', 'middle', 10),
    ('9', 'Grade 9', 'high', 11),
    ('10', 'Grade 10', 'high', 12),
    ('11', 'Grade 11', 'high', 13),
    ('12', 'Grade 12', 'high', 14),
    ('UG', 'Undergraduate', 'college', 15),
    ('GR', 'Graduate', 'college', 16),
    ('AD', 'Adult Education', 'adult', 17);

-- Subjects (hierarchical)
INSERT INTO subjects (name, slug, path) VALUES
    ('Mathematics', 'mathematics', '/1/'),
    ('Science', 'science', '/2/'),
    ('Language Arts', 'language-arts', '/3/'),
    ('Social Studies', 'social-studies', '/4/'),
    ('Arts', 'arts', '/5/'),
    ('Physical Education', 'physical-education', '/6/'),
    ('Foreign Languages', 'foreign-languages', '/7/'),
    ('Computer Science', 'computer-science', '/8/');

-- Topics within Mathematics
INSERT INTO topics (subject_id, name, slug, path) VALUES
    (1, 'Algebra', 'algebra', '/1/'),
    (1, 'Geometry', 'geometry', '/2/'),
    (1, 'Statistics', 'statistics', '/3/'),
    (1, 'Calculus', 'calculus', '/4/'),
    (1, 'Number Theory', 'number-theory', '/5/'),
    (1, 'Trigonometry', 'trigonometry', '/6/');

-- Topics within Science
INSERT INTO topics (subject_id, name, slug, path) VALUES
    (2, 'Biology', 'biology', '/7/'),
    (2, 'Chemistry', 'chemistry', '/8/'),
    (2, 'Physics', 'physics', '/9/'),
    (2, 'Earth Science', 'earth-science', '/10/'),
    (2, 'Environmental Science', 'environmental-science', '/11/'),
    (2, 'Astronomy', 'astronomy', '/12/');

-- Topics within Language Arts
INSERT INTO topics (subject_id, name, slug, path) VALUES
    (3, 'Reading Comprehension', 'reading-comprehension', '/13/'),
    (3, 'Writing', 'writing', '/14/'),
    (3, 'Grammar', 'grammar', '/15/'),
    (3, 'Vocabulary', 'vocabulary', '/16/'),
    (3, 'Literature', 'literature', '/17/'),
    (3, 'Poetry', 'poetry', '/18/');

-- Topics within Social Studies
INSERT INTO topics (subject_id, name, slug, path) VALUES
    (4, 'History', 'history', '/19/'),
    (4, 'Geography', 'geography', '/20/'),
    (4, 'Civics', 'civics', '/21/'),
    (4, 'Economics', 'economics', '/22/'),
    (4, 'Psychology', 'psychology', '/23/'),
    (4, 'Sociology', 'sociology', '/24/');

-- Educational Standards (Common Core examples)
INSERT INTO standards (framework, code, description, jurisdiction) VALUES
    ('CCSS', 'CCSS.MATH.CONTENT.1.OA.A.1', 'Use addition and subtraction within 20 to solve word problems involving situations of adding to, taking from, putting together, taking apart, and comparing, with unknowns in all positions', 'US'),
    ('CCSS', 'CCSS.MATH.CONTENT.1.OA.A.2', 'Solve word problems that call for addition of three whole numbers whose sum is less than or equal to 20', 'US'),
    ('CCSS', 'CCSS.ELA-LITERACY.RL.1.1', 'Ask and answer questions about key details in a text', 'US'),
    ('CCSS', 'CCSS.ELA-LITERACY.RL.1.2', 'Retell stories, including key details, and demonstrate understanding of their central message or lesson', 'US'),
    ('CCSS', 'CCSS.ELA-LITERACY.RF.1.3.A', 'Know the spelling-sound correspondences for common consonant digraphs', 'US'),
    ('CCSS', 'CCSS.ELA-LITERACY.RF.1.3.B', 'Decode regularly spelled one-syllable words', 'US'),
    ('NGSS', '1-PS4-1', 'Plan and conduct investigations to provide evidence that vibrating materials can make sound and that sound can make materials vibrate', determine the number of syllables in a printed word by counting the number of vowel sounds', 'US'),
    ('NGSS', '1-PS4-2', 'Make observations to construct an evidence-based account that objects in darkness can be seen only when illuminated', 'US'),
    ('NGSS', '1-LS1-1', 'Use materials to design a solution to a human problem by mimicking how plants and/or animals use their external parts to help them survive, grow, and meet their needs', 'US');

-- Common tags
INSERT INTO tags (name, slug, color) VALUES
    ('Beginner', 'beginner', '#10B981'),
    ('Intermediate', 'intermediate', '#F59E0B'),
    ('Advanced', 'advanced', '#EF4444'),
    ('Visual Learning', 'visual-learning', '#8B5CF6'),
    ('Audio Learning', 'audio-learning', '#06B6D4'),
    ('Interactive', 'interactive', '#84CC16'),
    ('Memorization', 'memorization', '#F97316'),
    ('Problem Solving', 'problem-solving', '#EC4899'),
    ('Critical Thinking', 'critical-thinking', '#6366F1'),
    ('Creativity', 'creativity', '#14B8A6'),
    ('Collaboration', 'collaboration', '#F43F5E'),
    ('Assessment', 'assessment', '#6B7280'),
    ('Practice', 'practice', '#059669'),
    ('Review', 'review', '#DC2626'),
    ('Quick Study', 'quick-study', '#7C3AED');

-- Update paths for subjects and topics after insertion
UPDATE subjects SET path = '/' || id::text || '/' WHERE path IS NULL;
UPDATE topics SET path = '/' || id::text || '/' WHERE path IS NULL;
