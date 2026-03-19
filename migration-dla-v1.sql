-- ═══════════════════════════════════════════════════════════════
-- AVILINGO — DLA SINAV MODÜLÜ (v1)
-- THY DLA sınavını simüle eden tam bağımsız modül
-- Mevcut exam/* akışına dokunmaz
-- ═══════════════════════════════════════════════════════════════

-- 1. Mevcut questions tablosuna DLA alanları ekle
ALTER TABLE questions
  ADD COLUMN IF NOT EXISTS dla_section TEXT CHECK (dla_section IN (
    'general',   -- Bölüm 1: Genel Sorular   (5 soru × 75s)
    'picture',   -- Bölüm 2: Görsel Anlatım  (2 soru × 75s)
    'scenario',  -- Bölüm 3: Senaryo         (2 soru × 75s)
    'retell'     -- Bölüm 4: Metin Yeniden Anlatma (2 soru: 15s okuma + 75s cevap)
  )),
  ADD COLUMN IF NOT EXISTS answer_time_sec  INT  DEFAULT 75,
  ADD COLUMN IF NOT EXISTS read_time_sec    INT  DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS image_url        TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS reading_text     TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS is_dla           BOOLEAN DEFAULT FALSE;

-- retell sorularına okuma süresi
COMMENT ON COLUMN questions.read_time_sec IS 'Sadece dla_section=retell için: 15 saniye okuma süresi';

-- 2. DLA sınavı ana tablosu
CREATE TABLE IF NOT EXISTS dla_exams (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  candidate_id      UUID REFERENCES users(id) ON DELETE CASCADE,
  org_id            UUID REFERENCES organizations(id),
  status            TEXT DEFAULT 'pending' CHECK (status IN (
                      'pending', 'in_progress', 'completed', 'scored'
                    )),
  current_question  INT DEFAULT 0,         -- 0-10 arası (11 soru)
  total_questions   INT DEFAULT 11,
  started_at        TIMESTAMPTZ,
  completed_at      TIMESTAMPTZ,
  raw_score         NUMERIC(5,2),          -- 0-100
  pronunciation_avg NUMERIC(4,2),
  comprehension_avg NUMERIC(4,2),
  grammar_avg       NUMERIC(4,2),
  vocabulary_avg    NUMERIC(4,2),
  result_label      TEXT,                  -- 'Geçti' | 'Kaldı' | 'Değerlendiriliyor'
  retry_available_at TIMESTAMPTZ,          -- Yeniden sınav tarihi
  created_at        TIMESTAMPTZ DEFAULT now()
);

-- 3. Seçilen sorular (11 tanesi rastgele çekilen)
CREATE TABLE IF NOT EXISTS dla_exam_questions (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dla_exam_id   UUID REFERENCES dla_exams(id) ON DELETE CASCADE,
  question_id   UUID REFERENCES questions(id),
  question_order INT NOT NULL,  -- 1-11
  dla_section   TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dla_eq_exam ON dla_exam_questions(dla_exam_id, question_order);

-- 4. Cevaplar tablosu
CREATE TABLE IF NOT EXISTS dla_answers (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dla_exam_id     UUID REFERENCES dla_exams(id) ON DELETE CASCADE,
  question_id     UUID REFERENCES questions(id),
  dla_section     TEXT NOT NULL,
  question_order  INT NOT NULL,
  response_text   TEXT,          -- Metin tabanlı cevap (test için)
  audio_url       TEXT,          -- Supabase Storage'daki ses dosyası
  time_spent_sec  INT,
  skipped         BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dla_ans_exam ON dla_answers(dla_exam_id, question_order);

-- 5. AI/Manuel puanlama tablosu
CREATE TABLE IF NOT EXISTS dla_scores (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dla_answer_id   UUID REFERENCES dla_answers(id) ON DELETE CASCADE,
  dla_exam_id     UUID REFERENCES dla_exams(id) ON DELETE CASCADE,
  pronunciation   NUMERIC(4,2) CHECK (pronunciation BETWEEN 0 AND 10),
  comprehension   NUMERIC(4,2) CHECK (comprehension BETWEEN 0 AND 10),
  grammar         NUMERIC(4,2) CHECK (grammar BETWEEN 0 AND 10),
  vocabulary      NUMERIC(4,2) CHECK (vocabulary BETWEEN 0 AND 10),
  total_score     NUMERIC(4,2) CHECK (total_score BETWEEN 0 AND 10),
  ai_feedback     TEXT,
  scored_by       TEXT DEFAULT 'ai' CHECK (scored_by IN ('ai', 'human')),
  scored_at       TIMESTAMPTZ DEFAULT now()
);

-- 6. RLS Politikaları
ALTER TABLE dla_exams            ENABLE ROW LEVEL SECURITY;
ALTER TABLE dla_exam_questions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE dla_answers          ENABLE ROW LEVEL SECURITY;
ALTER TABLE dla_scores           ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Candidates view own dla_exams"
  ON dla_exams FOR SELECT
  USING (candidate_id = auth.uid());

CREATE POLICY "Candidates insert own dla_exams"
  ON dla_exams FOR INSERT
  WITH CHECK (candidate_id = auth.uid());

CREATE POLICY "Candidates update own dla_exams"
  ON dla_exams FOR UPDATE
  USING (candidate_id = auth.uid());

CREATE POLICY "Candidates view own dla_exam_questions"
  ON dla_exam_questions FOR SELECT
  USING (
    dla_exam_id IN (SELECT id FROM dla_exams WHERE candidate_id = auth.uid())
  );

CREATE POLICY "Candidates insert own dla_exam_questions"
  ON dla_exam_questions FOR INSERT
  WITH CHECK (
    dla_exam_id IN (SELECT id FROM dla_exams WHERE candidate_id = auth.uid())
  );

CREATE POLICY "Candidates view own dla_answers"
  ON dla_answers FOR SELECT
  USING (
    dla_exam_id IN (SELECT id FROM dla_exams WHERE candidate_id = auth.uid())
  );

CREATE POLICY "Candidates insert own dla_answers"
  ON dla_answers FOR INSERT
  WITH CHECK (
    dla_exam_id IN (SELECT id FROM dla_exams WHERE candidate_id = auth.uid())
  );

CREATE POLICY "Candidates view own dla_scores"
  ON dla_scores FOR SELECT
  USING (
    dla_exam_id IN (SELECT id FROM dla_exams WHERE candidate_id = auth.uid())
  );

CREATE POLICY "Service role all dla tables"
  ON dla_exams FOR ALL USING (true);

-- 7. Sorgu kolaylığı için view
CREATE OR REPLACE VIEW dla_exam_summary AS
SELECT
  de.id,
  de.candidate_id,
  u.full_name AS candidate_name,
  u.email AS candidate_email,
  de.status,
  de.current_question,
  de.total_questions,
  de.raw_score,
  de.pronunciation_avg,
  de.comprehension_avg,
  de.grammar_avg,
  de.vocabulary_avg,
  de.result_label,
  de.started_at,
  de.completed_at,
  de.created_at
FROM dla_exams de
LEFT JOIN users u ON u.id = de.candidate_id;

-- ═══════════════════════════════════════════════════════════════
-- VERIFY
-- ═══════════════════════════════════════════════════════════════
SELECT 'migration-dla-v1 done ✓' AS status;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name LIKE 'dla_%';
