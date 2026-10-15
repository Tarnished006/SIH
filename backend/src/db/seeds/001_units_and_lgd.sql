-- Seed data for BhumiSetu
-- Passwords are bcrypt hash for: Password@123
INSERT INTO users (id, email, password_hash, name, role, department, state_lgd_code, district_lgd_code)
VALUES 
  ('a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 'admin@bhumisetu.gov.in', '$2a$10$wB5V.3N.p1zYw/bYc2QzC.hR7TqE4jN3a6l8Y2zX0m9nB8vC7dE2G', 'National Admin', 'ADMIN', 'Dept of Land Resources', '09', '140'),
  ('b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e', 'tehsildar@lucknow.gov.in', '$2a$10$wB5V.3N.p1zYw/bYc2QzC.hR7TqE4jN3a6l8Y2zX0m9nB8vC7dE2G', 'Rajesh Sharma', 'TEHSILDAR', 'Revenue Department, Lucknow', '09', '140'),
  ('c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f', 'patwari@lucknow.gov.in', '$2a$10$wB5V.3N.p1zYw/bYc2QzC.hR7TqE4jN3a6l8Y2zX0m9nB8vC7dE2G', 'Amit Verma', 'PATWARI', 'Tehsil Sadar, Lucknow', '09', '140'),
  ('d4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a', 'citizen@india.in', '$2a$10$wB5V.3N.p1zYw/bYc2QzC.hR7TqE4jN3a6l8Y2zX0m9nB8vC7dE2G', 'Ramesh Kumar', 'CITIZEN', 'Public', '09', '140')
ON CONFLICT (email) DO NOTHING;

-- Genesis Block for Audit Ledger
INSERT INTO audit_logs (id, sequence_number, record_id, action, actor_role, prev_hash, curr_hash, delta)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  1,
  NULL,
  'GENESIS_BLOCK',
  'SYSTEM',
  '0000000000000000000000000000000000000000000000000000000000000000',
  'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
  '{"message": "BhumiSetu Tamper-Evident Audit Ledger Initialized"}'::jsonb
) ON CONFLICT (sequence_number) DO NOTHING;
