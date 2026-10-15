-- BhumiSetu Database Migration 001
-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- 1. Users & RBAC
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('ADMIN', 'TEHSILDAR', 'PATWARI', 'CITIZEN')),
    department VARCHAR(100),
    state_lgd_code VARCHAR(20),
    district_lgd_code VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Documents (Scanned Land Record Artifacts)
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    original_filename VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    sha256_hash VARCHAR(64) UNIQUE NOT NULL,
    s3_key VARCHAR(500) NOT NULL,
    preprocessed_s3_key VARCHAR(500),
    status VARCHAR(50) NOT NULL DEFAULT 'UPLOADED' 
        CHECK (status IN ('UPLOADED', 'PREPROCESSING', 'INFERENCE', 'VALIDATING', 'READY_FOR_REVIEW', 'VERIFIED', 'REJECTED', 'FAILED')),
    error_message TEXT,
    uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Land Records (Normalized DILRMP Title)
CREATE TABLE IF NOT EXISTS land_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    state_lgd VARCHAR(20) NOT NULL,
    district_lgd VARCHAR(20) NOT NULL,
    subdistrict_lgd VARCHAR(20) NOT NULL,
    village_lgd VARCHAR(20) NOT NULL,
    village_name VARCHAR(255),
    survey_number VARCHAR(100) NOT NULL,
    subdivision_number VARCHAR(100),
    ulpin VARCHAR(14),
    raw_area NUMERIC(15, 4),
    raw_unit VARCHAR(50),
    normalized_area_sqm NUMERIC(15, 4),
    normalized_area_hectares NUMERIC(15, 6),
    unit_conversion_metadata JSONB DEFAULT '{}'::jsonb,
    land_classification VARCHAR(100),
    owners JSONB DEFAULT '[]'::jsonb,
    overall_confidence NUMERIC(5, 4) DEFAULT 0.0,
    review_priority_score NUMERIC(5, 4) DEFAULT 1.0,
    review_status VARCHAR(50) DEFAULT 'PENDING_REVIEW' 
        CHECK (review_status IN ('PENDING_REVIEW', 'IN_REVIEW', 'VERIFIED', 'REJECTED')),
    locked_by UUID REFERENCES users(id) ON DELETE SET NULL,
    locked_at TIMESTAMP WITH TIME ZONE,
    verified_by UUID REFERENCES users(id) ON DELETE SET NULL,
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Parcel Geometries (PostGIS Spatial Cadastral Plots)
CREATE TABLE IF NOT EXISTS parcel_geometries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    record_id UUID REFERENCES land_records(id) ON DELETE CASCADE,
    geom GEOMETRY(MULTIPOLYGON, 4326),
    calculated_area_sqm NUMERIC(15, 4),
    is_valid_geometry BOOLEAN DEFAULT true,
    overlap_warning BOOLEAN DEFAULT false,
    properties JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Field Extractions (Fine-grained AI Bounding Boxes & Confidence)
CREATE TABLE IF NOT EXISTS field_extractions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    record_id UUID REFERENCES land_records(id) ON DELETE CASCADE,
    field_name VARCHAR(100) NOT NULL,
    ai_extracted_value TEXT,
    ai_confidence NUMERIC(5, 4),
    bounding_box JSONB,
    rule_validation_status VARCHAR(50) DEFAULT 'PASS' 
        CHECK (rule_validation_status IN ('PASS', 'WARNING', 'FAIL')),
    rule_validation_message TEXT,
    human_verified_value TEXT,
    status VARCHAR(50) DEFAULT 'UNVERIFIED' 
        CHECK (status IN ('UNVERIFIED', 'ACCEPTED', 'CORRECTED', 'REJECTED')),
    correction_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Audit Logs (Tamper-Evident SHA-256 Hash Chain)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sequence_number BIGSERIAL UNIQUE,
    record_id UUID REFERENCES land_records(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    actor_role VARCHAR(50),
    prev_hash VARCHAR(64) NOT NULL,
    curr_hash VARCHAR(64) NOT NULL,
    delta JSONB NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_parcel_geom ON parcel_geometries USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_land_records_village_survey ON land_records(village_lgd, survey_number);
CREATE INDEX IF NOT EXISTS idx_land_records_priority ON land_records(review_priority_score DESC);
CREATE INDEX IF NOT EXISTS idx_documents_hash ON documents(sha256_hash);
CREATE INDEX IF NOT EXISTS idx_audit_logs_seq ON audit_logs(sequence_number);
