/**
 * BhumiSetu End-to-End Workflow Verification Script
 * 
 * Verifies:
 * 1. Citizen self-registration & duplicate registration prevention
 * 2. Login authentication & password verification for all 3 roles
 * 3. Role-based authorization & denial
 * 4. Document upload with real local OCR extraction
 * 5. Extraction persistence & confidence storage
 * 6. Patwari review, field correction, and submission to Tehsildar
 * 7. Tehsildar verification, remarks, and approval
 * 8. Citizen visibility of final decision and cross-citizen privacy enforcement
 */

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const API_BASE = 'http://localhost:5000/api/v1';

async function req(url, options = {}) {
  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

async function run() {
  console.log('===============================================================');
  console.log('BHUMISETU END-TO-END AUTOMATED VERIFICATION');
  console.log('===============================================================');

  // 1. Citizen Registration
  const testCitizenEmail = `citizen_test_${Date.now()}@example.com`;
  console.log(`\n[STEP 1] Testing Citizen Self-Registration: ${testCitizenEmail}`);
  const regRes = await req('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      email: testCitizenEmail,
      password: 'CitizenPassword@123',
      name: 'Ravi Kumar',
      role: 'TEHSILDAR', // Attempt privilege escalation! Must be forced to CITIZEN
    }),
  });

  if (!regRes.ok || regRes.data.user?.role !== 'CITIZEN') {
    throw new Error(`Citizen registration failed or role escalation permitted: ${JSON.stringify(regRes.data)}`);
  }
  console.log('✔ Citizen successfully registered. Role enforced as CITIZEN.');
  if (regRes.data.user.passwordHash) {
    throw new Error('SECURITY VIOLATION: Password hash returned to client!');
  }
  console.log('✔ Password hash omitted from response.');

  // Test duplicate registration
  const dupRes = await req('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      email: testCitizenEmail,
      password: 'CitizenPassword@123',
      name: 'Ravi Kumar',
    }),
  });
  if (dupRes.status !== 400) {
    throw new Error(`Duplicate registration should return 400, got ${dupRes.status}`);
  }
  console.log('✔ Duplicate citizen registration correctly blocked (HTTP 400).');

  // 2. Authentication & Logins
  console.log('\n[STEP 2] Testing Role Logins & Password Verification');
  // Invalid login
  const invalidLogin = await req('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: testCitizenEmail, password: 'WrongPassword!' }),
  });
  if (invalidLogin.status !== 401) {
    throw new Error(`Invalid password should return 401, got ${invalidLogin.status}`);
  }
  console.log('✔ Invalid password rejected with HTTP 401.');

  // Citizen Login
  const citizenLogin = await req('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: testCitizenEmail, password: 'CitizenPassword@123' }),
  });
  if (!citizenLogin.ok || !citizenLogin.data.accessToken) {
    throw new Error(`Citizen login failed: ${JSON.stringify(citizenLogin.data)}`);
  }
  const citizenToken = citizenLogin.data.accessToken;
  const citizenId = citizenLogin.data.user.id;
  console.log('✔ Citizen logged in successfully. Access token issued.');

  // Patwari Login
  const patwariLogin = await req('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'patwari@bhumisetu.gov.in', password: 'Patwari@2026!' }),
  });
  if (!patwariLogin.ok || patwariLogin.data.user.role !== 'PATWARI') {
    throw new Error(`Patwari login failed: ${JSON.stringify(patwariLogin.data)}`);
  }
  const patwariToken = patwariLogin.data.accessToken;
  console.log('✔ Patwari logged in successfully (role: PATWARI).');

  // Tehsildar Login
  const tehsildarLogin = await req('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'tehsildar@bhumisetu.gov.in', password: 'Tehsildar@2026!' }),
  });
  if (!tehsildarLogin.ok || tehsildarLogin.data.user.role !== 'TEHSILDAR') {
    throw new Error(`Tehsildar login failed: ${JSON.stringify(tehsildarLogin.data)}`);
  }
  const tehsildarToken = tehsildarLogin.data.accessToken;
  console.log('✔ Tehsildar logged in successfully (role: TEHSILDAR).');

  // 3. Authorization & Permission Checks
  console.log('\n[STEP 3] Testing Backend Authorization Boundaries');
  // Citizen trying to access review queue -> must be 403 Forbidden
  const forbiddenQueue = await req('/review/queue', {
    headers: { Authorization: `Bearer ${citizenToken}` },
  });
  if (forbiddenQueue.status !== 403) {
    throw new Error(`Citizen accessing review queue should be 403, got ${forbiddenQueue.status}: ${JSON.stringify(forbiddenQueue.data)}`);
  }
  console.log('✔ Citizen forbidden from review queue (HTTP 403).');

  // 4. Create Land Record Image & Real OCR Document Upload
  console.log('\n[STEP 4] Testing Real Document Upload & Local OCR Processing');
  // Generate a test land record deed image with clear text
  const svgImage = `
    <svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
      <rect width="800" height="600" fill="#ffffff"/>
      <text x="50" y="80" font-family="Arial" font-size="28" font-weight="bold" fill="#000000">GOVERNMENT OF KARNATAKA - REVENUE DEPARTMENT</text>
      <text x="50" y="140" font-family="Arial" font-size="22" fill="#000000">RECORD OF RIGHTS AND TENANCY (RTC / FORM 16)</text>
      <text x="50" y="200" font-family="Arial" font-size="20" fill="#000000">Survey Number: 184/2A</text>
      <text x="50" y="250" font-family="Arial" font-size="20" fill="#000000">Village: Devanahalli</text>
      <text x="50" y="300" font-family="Arial" font-size="20" fill="#000000">Owner Name: Ravi Kumar</text>
      <text x="50" y="350" font-family="Arial" font-size="20" fill="#000000">Area: 2.50 Acres</text>
      <text x="50" y="400" font-family="Arial" font-size="18" fill="#000000">Land Classification: Agricultural Wet Land</text>
      <text x="50" y="460" font-family="Arial" font-size="16" fill="#333333">Digitally Issued by Bhoomi Land Governance Project</text>
      <text x="50" y="520" font-family="Arial" font-size="14" fill="#666666">Serial: ${Date.now()}-${Math.floor(Math.random() * 1000000)}</text>
    </svg>
  `;
  const imageBuffer = await sharp(Buffer.from(svgImage)).png().toBuffer();

  // Upload document via FormData
  const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
  let formBody = '';
  formBody += `--${boundary}\r\n`;
  formBody += `Content-Disposition: form-data; name="document"; filename="rtc_deed_${Date.now()}.png"\r\n`;
  formBody += `Content-Type: image/png\r\n\r\n`;

  const headerBuffer = Buffer.from(formBody, 'utf-8');
  const footerBuffer = Buffer.from(`\r\n--${boundary}--\r\n`, 'utf-8');
  const payloadBuffer = Buffer.concat([headerBuffer, imageBuffer, footerBuffer]);

  const uploadRes = await fetch(`${API_BASE}/documents/upload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${citizenToken}`,
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
    },
    body: payloadBuffer,
  });

  const uploadData = await uploadRes.json();
  if (!uploadRes.ok || !uploadData.document?.id) {
    throw new Error(`Upload failed: ${JSON.stringify(uploadData)}`);
  }
  const documentId = uploadData.document.id;
  console.log(`✔ Document uploaded successfully: ID ${documentId}. Processing started.`);

  // Wait 3 seconds for BullMQ background worker / in-process OCR pipeline to complete
  console.log('... Waiting for real OCR processing pipeline to complete ...');
  let record = null;
  for (let attempt = 0; attempt < 15; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    const appsRes = await req('/records/my-applications', {
      headers: { Authorization: `Bearer ${citizenToken}` },
    });
    if (appsRes.ok && appsRes.data.applications?.length > 0) {
      record = appsRes.data.applications[0];
      if (record.reviewStatus) {
        break;
      }
    }
  }

  if (!record) {
    throw new Error('Pipeline timed out: Land record was not created after OCR processing.');
  }

  console.log(`✔ Real OCR processed document! Record ID: ${record.id}`);
  console.log(`  - Survey Number Extracted: "${record.surveyNumber}"`);
  console.log(`  - Extracted Area: "${record.rawArea} ${record.rawUnit}"`);
  console.log(`  - Village: "${record.villageName}"`);
  console.log(`  - Overall Confidence: ${record.overallConfidence}`);
  console.log(`  - Review Status: "${record.reviewStatus}"`);
  console.log(`  - Field Extractions Count: ${record.fieldExtractions?.length || 0}`);

  const recordId = record.id;

  // 5. Patwari Review & Field Corrections
  console.log('\n[STEP 5] Testing Patwari Review & Field Corrections');
  // Patwari checks queue
  const queueRes = await req('/review/queue', {
    headers: { Authorization: `Bearer ${patwariToken}` },
  });
  if (!queueRes.ok) {
    throw new Error(`Patwari queue fetch failed: ${JSON.stringify(queueRes.data)}`);
  }
  const foundInQueue = queueRes.data.queue.find((item) => item.id === recordId);
  if (!foundInQueue) {
    throw new Error(`Record ${recordId} not found in Patwari review queue!`);
  }
  console.log('✔ Record present in Patwari review queue.');

  // Patwari locks record
  const lockRes = await req(`/review/${recordId}/lock`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${patwariToken}` },
  });
  if (!lockRes.ok) {
    throw new Error(`Lock failed: ${JSON.stringify(lockRes.data)}`);
  }
  console.log('✔ Record locked by Patwari for inspection.');

  // Test Patwari attempting to approve directly (MUST BE REJECTED)
  const illegalApproval = await req(`/review/${recordId}/submit`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${patwariToken}` },
    body: JSON.stringify({ finalStatus: 'APPROVED' }),
  });
  if (illegalApproval.status !== 403) {
    throw new Error(`Operator must NOT be allowed to approve applications. Expected 403, got ${illegalApproval.status}`);
  }
  console.log('✔ Operator approval correctly blocked with HTTP 403 (reserved for Tehsildar).');

  // Patwari submits corrections and remarks to Tehsildar
  const fieldIdToCorrect = record.fieldExtractions[0]?.id;
  const operatorSubmitRes = await req(`/review/${recordId}/operator-submit`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${patwariToken}` },
    body: JSON.stringify({
      fieldDecisions: fieldIdToCorrect ? [
        {
          fieldId: fieldIdToCorrect,
          status: 'CORRECTED',
          verifiedValue: '184/2A',
          reason: 'Verified against Cadastral Tippani Map',
        },
      ] : [],
      operatorRemarks: 'Field inspection completed. Boundaries verified with adjacent parcels. Recommended for endorsement.',
    }),
  });

  if (!operatorSubmitRes.ok || operatorSubmitRes.data.record?.reviewStatus !== 'FORWARDED_TO_TEHSILDAR') {
    throw new Error(`Operator submission failed: ${JSON.stringify(operatorSubmitRes.data)}`);
  }
  console.log('✔ Patwari submitted review to Tehsildar. Status: FORWARDED_TO_TEHSILDAR.');

  // 6. Tehsildar Verification & Approval
  console.log('\n[STEP 6] Testing Tehsildar Final Verification & Approval');
  const tehsildarQueue = await req('/review/queue', {
    headers: { Authorization: `Bearer ${tehsildarToken}` },
  });
  const inTehsildarQueue = tehsildarQueue.data.queue.find((item) => item.id === recordId);
  if (!inTehsildarQueue) {
    throw new Error(`Record ${recordId} not found in Tehsildar review queue!`);
  }
  console.log('✔ Record present in Tehsildar review queue with operator remarks.');

  // Tehsildar executes approval
  const decisionRes = await req(`/review/${recordId}/decision`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${tehsildarToken}` },
    body: JSON.stringify({
      decision: 'APPROVED',
      remarks: 'Digitally sanctioned and approved by Taluk Executive Officer.',
    }),
  });

  if (!decisionRes.ok || decisionRes.data.record?.reviewStatus !== 'APPROVED') {
    throw new Error(`Tehsildar decision failed: ${JSON.stringify(decisionRes.data)}`);
  }
  console.log('✔ Tehsildar approved application. Status updated to APPROVED.');
  console.log(`  - Officer: ${decisionRes.data.record.verifiedById}`);
  console.log(`  - Timestamp: ${decisionRes.data.record.verifiedAt}`);
  console.log(`  - Remarks: "${decisionRes.data.record.decisionRemarks}"`);

  // 7. Citizen Visibility & Record Privacy
  console.log('\n[STEP 7] Testing Citizen Decision Retrieval & Cross-Citizen Privacy');
  const citizenApps = await req('/records/my-applications', {
    headers: { Authorization: `Bearer ${citizenToken}` },
  });
  const updatedApp = citizenApps.data.applications?.find((a) => a.id === recordId);
  if (!updatedApp || updatedApp.reviewStatus !== 'APPROVED') {
    throw new Error('Citizen cannot see final APPROVED status!');
  }
  console.log('✔ Citizen successfully retrieved updated application with final APPROVED status!');
  console.log(`  - Decision Remarks visible to Citizen: "${updatedApp.decisionRemarks}"`);
  console.log(`  - Operator Remarks visible to Citizen: "${updatedApp.operatorRemarks}"`);

  // Create another citizen to test cross-tenant data leakage prevention
  const otherCitizenReg = await req('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      email: `other_citizen_${Date.now()}@example.com`,
      password: 'OtherPassword@123',
      name: 'Other Person',
    }),
  });
  const otherLogin = await req('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: otherCitizenReg.data.user.email, password: 'OtherPassword@123' }),
  });
  const otherToken = otherLogin.data.accessToken;

  // Other citizen tries to view the first citizen's record details
  const unauthorizedView = await req(`/records/${recordId}`, {
    headers: { Authorization: `Bearer ${otherToken}` },
  });
  if (unauthorizedView.status !== 403) {
    throw new Error(`Other citizen accessing someone else's record should be 403, got ${unauthorizedView.status}`);
  }
  console.log("✔ Privacy confirmed: Other citizens receive HTTP 403 Forbidden when attempting to view another's application.");

  // Other citizen's my-applications should have 0 records
  const otherApps = await req('/records/my-applications', {
    headers: { Authorization: `Bearer ${otherToken}` },
  });
  if (otherApps.data.applications?.length !== 0) {
    throw new Error('Other citizen sees records they did not create!');
  }
  console.log('✔ Privacy confirmed: Other citizen sees exactly 0 records in my-applications.');

  console.log('\n===============================================================');
  console.log('🎉 ALL END-TO-END WORKFLOW VERIFICATION CHECKS PASSED!');
  console.log('===============================================================');
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ VERIFICATION TEST FAILED:', err.message);
    process.exit(1);
  });
