/**
 * Module 01 — User Access & Authentication Service
 * Manages active user session, role identification, and demo role switching.
 */

import { USER_ROLES } from '../../constants/enums.js';
import { initializeFirebaseBoundary } from '../../config/firebase.js';

// Demo Mock Users for quick role testing
const DEMO_USERS = {
  [USER_ROLES.CUSTOMER]: {
    user_id: 'usr_cust_001',
    authentication_id: 'auth_cust_001',
    role_id: USER_ROLES.CUSTOMER,
    full_name: 'Maria Santos (Demo Customer)',
    contact_details: { phone: '0917-123-4567', email: 'maria@example.com', address: 'Quezon City, Metro Manila' }
  },
  [USER_ROLES.AUTHORIZED_STAFF]: {
    user_id: 'usr_staff_001',
    authentication_id: 'auth_staff_001',
    role_id: USER_ROLES.AUTHORIZED_STAFF,
    full_name: 'Juan Dela Cruz (Authorized Staff)',
    contact_details: { phone: '0918-987-6543', email: 'staff@doshermanos.com' }
  },
  [USER_ROLES.ADMINISTRATOR]: {
    user_id: 'usr_admin_001',
    authentication_id: 'auth_admin_001',
    role_id: USER_ROLES.ADMINISTRATOR,
    full_name: 'Chef Carlos Hermanos (Administrator)',
    contact_details: { phone: '0919-555-0000', email: 'admin@doshermanos.com' }
  }
};

let currentSessionUser = DEMO_USERS[USER_ROLES.CUSTOMER];
const authListeners = [];

export function getCurrentUser() {
  return currentSessionUser;
}

export function getCurrentRole() {
  return currentSessionUser ? currentSessionUser.role_id : USER_ROLES.CUSTOMER;
}

export function switchDemoRole(targetRole) {
  if (DEMO_USERS[targetRole]) {
    currentSessionUser = DEMO_USERS[targetRole];
    notifyAuthListeners();
    return currentSessionUser;
  }
  return null;
}

export function onAuthChanged(callback) {
  authListeners.push(callback);
}

function notifyAuthListeners() {
  authListeners.forEach(cb => cb(currentSessionUser));
}

export async function initAuth() {
  const firebaseResult = await initializeFirebaseBoundary();
  notifyAuthListeners();
  return { user: currentSessionUser, firebaseResult };
}
