/**
 * BhumiSetu Role-Based Access Control (RBAC) Specification
 * Strictly 3 roles: CITIZEN, PATWARI, TEHSILDAR.
 * Corresponds to backend authorization middleware in backend/src/middleware/rbac.middleware.js.
 */

export const ROLES = {
  TEHSILDAR: 'TEHSILDAR',
  PATWARI: 'PATWARI',
  CITIZEN: 'CITIZEN',
};

export const PERMISSIONS = {
  // Audit Chain Verification
  VERIFY_AUDIT_CHAIN: 'verify_audit_chain', // TEHSILDAR only

  // Review Queue & Inspection
  ACCESS_REVIEW_QUEUE: 'access_review_queue', // TEHSILDAR, PATWARI
  LOCK_REVIEW_RECORD: 'lock_review_record',   // TEHSILDAR, PATWARI

  // Workflow Operations
  SUBMIT_OPERATOR_REVIEW: 'submit_operator_review', // PATWARI only
  SIGN_STATUTORY_DECISION: 'sign_statutory_decision', // TEHSILDAR only

  // Document Ingestion & Upload
  UPLOAD_LAND_DOCUMENT: 'upload_land_document', // CITIZEN, PATWARI, TEHSILDAR

  // Records Directory & Search
  VIEW_JURISDICTION_RECORDS: 'view_jurisdiction_records', // TEHSILDAR, PATWARI
  VIEW_OWN_CITIZEN_RECORDS: 'view_own_citizen_records',   // CITIZEN
};

/**
 * Verified Backend Permission Matrix
 */
export const ROLE_PERMISSIONS = {
  [ROLES.TEHSILDAR]: [
    PERMISSIONS.VERIFY_AUDIT_CHAIN,
    PERMISSIONS.ACCESS_REVIEW_QUEUE,
    PERMISSIONS.LOCK_REVIEW_RECORD,
    PERMISSIONS.SIGN_STATUTORY_DECISION,
    PERMISSIONS.UPLOAD_LAND_DOCUMENT,
    PERMISSIONS.VIEW_JURISDICTION_RECORDS,
  ],
  [ROLES.PATWARI]: [
    PERMISSIONS.ACCESS_REVIEW_QUEUE,
    PERMISSIONS.LOCK_REVIEW_RECORD,
    PERMISSIONS.SUBMIT_OPERATOR_REVIEW,
    PERMISSIONS.UPLOAD_LAND_DOCUMENT,
    PERMISSIONS.VIEW_JURISDICTION_RECORDS,
  ],
  [ROLES.CITIZEN]: [
    PERMISSIONS.UPLOAD_LAND_DOCUMENT,
    PERMISSIONS.VIEW_OWN_CITIZEN_RECORDS,
  ],
};

/**
 * Route RBAC Mapping
 */
export const ROUTE_ACCESS = {
  '/dashboard': [ROLES.TEHSILDAR, ROLES.PATWARI, ROLES.CITIZEN],
  '/applications': [ROLES.CITIZEN],
  '/review': [ROLES.TEHSILDAR, ROLES.PATWARI],
  '/review/:recordId': [ROLES.TEHSILDAR, ROLES.PATWARI],
  '/upload': [ROLES.CITIZEN, ROLES.PATWARI, ROLES.TEHSILDAR],
  '/records': [ROLES.TEHSILDAR, ROLES.PATWARI, ROLES.CITIZEN],
  '/records/:id': [ROLES.TEHSILDAR, ROLES.PATWARI, ROLES.CITIZEN],
  '/audit': [ROLES.TEHSILDAR, ROLES.PATWARI],
};

/**
 * Check if a role possesses a specific permission
 */
export const hasPermission = (role, permission) => {
  if (!role || !ROLE_PERMISSIONS[role]) return false;
  return ROLE_PERMISSIONS[role].includes(permission);
};

/**
 * Check if a role is permitted to access a given path
 */
export const canAccessPath = (role, path) => {
  if (!role) return false;
  if (path === '/' || path === '/dashboard') return true;
  if (path === '/applications') return role === ROLES.CITIZEN;
  if (path.startsWith('/review')) return [ROLES.TEHSILDAR, ROLES.PATWARI].includes(role);
  if (path === '/audit') return [ROLES.TEHSILDAR, ROLES.PATWARI].includes(role);
  return true;
};

/**
 * Primary Landing Route for each role post-login
 */
export const getDefaultLandingRoute = (role) => {
  switch (role) {
    case ROLES.TEHSILDAR:
      return '/review';
    case ROLES.PATWARI:
      return '/review';
    case ROLES.CITIZEN:
      return '/applications';
    default:
      return '/dashboard';
  }
};
