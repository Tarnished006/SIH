-- BhumiSetu Database Migration 002: Workflow enhancements, remarks, and 3-role restriction

-- 1. Expand land_records review_status to support complete workflow transitions
ALTER TABLE land_records DROP CONSTRAINT IF EXISTS land_records_review_status_check;
ALTER TABLE land_records ADD CONSTRAINT land_records_review_status_check
    CHECK (review_status IN (
        'PENDING_REVIEW',
        'SUBMITTED',
        'IN_REVIEW',
        'FORWARDED_TO_TEHSILDAR',
        'APPROVED',
        'VERIFIED',
        'REJECTED',
        'CORRECTIONS_REQUESTED'
    ));

-- 2. Add remarks, correction notes, and decision metadata columns to land_records
ALTER TABLE land_records ADD COLUMN IF NOT EXISTS operator_remarks TEXT;
ALTER TABLE land_records ADD COLUMN IF NOT EXISTS decision_remarks TEXT;
ALTER TABLE land_records ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE land_records ADD COLUMN IF NOT EXISTS corrections_requested TEXT;

-- 3. Add application_no and applicant metadata to documents
ALTER TABLE documents ADD COLUMN IF NOT EXISTS application_no VARCHAR(100);

-- 4. Restrict active roles to exactly three roles: CITIZEN, PATWARI, TEHSILDAR
-- Remove any legacy ADMIN seed user safely
DELETE FROM users WHERE role = 'ADMIN' AND email = 'admin@bhumisetu.gov.in';

-- Update user role constraint to enforce 3 roles only
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check
    CHECK (role IN ('CITIZEN', 'PATWARI', 'TEHSILDAR'));
