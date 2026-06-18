-- =============================================================================
-- SkinSight · Supabase Schema
-- Noraina Suria Amiera Norazman · MSU · 2025
-- Run in: Supabase Dashboard → SQL Editor
-- =============================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  ); $$;

-- =============================================================================
-- 1. PROFILES  (extends auth.users)
-- =============================================================================

CREATE TABLE public.profiles (
    id                   UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role                 VARCHAR(20) NOT NULL DEFAULT 'student' CHECK (role IN ('student','admin')),
    full_name            VARCHAR(200),
    age                  SMALLINT    CHECK (age BETWEEN 13 AND 100),
    gender               VARCHAR(30),
    avatar_url           TEXT,
    -- Skin classification
    known_skin_type      VARCHAR(20) DEFAULT 'unknown'
                                     CHECK (known_skin_type IN ('oily','dry','combination','normal','sensitive','unknown')),
    fitzpatrick_scale    SMALLINT    CHECK (fitzpatrick_scale BETWEEN 1 AND 6),
    -- Lifestyle (feeds recommender)
    stress_level         SMALLINT    CHECK (stress_level BETWEEN 1 AND 5),
    avg_sleep_hours      DECIMAL(3,1) CHECK (avg_sleep_hours BETWEEN 0 AND 24),
    diet_pattern         VARCHAR(50) CHECK (diet_pattern IN ('balanced','high_sugar','high_dairy','vegan','vegetarian','unknown')),
    exercise_frequency   VARCHAR(20) CHECK (exercise_frequency IN ('none','1_2x_week','3_5x_week','daily')),
    water_intake_litres  DECIMAL(3,1) CHECK (water_intake_litres BETWEEN 0 AND 10),
    -- Environment
    location_climate     VARCHAR(30) CHECK (location_climate IN ('tropical','subtropical','temperate','arid','continental','polar')),
    city                 VARCHAR(100),
    -- Concerns & allergies
    skincare_concerns    TEXT[]      DEFAULT '{}',
    known_allergies      TEXT[]      DEFAULT '{}',
    current_products     TEXT[]      DEFAULT '{}',
    -- Timestamps
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_profiles_role        ON public.profiles (role);
CREATE INDEX idx_profiles_skin_type   ON public.profiles (known_skin_type);
CREATE INDEX idx_profiles_fitzpatrick ON public.profiles (fitzpatrick_scale);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own profile"    ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users update own profile"  ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Admins view all profiles"  ON public.profiles FOR SELECT USING (is_admin());
CREATE POLICY "Admins update all profiles" ON public.profiles FOR UPDATE USING (is_admin());

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'avatar_url');
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- =============================================================================
-- 2. FACIAL IMAGES  (metadata only — bytes in Supabase Storage)
-- =============================================================================

CREATE TABLE public.facial_images (
    image_id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id              UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    -- Storage path format: {user_id}/{image_id}.jpg in 'facial-images' private bucket
    storage_path         TEXT        NOT NULL,
    file_size_bytes      INTEGER     CHECK (file_size_bytes > 0),
    mime_type            VARCHAR(50) CHECK (mime_type IN ('image/jpeg','image/png','image/webp')),
    width_px             SMALLINT,
    height_px            SMALLINT,
    -- Quality scores (set by OpenCV pipeline)
    quality_score        DECIMAL(4,3) CHECK (quality_score BETWEEN 0 AND 1),
    lighting_assessment  VARCHAR(20) CHECK (lighting_assessment IN ('good','acceptable','poor')),
    face_detected        BOOLEAN     NOT NULL DEFAULT FALSE,
    face_confidence      DECIMAL(4,3) CHECK (face_confidence BETWEEN 0 AND 1),
    -- Consent & lifecycle
    consent_given_at     TIMESTAMPTZ,
    is_deleted           BOOLEAN     NOT NULL DEFAULT FALSE,
    deleted_at           TIMESTAMPTZ,
    uploaded_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_images_user   ON public.facial_images (user_id, uploaded_at DESC);
CREATE INDEX idx_images_active ON public.facial_images (user_id) WHERE is_deleted = FALSE;

ALTER TABLE public.facial_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own images"        ON public.facial_images FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own images"      ON public.facial_images FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users soft-delete own images" ON public.facial_images FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins view all images"       ON public.facial_images FOR SELECT USING (is_admin());

COMMENT ON COLUMN public.facial_images.storage_path IS 'Path in Supabase Storage. Access via createSignedUrl() only — never expose directly.';
COMMENT ON COLUMN public.facial_images.quality_score IS 'CNN not called if quality_score < 0.45.';

-- =============================================================================
-- 3. SKIN ANALYSES  (CNN scan summary)
-- =============================================================================

CREATE TABLE public.skin_analyses (
    analysis_id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    image_id               UUID        NOT NULL REFERENCES public.facial_images(image_id),
    overall_health_score   DECIMAL(5,2) NOT NULL CHECK (overall_health_score BETWEEN 0 AND 100),
    model_name             VARCHAR(100) NOT NULL,
    model_version          VARCHAR(50)  NOT NULL,
    model_confidence       DECIMAL(4,3) NOT NULL CHECK (model_confidence BETWEEN 0 AND 1),
    inference_duration_ms  INTEGER,
    preprocessing_flags    JSONB        DEFAULT '{}',
    analysed_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_analyses_user  ON public.skin_analyses (user_id, analysed_at DESC);
CREATE INDEX idx_analyses_image ON public.skin_analyses (image_id);

ALTER TABLE public.skin_analyses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own analyses"   ON public.skin_analyses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role insert"       ON public.skin_analyses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins view all analyses"  ON public.skin_analyses FOR SELECT USING (is_admin());

-- =============================================================================
-- 4. SKIN CONDITION RESULTS  (granular per-condition CNN outputs)
-- One row per condition per analysis. Condition-specific columns are nullable.
-- =============================================================================

CREATE TABLE public.skin_condition_results (
    result_id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    analysis_id          UUID        NOT NULL REFERENCES public.skin_analyses(analysis_id) ON DELETE CASCADE,
    -- Condition identity
    condition_type       VARCHAR(30) NOT NULL CHECK (condition_type IN ('acne','dryness','oiliness','pigmentation','texture','sensitivity','redness')),
    severity_label       VARCHAR(20) NOT NULL CHECK (severity_label IN ('none','low','mild','moderate','severe')),
    severity_score       DECIMAL(5,2) NOT NULL CHECK (severity_score BETWEEN 0 AND 100),
    affected_zones       TEXT[]      DEFAULT '{}',
    -- Acne-specific (NULL for other conditions)
    acne_subtype         VARCHAR(30) CHECK (acne_subtype IN ('comedonal','inflammatory','cystic','mixed')),
    acne_lesion_count    SMALLINT    CHECK (acne_lesion_count >= 0),
    acne_active_count    SMALLINT    CHECK (acne_active_count >= 0),
    acne_pih_present     BOOLEAN,
    -- Oiliness-specific
    sebum_production     VARCHAR(20) CHECK (sebum_production IN ('very_low','low','normal','high','very_high')),
    oily_zones           TEXT[]      DEFAULT '{}',
    -- Dryness-specific
    barrier_integrity    VARCHAR(30) CHECK (barrier_integrity IN ('intact','mildly_compromised','compromised','severely_compromised')),
    dehydration_score    DECIMAL(5,2) CHECK (dehydration_score BETWEEN 0 AND 100),
    -- Pigmentation-specific
    pigmentation_pattern VARCHAR(30) CHECK (pigmentation_pattern IN ('post_inflammatory','melasma','freckles','sun_spots','uniform')),
    pigmentation_depth   VARCHAR(15) CHECK (pigmentation_depth IN ('epidermal','dermal','mixed')),
    -- Raw model output (retained for retraining)
    raw_model_output     JSONB       DEFAULT '{}',
    notes                TEXT,
    UNIQUE (analysis_id, condition_type)
);

CREATE INDEX idx_conditions_analysis ON public.skin_condition_results (analysis_id);
CREATE INDEX idx_conditions_type     ON public.skin_condition_results (condition_type, severity_label);
CREATE INDEX idx_conditions_acne     ON public.skin_condition_results (acne_subtype) WHERE condition_type = 'acne';

ALTER TABLE public.skin_condition_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own conditions" ON public.skin_condition_results FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.skin_analyses sa WHERE sa.analysis_id = skin_condition_results.analysis_id AND sa.user_id = auth.uid()));
CREATE POLICY "Service role insert conditions" ON public.skin_condition_results FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.skin_analyses sa WHERE sa.analysis_id = skin_condition_results.analysis_id AND sa.user_id = auth.uid()));
CREATE POLICY "Admins view all conditions" ON public.skin_condition_results FOR SELECT USING (is_admin());

COMMENT ON COLUMN public.skin_condition_results.acne_subtype IS 'comedonal → BHA; inflammatory → niacinamide/BP; cystic → refer to dermatologist.';
COMMENT ON COLUMN public.skin_condition_results.raw_model_output IS 'Full softmax vector retained for Fitzpatrick bias audits and model retraining.';

-- =============================================================================
-- 5. INGREDIENTS  (master catalogue — public read, admin write)
-- =============================================================================

CREATE TABLE public.ingredients (
    ingredient_id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    inci_name                   VARCHAR(255) NOT NULL UNIQUE,
    common_name                 VARCHAR(255),
    category                    VARCHAR(50) NOT NULL CHECK (category IN (
                                  'humectant','emollient','occlusive','exfoliant_aha','exfoliant_bha',
                                  'exfoliant_pha','retinoid','niacinamide','peptide','antioxidant',
                                  'spf_filter','brightener','anti_inflammatory','antimicrobial',
                                  'soothing','preservative','emulsifier','other')),
    comedogenic_rating          SMALLINT    CHECK (comedogenic_rating BETWEEN 0 AND 5),
    irritancy_rating            SMALLINT    CHECK (irritancy_rating BETWEEN 0 AND 5),
    optimal_ph_min              DECIMAL(4,1) CHECK (optimal_ph_min BETWEEN 0 AND 14),
    optimal_ph_max              DECIMAL(4,1) CHECK (optimal_ph_max BETWEEN 0 AND 14),
    typical_concentration_pct   DECIMAL(6,3),
    max_safe_concentration_pct  DECIMAL(6,3),
    evidence_level              VARCHAR(20) NOT NULL DEFAULT 'moderate'
                                            CHECK (evidence_level IN ('strong','moderate','limited','anecdotal')),
    is_active_ingredient        BOOLEAN     NOT NULL DEFAULT TRUE,
    notes                       TEXT,
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ingredients_category    ON public.ingredients (category);
CREATE INDEX idx_ingredients_comedogenic ON public.ingredients (comedogenic_rating);
CREATE INDEX idx_ingredients_search      ON public.ingredients
  USING gin (to_tsvector('english', coalesce(common_name,'') || ' ' || inci_name));

ALTER TABLE public.ingredients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone view ingredients"       ON public.ingredients FOR SELECT USING (TRUE);
CREATE POLICY "Admins modify ingredients"     ON public.ingredients FOR ALL USING (is_admin()) WITH CHECK (is_admin());

COMMENT ON COLUMN public.ingredients.comedogenic_rating IS 'Fulton scale 0–5. Acne-prone users filtered to ≤1.';

-- =============================================================================
-- 6. INGREDIENT ↔ SKIN CONDITION COMPATIBILITY  (recommender lookup table)
-- =============================================================================

CREATE TABLE public.ingredient_skin_compatibility (
    compat_id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    ingredient_id        UUID        NOT NULL REFERENCES public.ingredients(ingredient_id) ON DELETE CASCADE,
    target_condition     VARCHAR(30) NOT NULL CHECK (target_condition IN (
                           'acne','dryness','oiliness','pigmentation','texture',
                           'sensitivity','redness','anti_aging','brightening')),
    effect_direction     VARCHAR(10) NOT NULL CHECK (effect_direction IN ('treats','worsens','neutral')),
    effect_strength      VARCHAR(10) NOT NULL CHECK (effect_strength IN ('strong','moderate','mild')),
    -- Skin type suitability flags
    suitable_oily        BOOLEAN     NOT NULL DEFAULT FALSE,
    suitable_dry         BOOLEAN     NOT NULL DEFAULT FALSE,
    suitable_combination BOOLEAN     NOT NULL DEFAULT FALSE,
    suitable_sensitive   BOOLEAN     NOT NULL DEFAULT FALSE,
    suitable_normal      BOOLEAN     NOT NULL DEFAULT FALSE,
    -- Usage
    usage_time           VARCHAR(10) NOT NULL DEFAULT 'both' CHECK (usage_time IN ('am','pm','both')),
    contraindications    TEXT[]      DEFAULT '{}',
    do_not_combine_with  TEXT[]      DEFAULT '{}',
    citation             TEXT,
    UNIQUE (ingredient_id, target_condition)
);

CREATE INDEX idx_compat_ingredient ON public.ingredient_skin_compatibility (ingredient_id);
CREATE INDEX idx_compat_condition  ON public.ingredient_skin_compatibility (target_condition, effect_direction);
CREATE INDEX idx_compat_oily       ON public.ingredient_skin_compatibility (suitable_oily)      WHERE suitable_oily = TRUE;
CREATE INDEX idx_compat_dry        ON public.ingredient_skin_compatibility (suitable_dry)       WHERE suitable_dry = TRUE;
CREATE INDEX idx_compat_sensitive  ON public.ingredient_skin_compatibility (suitable_sensitive) WHERE suitable_sensitive = TRUE;

ALTER TABLE public.ingredient_skin_compatibility ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone view compatibility"   ON public.ingredient_skin_compatibility FOR SELECT USING (TRUE);
CREATE POLICY "Admins modify compatibility" ON public.ingredient_skin_compatibility FOR ALL USING (is_admin()) WITH CHECK (is_admin());

COMMENT ON COLUMN public.ingredient_skin_compatibility.do_not_combine_with IS 'Safety-critical. e.g. RETINOL cannot combine with GLYCOLIC ACID.';

-- =============================================================================
-- 7. PRODUCTS  (skincare product catalogue)
-- =============================================================================

CREATE TABLE public.products (
    product_id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_name            VARCHAR(255),
    product_name          VARCHAR(255) NOT NULL,
    category              VARCHAR(30) NOT NULL CHECK (category IN (
                            'cleanser','toner','serum','moisturiser','spf','exfoliant',
                            'mask','eye_cream','spot_treatment','facial_oil','mist','essence')),
    product_type          VARCHAR(50),
    -- Pricing (student affordability — Obj 3)
    price_myr             DECIMAL(8,2) CHECK (price_myr >= 0),
    price_tier            VARCHAR(10) NOT NULL DEFAULT 'mid' CHECK (price_tier IN ('budget','mid','premium')),
    -- Formulation flags
    is_fragrance_free     BOOLEAN     NOT NULL DEFAULT FALSE,
    is_alcohol_free       BOOLEAN     NOT NULL DEFAULT FALSE,
    is_oil_free           BOOLEAN     NOT NULL DEFAULT FALSE,
    is_non_comedogenic    BOOLEAN     NOT NULL DEFAULT FALSE,
    is_cruelty_free       BOOLEAN     NOT NULL DEFAULT FALSE,
    is_halal_certified    BOOLEAN     NOT NULL DEFAULT FALSE,
    is_vegan              BOOLEAN     NOT NULL DEFAULT FALSE,
    -- Suitability
    suitable_skin_types   TEXT[]      NOT NULL DEFAULT '{}',
    target_concerns       TEXT[]      NOT NULL DEFAULT '{}',
    -- Availability
    purchase_url          TEXT,
    is_available_malaysia BOOLEAN     NOT NULL DEFAULT TRUE,
    is_active             BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_products_category   ON public.products (category);
CREATE INDEX idx_products_price_tier ON public.products (price_tier);
CREATE INDEX idx_products_active     ON public.products (is_active) WHERE is_active = TRUE;
CREATE INDEX idx_products_search     ON public.products USING gin (to_tsvector('english', product_name || ' ' || coalesce(brand_name,'')));
CREATE INDEX idx_products_skin_types ON public.products USING gin (suitable_skin_types);
CREATE INDEX idx_products_concerns   ON public.products USING gin (target_concerns);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone view active products" ON public.products FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Admins view all products"    ON public.products FOR SELECT USING (is_admin());
CREATE POLICY "Admins modify products"      ON public.products FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

COMMENT ON COLUMN public.products.price_tier         IS 'budget <RM30, mid RM30–100, premium >RM100.';
COMMENT ON COLUMN public.products.is_halal_certified IS 'Required filter for Malaysian Muslim students.';

-- =============================================================================
-- 8. PRODUCT ↔ INGREDIENT  (many-to-many)
-- =============================================================================

CREATE TABLE public.product_ingredients (
    id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id        UUID        NOT NULL REFERENCES public.products(product_id) ON DELETE CASCADE,
    ingredient_id     UUID        NOT NULL REFERENCES public.ingredients(ingredient_id),
    concentration_pct DECIMAL(6,3) CHECK (concentration_pct > 0),
    is_key_ingredient BOOLEAN     NOT NULL DEFAULT FALSE,
    inci_position     INTEGER     CHECK (inci_position > 0),
    UNIQUE (product_id, ingredient_id)
);

CREATE INDEX idx_pi_product    ON public.product_ingredients (product_id);
CREATE INDEX idx_pi_ingredient ON public.product_ingredients (ingredient_id);
CREATE INDEX idx_pi_key        ON public.product_ingredients (product_id) WHERE is_key_ingredient = TRUE;

ALTER TABLE public.product_ingredients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone view product ingredients" ON public.product_ingredients FOR SELECT USING (TRUE);
CREATE POLICY "Admins modify product ingredients" ON public.product_ingredients FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- =============================================================================
-- 9. ROUTINES  (admin-curated templates)
-- =============================================================================

CREATE TABLE public.routines (
    routine_id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    name                    VARCHAR(255) NOT NULL,
    description             TEXT,
    target_conditions       TEXT[]      NOT NULL DEFAULT '{}',
    target_skin_types       TEXT[]      NOT NULL DEFAULT '{}',
    time_of_day             VARCHAR(10) NOT NULL CHECK (time_of_day IN ('am','pm','both')),
    estimated_duration_min  SMALLINT    CHECK (estimated_duration_min > 0),
    difficulty_level        VARCHAR(15) NOT NULL DEFAULT 'beginner' CHECK (difficulty_level IN ('beginner','intermediate','advanced')),
    is_active               BOOLEAN     NOT NULL DEFAULT TRUE,
    created_by              UUID        REFERENCES auth.users(id),
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_routines_conditions ON public.routines USING gin (target_conditions);
CREATE INDEX idx_routines_skin_types ON public.routines USING gin (target_skin_types);
CREATE INDEX idx_routines_active     ON public.routines (is_active) WHERE is_active = TRUE;

ALTER TABLE public.routines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone view active routines" ON public.routines FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Admins modify routines"      ON public.routines FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE TRIGGER trg_routines_updated_at
  BEFORE UPDATE ON public.routines FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- =============================================================================
-- 10. ROUTINE STEPS
-- =============================================================================

CREATE TABLE public.routine_steps (
    step_id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    routine_id               UUID        NOT NULL REFERENCES public.routines(routine_id) ON DELETE CASCADE,
    step_order               SMALLINT    NOT NULL CHECK (step_order > 0),
    step_name                VARCHAR(100) NOT NULL,
    time_of_day              VARCHAR(10) NOT NULL CHECK (time_of_day IN ('am','pm','both')),
    instruction              TEXT,
    application_technique    VARCHAR(100),
    wait_seconds_before_next SMALLINT    DEFAULT 0,
    UNIQUE (routine_id, step_order)
);

CREATE INDEX idx_steps_routine ON public.routine_steps (routine_id, step_order);

ALTER TABLE public.routine_steps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone view routine steps"  ON public.routine_steps FOR SELECT USING (TRUE);
CREATE POLICY "Admins modify routine steps" ON public.routine_steps FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- =============================================================================
-- 11. ROUTINE STEP ↔ PRODUCTS
-- =============================================================================

CREATE TABLE public.routine_step_products (
    id                 UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
    step_id            UUID    NOT NULL REFERENCES public.routine_steps(step_id) ON DELETE CASCADE,
    product_id         UUID    NOT NULL REFERENCES public.products(product_id),
    is_primary         BOOLEAN NOT NULL DEFAULT TRUE,
    substitution_note  TEXT,
    UNIQUE (step_id, product_id)
);

CREATE INDEX idx_rsp_step    ON public.routine_step_products (step_id);
CREATE INDEX idx_rsp_product ON public.routine_step_products (product_id);

ALTER TABLE public.routine_step_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone view step products"  ON public.routine_step_products FOR SELECT USING (TRUE);
CREATE POLICY "Admins modify step products" ON public.routine_step_products FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- =============================================================================
-- 12. RECOMMENDATIONS
-- =============================================================================

CREATE TABLE public.recommendations (
    recommendation_id  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id            UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    analysis_id        UUID        NOT NULL UNIQUE REFERENCES public.skin_analyses(analysis_id),
    routine_id         UUID        REFERENCES public.routines(routine_id),
    algorithm_version  VARCHAR(50) NOT NULL,
    match_score        DECIMAL(4,3) NOT NULL CHECK (match_score BETWEEN 0 AND 1),
    scoring_breakdown  JSONB       DEFAULT '{}',
    reasoning_text     TEXT,
    -- User feedback (retraining loop)
    is_accepted        BOOLEAN,
    user_rating        SMALLINT    CHECK (user_rating BETWEEN 1 AND 5),
    user_feedback_text TEXT,
    feedback_given_at  TIMESTAMPTZ,
    generated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_recs_user     ON public.recommendations (user_id, generated_at DESC);
CREATE INDEX idx_recs_analysis ON public.recommendations (analysis_id);
CREATE INDEX idx_recs_rating   ON public.recommendations (user_rating) WHERE user_rating IS NOT NULL;

ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own recs"        ON public.recommendations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users update own feedback"  ON public.recommendations FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Service role insert recs"   ON public.recommendations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins view all recs"       ON public.recommendations FOR SELECT USING (is_admin());

COMMENT ON COLUMN public.recommendations.scoring_breakdown IS 'JSONB breakdown enables auditable rationale per recommendation.';
COMMENT ON COLUMN public.recommendations.reasoning_text    IS 'Human-readable explanation shown in the UI.';

-- =============================================================================
-- 13. EDUCATIONAL CONTENT
-- =============================================================================

CREATE TABLE public.educational_content (
    content_id       UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    title            VARCHAR(255) NOT NULL,
    slug             VARCHAR(255) NOT NULL UNIQUE,
    topic            VARCHAR(30) NOT NULL CHECK (topic IN (
                       'acne','dryness','oiliness','pigmentation','texture',
                       'sensitivity','ingredients','routine_guide','general')),
    target_conditions TEXT[]     DEFAULT '{}',
    body             TEXT        NOT NULL,
    reading_time_min SMALLINT    CHECK (reading_time_min > 0),
    is_published     BOOLEAN     NOT NULL DEFAULT FALSE,
    published_at     TIMESTAMPTZ,
    author_id        UUID        REFERENCES auth.users(id),
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_content_topic     ON public.educational_content (topic);
CREATE INDEX idx_content_published ON public.educational_content (is_published, published_at DESC) WHERE is_published = TRUE;
CREATE INDEX idx_content_search    ON public.educational_content USING gin (to_tsvector('english', title || ' ' || body));

ALTER TABLE public.educational_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone view published content"     ON public.educational_content FOR SELECT USING (is_published = TRUE);
CREATE POLICY "Admins manage all content"         ON public.educational_content FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE TRIGGER trg_content_updated_at
  BEFORE UPDATE ON public.educational_content FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- =============================================================================
-- 14. NOTIFICATIONS  (Realtime-enabled)
-- =============================================================================

CREATE TABLE public.notifications (
    notification_id UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type            VARCHAR(30) NOT NULL CHECK (type IN ('scan_reminder','routine_reminder','progress_milestone','new_content','system')),
    title           VARCHAR(255) NOT NULL,
    body            TEXT,
    is_read         BOOLEAN     NOT NULL DEFAULT FALSE,
    scheduled_at    TIMESTAMPTZ NOT NULL,
    sent_at         TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifs_user    ON public.notifications (user_id, scheduled_at);
CREATE INDEX idx_notifs_unread  ON public.notifications (user_id) WHERE is_read = FALSE;
CREATE INDEX idx_notifs_pending ON public.notifications (scheduled_at) WHERE sent_at IS NULL;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own notifications"  ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users mark notifications read" ON public.notifications FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins manage notifications"   ON public.notifications FOR ALL USING (is_admin()) WITH CHECK (is_admin());

ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- =============================================================================
-- 15. ADMIN ACTIVITY LOG  (immutable audit trail)
-- =============================================================================

CREATE TABLE public.admin_activity_logs (
    log_id       UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id     UUID        NOT NULL REFERENCES auth.users(id),
    action_type  VARCHAR(50) NOT NULL CHECK (action_type IN (
                   'model_retrain','model_deploy','routine_create','routine_update','routine_delete',
                   'product_create','product_update','product_delete','ingredient_create','ingredient_update',
                   'user_suspend','user_restore','content_publish','content_unpublish','data_export','config_change')),
    target_table VARCHAR(100),
    target_id    UUID,
    description  TEXT        NOT NULL,
    metadata     JSONB       DEFAULT '{}',
    ip_address   INET,
    performed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_admin_logs_admin  ON public.admin_activity_logs (admin_id, performed_at DESC);
CREATE INDEX idx_admin_logs_action ON public.admin_activity_logs (action_type, performed_at DESC);

ALTER TABLE public.admin_activity_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view audit log"    ON public.admin_activity_logs FOR SELECT USING (is_admin());
CREATE POLICY "Admins insert audit log"  ON public.admin_activity_logs FOR INSERT WITH CHECK (is_admin() AND auth.uid() = admin_id);
-- No UPDATE or DELETE policy — log is append-only by design

COMMENT ON TABLE public.admin_activity_logs IS 'Immutable audit log. No DELETE or UPDATE policy enforces append-only integrity.';

-- =============================================================================
-- VIEWS
-- =============================================================================

-- Dashboard summary card: latest analysis per user
CREATE VIEW public.v_latest_analyses AS
  SELECT DISTINCT ON (sa.user_id)
    sa.user_id, sa.analysis_id, sa.overall_health_score,
    sa.analysed_at, sa.model_version, sa.model_confidence
  FROM public.skin_analyses sa
  ORDER BY sa.user_id, sa.analysed_at DESC;

-- API serialisation: flat condition view
CREATE VIEW public.v_condition_summary AS
  SELECT
    scr.analysis_id, scr.condition_type, scr.severity_label, scr.severity_score,
    scr.affected_zones, scr.acne_subtype, scr.acne_lesion_count, scr.sebum_production,
    scr.barrier_integrity, scr.dehydration_score, scr.pigmentation_pattern,
    sa.user_id, sa.analysed_at
  FROM public.skin_condition_results scr
  JOIN public.skin_analyses sa ON sa.analysis_id = scr.analysis_id;

-- Core recommender query: condition → ingredient → product
CREATE VIEW public.v_ingredient_product_map AS
  SELECT
    pi.product_id, p.product_name, p.brand_name, p.category,
    p.price_tier, p.price_myr, p.suitable_skin_types, p.is_halal_certified,
    i.ingredient_id, i.inci_name, i.common_name, i.category AS ingredient_category,
    i.comedogenic_rating, pi.is_key_ingredient,
    isc.target_condition, isc.effect_direction, isc.effect_strength,
    isc.suitable_oily, isc.suitable_dry, isc.suitable_combination, isc.suitable_sensitive,
    isc.usage_time, isc.do_not_combine_with
  FROM public.product_ingredients pi
  JOIN public.products p               ON p.product_id    = pi.product_id
  JOIN public.ingredients i            ON i.ingredient_id = pi.ingredient_id
  LEFT JOIN public.ingredient_skin_compatibility isc ON isc.ingredient_id = pi.ingredient_id
  WHERE p.is_active = TRUE AND pi.is_key_ingredient = TRUE;

-- =============================================================================
-- SEED DATA — INGREDIENTS
-- =============================================================================

INSERT INTO public.ingredients (inci_name, common_name, category, comedogenic_rating, irritancy_rating, optimal_ph_min, optimal_ph_max, evidence_level, typical_concentration_pct) VALUES
  ('NIACINAMIDE',        'Niacinamide / Vitamin B3', 'niacinamide',   0, 1, 5.0, 7.0, 'strong',   5.00),
  ('SALICYLIC ACID',     'Salicylic Acid / BHA',     'exfoliant_bha', 0, 2, 3.0, 4.0, 'strong',   2.00),
  ('GLYCOLIC ACID',      'Glycolic Acid / AHA',      'exfoliant_aha', 0, 3, 3.0, 4.0, 'strong',   5.00),
  ('RETINOL',            'Retinol / Vitamin A',      'retinoid',      0, 3, 5.0, 7.0, 'strong',   0.10),
  ('SODIUM HYALURONATE', 'Hyaluronic Acid',          'humectant',     0, 0, 5.0, 8.0, 'strong',   0.50),
  ('CENTELLA ASIATICA',  'Cica / Centella',          'soothing',      0, 0, 5.0, 7.5, 'moderate', 1.00),
  ('CERAMIDE NP',        'Ceramide NP',              'emollient',     0, 0, 5.0, 7.0, 'strong',   1.00),
  ('ASCORBIC ACID',      'Vitamin C',                'brightener',    0, 2, 2.5, 3.5, 'strong',  10.00),
  ('AZELAIC ACID',       'Azelaic Acid',             'brightener',    0, 1, 4.0, 7.0, 'strong',  10.00),
  ('ZINC PYRITHIONE',    'Zinc Pyrithione',          'antimicrobial', 0, 1, 5.0, 7.0, 'moderate', 1.00),
  ('BENZOYL PEROXIDE',   'Benzoyl Peroxide',         'antimicrobial', 0, 3, 4.0, 7.0, 'strong',   2.50),
  ('TRANEXAMIC ACID',    'Tranexamic Acid',          'brightener',    0, 0, 5.0, 7.0, 'moderate', 3.00);

-- =============================================================================
-- SEED DATA — INGREDIENT COMPATIBILITY
-- =============================================================================

INSERT INTO public.ingredient_skin_compatibility
  (ingredient_id, target_condition, effect_direction, effect_strength,
   suitable_oily, suitable_dry, suitable_combination, suitable_sensitive, suitable_normal,
   usage_time, do_not_combine_with)
SELECT i.ingredient_id, v.target_condition, v.effect_direction, v.effect_strength,
       v.suitable_oily, v.suitable_dry, v.suitable_combination, v.suitable_sensitive, v.suitable_normal,
       v.usage_time, v.do_not_combine_with
FROM (VALUES
  ('NIACINAMIDE',        'acne',         'treats',  'moderate', TRUE,  TRUE,  TRUE,  TRUE,  TRUE,  'both', ARRAY[]::TEXT[]),
  ('NIACINAMIDE',        'oiliness',     'treats',  'moderate', TRUE,  FALSE, TRUE,  TRUE,  TRUE,  'both', ARRAY[]::TEXT[]),
  ('NIACINAMIDE',        'pigmentation', 'treats',  'moderate', TRUE,  TRUE,  TRUE,  TRUE,  TRUE,  'both', ARRAY[]::TEXT[]),
  ('SALICYLIC ACID',     'acne',         'treats',  'strong',   TRUE,  FALSE, TRUE,  FALSE, TRUE,  'pm',   ARRAY['RETINOL']),
  ('SALICYLIC ACID',     'oiliness',     'treats',  'strong',   TRUE,  FALSE, TRUE,  FALSE, TRUE,  'pm',   ARRAY['RETINOL']),
  ('GLYCOLIC ACID',      'texture',      'treats',  'strong',   TRUE,  FALSE, TRUE,  FALSE, TRUE,  'pm',   ARRAY['RETINOL','SALICYLIC ACID']),
  ('GLYCOLIC ACID',      'pigmentation', 'treats',  'moderate', TRUE,  FALSE, TRUE,  FALSE, TRUE,  'pm',   ARRAY['RETINOL','SALICYLIC ACID']),
  ('RETINOL',            'acne',         'treats',  'strong',   TRUE,  FALSE, TRUE,  FALSE, TRUE,  'pm',   ARRAY['GLYCOLIC ACID','SALICYLIC ACID','ASCORBIC ACID']),
  ('RETINOL',            'texture',      'treats',  'strong',   TRUE,  FALSE, TRUE,  FALSE, TRUE,  'pm',   ARRAY['GLYCOLIC ACID','SALICYLIC ACID','ASCORBIC ACID']),
  ('SODIUM HYALURONATE', 'dryness',      'treats',  'strong',   TRUE,  TRUE,  TRUE,  TRUE,  TRUE,  'both', ARRAY[]::TEXT[]),
  ('CERAMIDE NP',        'dryness',      'treats',  'strong',   FALSE, TRUE,  TRUE,  TRUE,  TRUE,  'both', ARRAY[]::TEXT[]),
  ('CERAMIDE NP',        'sensitivity',  'treats',  'moderate', FALSE, TRUE,  TRUE,  TRUE,  TRUE,  'both', ARRAY[]::TEXT[]),
  ('ASCORBIC ACID',      'pigmentation', 'treats',  'strong',   TRUE,  TRUE,  TRUE,  FALSE, TRUE,  'am',   ARRAY['RETINOL','NIACINAMIDE']),
  ('AZELAIC ACID',       'pigmentation', 'treats',  'moderate', TRUE,  FALSE, TRUE,  TRUE,  TRUE,  'both', ARRAY[]::TEXT[]),
  ('AZELAIC ACID',       'acne',         'treats',  'moderate', TRUE,  FALSE, TRUE,  TRUE,  TRUE,  'both', ARRAY[]::TEXT[]),
  ('CENTELLA ASIATICA',  'sensitivity',  'treats',  'moderate', TRUE,  TRUE,  TRUE,  TRUE,  TRUE,  'both', ARRAY[]::TEXT[]),
  ('CENTELLA ASIATICA',  'redness',      'treats',  'moderate', TRUE,  TRUE,  TRUE,  TRUE,  TRUE,  'both', ARRAY[]::TEXT[]),
  ('ZINC PYRITHIONE',    'oiliness',     'treats',  'moderate', TRUE,  FALSE, TRUE,  FALSE, TRUE,  'pm',   ARRAY[]::TEXT[]),
  ('BENZOYL PEROXIDE',   'acne',         'treats',  'strong',   TRUE,  FALSE, TRUE,  FALSE, TRUE,  'pm',   ARRAY['RETINOL']),
  ('TRANEXAMIC ACID',    'pigmentation', 'treats',  'moderate', TRUE,  TRUE,  TRUE,  TRUE,  TRUE,  'both', ARRAY[]::TEXT[])
) AS v(inci, target_condition, effect_direction, effect_strength,
       suitable_oily, suitable_dry, suitable_combination, suitable_sensitive, suitable_normal,
       usage_time, do_not_combine_with)
JOIN public.ingredients i ON i.inci_name = v.inci;

-- =============================================================================
-- SUPABASE STORAGE SETUP (run in Dashboard → Storage)
-- =============================================================================
-- supabase.storage.createBucket('facial-images', { public: false })
-- supabase.storage.createBucket('avatars', { public: true })
--
-- Storage RLS for facial-images bucket (set in Dashboard → Storage → Policies):
--   INSERT: (auth.uid()::text = (storage.foldername(name))[1])
--   SELECT: (auth.uid()::text = (storage.foldername(name))[1])
--   DELETE: (auth.uid()::text = (storage.foldername(name))[1])
