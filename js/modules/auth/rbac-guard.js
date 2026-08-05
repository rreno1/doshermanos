/**
 * Module 01 — Role-Based Access Control (RBAC) Guard
 * Dynamically enforces view and action restrictions based on user role.
 */

import { USER_ROLES } from '../../constants/enums.js';
import { getCurrentRole } from './auth-service.js';

const ROLE_PERMISSIONS = {
  [USER_ROLES.CUSTOMER]: [
    'view_packages',
    'check_date_availability',
    'submit_reservation',
    'view_own_reservations',
    'view_own_payments'
  ],
  [USER_ROLES.AUTHORIZED_STAFF]: [
    'view_packages',
    'check_date_availability',
    'submit_reservation',
    'view_all_reservations',
    'confirm_reservations',
    'manage_schedules',
    'manage_inventory',
    'record_payments',
    'manage_equipment',
    'generate_reports'
  ],
  [USER_ROLES.ADMINISTRATOR]: [
    'view_packages',
    'check_date_availability',
    'submit_reservation',
    'view_all_reservations',
    'confirm_reservations',
    'manage_schedules',
    'manage_inventory',
    'record_payments',
    'manage_equipment',
    'generate_reports',
    'view_audit_trails',
    'manage_system_settings'
  ]
};

export function hasPermission(permissionKey) {
  const role = getCurrentRole();
  const allowed = ROLE_PERMISSIONS[role] || [];
  return allowed.includes(permissionKey);
}

export function applyRBACRulesToDOM() {
  const currentRole = getCurrentRole();

  // Update DOM data-role attributes
  document.body.setAttribute('data-active-role', currentRole);

  // Hide/Show elements based on permission data attributes
  document.querySelectorAll('[data-perm]').forEach(el => {
    const requiredPerm = el.getAttribute('data-perm');
    if (hasPermission(requiredPerm)) {
      el.style.display = '';
    } else {
      el.style.display = 'none';
    }
  });

  // Update role badge in UI
  const roleBadge = document.getElementById('currentRoleDisplay');
  if (roleBadge) {
    roleBadge.textContent = currentRole.replace('_', ' ').toUpperCase();
    roleBadge.className = `badge badge-${currentRole}`;
  }
}
