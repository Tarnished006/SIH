/**
 * BhumiSetu Staff Account Provisioning Script
 * 
 * Safely provisions initial staff accounts (Patwari/Operator and Tehsildar).
 * Idempotent: Can be run repeatedly without duplicating accounts.
 * Passwords are read from environment variables or secure defaults.
 * 
 * Usage:
 *   node src/scripts/provision-staff.js
 *   node src/scripts/provision-staff.js --reset-passwords
 */

import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import prisma from '../config/prisma.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const resetPasswords = process.argv.includes('--reset-passwords');

const STAFF_ACCOUNTS = [
  {
    role: 'PATWARI',
    email: (process.env.PATWARI_EMAIL || 'patwari@bhumisetu.gov.in').toLowerCase().trim(),
    name: process.env.PATWARI_NAME || 'Smt. Lakshmi Devi (Patwari)',
    defaultPassword: process.env.PATWARI_PASSWORD || 'Patwari@2026!',
    department: 'Revenue Department - Land Records Division',
    stateLgd: '29', // Karnataka
    districtLgd: '572', // Bengaluru Urban
  },
  {
    role: 'TEHSILDAR',
    email: (process.env.TEHSILDAR_EMAIL || 'tehsildar@bhumisetu.gov.in').toLowerCase().trim(),
    name: process.env.TEHSILDAR_NAME || 'Shri R. K. Hegde (Tahsildar)',
    defaultPassword: process.env.TEHSILDAR_PASSWORD || 'Tehsildar@2026!',
    department: 'Revenue Department - Taluk Executive Office',
    stateLgd: '29', // Karnataka
    districtLgd: '572', // Bengaluru Urban
  },
];

export async function provisionStaff() {
  console.log('----------------------------------------------------');
  console.log('BhumiSetu: Provisioning Staff Accounts');
  console.log('----------------------------------------------------');

  for (const staff of STAFF_ACCOUNTS) {
    try {
      const existing = await prisma.user.findUnique({
        where: { email: staff.email },
      });

      if (existing) {
        if (resetPasswords) {
          const passwordHash = await bcrypt.hash(staff.defaultPassword, 10);
          await prisma.user.update({
            where: { email: staff.email },
            data: {
              passwordHash,
              role: staff.role,
              name: staff.name,
              department: staff.department,
            },
          });
          console.log(`[UPDATED] Staff account updated with new credentials: ${staff.email} (${staff.role})`);
        } else {
          console.log(`[EXISTS]  Staff account already exists: ${staff.email} (${staff.role}). Kept intact.`);
        }
      } else {
        const passwordHash = await bcrypt.hash(staff.defaultPassword, 10);
        await prisma.user.create({
          data: {
            email: staff.email,
            passwordHash,
            name: staff.name,
            role: staff.role,
            department: staff.department,
            stateLgdCode: staff.stateLgd,
            districtLgdCode: staff.districtLgd,
          },
        });
        console.log(`[CREATED] Staff account created: ${staff.email} (${staff.role})`);
      }
    } catch (err) {
      console.error(`[ERROR]   Failed to provision ${staff.email}:`, err.message);
      throw err;
    }
  }

  console.log('----------------------------------------------------');
  console.log('Staff provisioning complete.');
  console.log('Patwari:   patwari@bhumisetu.gov.in');
  console.log('Tehsildar: tehsildar@bhumisetu.gov.in');
  console.log('----------------------------------------------------');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  provisionStaff()
    .then(() => {
      process.exit(0);
    })
    .catch((err) => {
      console.error('Fatal provisioning error:', err);
      process.exit(1);
    });
}
