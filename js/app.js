/**
 * Dos Hermanos Catering System — Main Application Bootstrap (`app.js`)
 */

import { USER_ROLES, RESERVATION_STATUS, ORDER_STATUS, PAYMENT_STATUS } from './constants/enums.js';
import { initAuth, getCurrentUser, switchDemoRole } from './modules/auth/auth-service.js';
import { applyRBACRulesToDOM, hasPermission } from './modules/auth/rbac-guard.js';
import { validateReservationInput, validatePaymentInput, validateEquipmentVerification } from './contracts/validators.js';
import { calculateAvailableQuantity, calculateTotalPaid, calculateRemainingBalance, derivePaymentStatus, checkScheduleOverlap } from './utils/calculations.js';
import { showToast, formatCurrency, formatDate, renderStatusBadge } from './utils/dom.js';

// Global Demo State Store (In-Memory Master & Operational Data)
const state = {
  packages: [
    {
      package_id: 'pkg_silver',
      package_name: 'Silver Fiesta Buffet',
      package_details: 'Classic Filipino buffet includes Pork Menudo, Chicken Inasal, Pancit Canton, Steamed Rice, Buko Pandan, and Iced Tea.',
      package_price: 350,
      badge: 'Popular'
    },
    {
      package_id: 'pkg_gold',
      package_name: 'Gold Celebration Banquet',
      package_details: 'Premium banquet includes Beef Caldereta, Roast Pork Belly (Lechon Kawali), Garlic Butter Shrimp, Baked Macaroni, Steamed Rice, Mango Float, and Bottomless Iced Tea.',
      package_price: 550,
      badge: 'Best Value'
    },
    {
      package_id: 'pkg_platinum',
      package_name: 'Platinum Royal Feast',
      package_details: 'Luxury catering feast includes Whole Lechon, Beef Ribs Caldereta, Roast Chicken Rosemary, Buttered Lobster Tail, Fettuccine Alfredo, Premium Dessert Buffet, and Fresh Fruit Bar.',
      package_price: 850,
      badge: 'Luxury'
    }
  ],
  reservations: [
    {
      reservation_id: 'res_1001',
      customer_user_id: 'usr_cust_001',
      customer_name: 'Maria Santos',
      preferred_start_datetime: '2026-08-15T11:00',
      preferred_end_datetime: '2026-08-15T15:00',
      event_location: 'Grand Ballroom, Greenhills Hotel, San Juan',
      event_details: 'Golden Wedding Anniversary banquet setup.',
      guest_count: 100,
      package_id: 'pkg_gold',
      package_name: 'Gold Celebration Banquet',
      reservation_status: RESERVATION_STATUS.CONFIRMED,
      submitted_at: '2026-08-01T09:30:00Z',
      total_amount: 55500,
      total_paid: 20000,
      remaining_balance: 35500,
      payment_status: PAYMENT_STATUS.PARTIALLY_PAID
    },
    {
      reservation_id: 'res_1002',
      customer_user_id: 'usr_cust_001',
      customer_name: 'Maria Santos',
      preferred_start_datetime: '2026-08-20T18:00',
      preferred_end_datetime: '2026-08-20T22:00',
      event_location: 'QC Club Clubhouse, Quezon City',
      event_details: '18th Birthday Debut dinner setup.',
      guest_count: 80,
      package_id: 'pkg_silver',
      package_name: 'Silver Fiesta Buffet',
      reservation_status: RESERVATION_STATUS.REQUESTED,
      submitted_at: '2026-08-04T14:15:00Z',
      total_amount: 28000,
      total_paid: 0,
      remaining_balance: 28000,
      payment_status: PAYMENT_STATUS.UNPAID
    }
  ],
  schedules: [
    {
      schedule_id: 'sched_5001',
      reservation_id: 'res_1001',
      start_datetime: '2026-08-15T11:00',
      end_datetime: '2026-08-15T15:00'
    }
  ],
  inventory: [
    { inventory_item_id: 'inv_01', item_name: 'Pork Belly (Kg)', item_type: 'ingredient', quantity_on_hand: 150, quantity_reserved: 40, low_stock_threshold: 30 },
    { inventory_item_id: 'inv_02', item_name: 'Beef Brisket (Kg)', item_type: 'ingredient', quantity_on_hand: 25, quantity_reserved: 20, low_stock_threshold: 15 },
    { inventory_item_id: 'inv_03', item_name: 'Jasmine Rice (50kg Bag)', item_type: 'ingredient', quantity_on_hand: 12, quantity_reserved: 4, low_stock_threshold: 5 },
    { inventory_item_id: 'inv_04', item_name: 'Catering Paper Napkins (Pack)', item_type: 'supply', quantity_on_hand: 5, quantity_reserved: 4, low_stock_threshold: 10 }
  ],
  equipment: [
    { accountability_item_id: 'eq_item_101', accountability_id: 'acc_801', order_id: 'ord_1001', equipment_name: 'Chafing Dishes (Stainless)', released_quantity: 10, returned_quantity: 8, missing_quantity: 1, damaged_quantity: 1, is_verified: true },
    { accountability_item_id: 'eq_item_102', accountability_id: 'acc_801', order_id: 'ord_1001', equipment_name: 'Foldable Banquet Tables', released_quantity: 15, returned_quantity: 15, missing_quantity: 0, damaged_quantity: 0, is_verified: true },
    { accountability_item_id: 'eq_item_103', accountability_id: 'acc_802', order_id: 'ord_1002', equipment_name: 'High-back Tiffany Chairs', released_quantity: 80, returned_quantity: 0, missing_quantity: 0, damaged_quantity: 0, is_verified: false }
  ],
  auditTrail: [
    { audit_trail_id: 'aud_901', occurred_at: '2026-08-01T09:30:00Z', user_id: 'usr_cust_001', action_type: 'RESERVATION_SUBMITTED', record_type: 'Reservation', record_id: 'res_1001' },
    { audit_trail_id: 'aud_902', occurred_at: '2026-08-02T10:00:00Z', user_id: 'usr_staff_001', action_type: 'RESERVATION_CONFIRMED', record_type: 'Reservation', record_id: 'res_1001' },
    { audit_trail_id: 'aud_903', occurred_at: '2026-08-02T11:15:00Z', user_id: 'usr_staff_001', action_type: 'PAYMENT_RECORDED', record_type: 'PaymentTransaction', record_id: 'pay_301' }
  ]
};

// Initialize Application
document.addEventListener('DOMContentLoaded', async () => {
  console.log("Dos Hermanos PWA: Bootstrapping system...");

  // Register PWA Service Worker
  if ('serviceWorker' in navigator) {
    try {
      await navigator.serviceWorker.register('./sw.js');
      console.log("Dos Hermanos PWA: Service Worker registered successfully.");
    } catch (e) {
      console.warn("Dos Hermanos PWA: Service Worker registration skipped.", e);
    }
  }

  // Initialize Auth
  await initAuth();
  setupEventListeners();
  renderAllViews();
  applyRBACRulesToDOM();
});

// Setup View Navigation & Role Switcher
function setupEventListeners() {
  // Navigation Tabs
  document.querySelectorAll('[data-view-btn]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const targetViewId = e.target.getAttribute('data-view-btn');
      switchView(targetViewId);
    });
  });

  // Role Switcher Buttons
  document.querySelectorAll('[data-role-btn]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const roleKey = e.target.getAttribute('data-role-btn');
      switchDemoRole(roleKey);
      
      document.querySelectorAll('[data-role-btn]').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');

      const user = getCurrentUser();
      document.getElementById('userNameDisplay').textContent = user.full_name;

      applyRBACRulesToDOM();
      renderAllViews();
      showToast(`Switched active role to: ${roleKey.toUpperCase()}`, 'info');
    });
  });

  // Price Calculation on Form Input
  const packageSelect = document.getElementById('resPackage');
  const guestInput = document.getElementById('resGuestCount');
  
  function updateEstimatedPrice() {
    const selectedOption = packageSelect.options[packageSelect.selectedIndex];
    const pricePerHead = Number(selectedOption?.getAttribute('data-price') || 0);
    const guestCount = Number(guestInput.value || 0);
    const total = pricePerHead * guestCount;
    document.getElementById('estimatedPriceDisplay').textContent = formatCurrency(total);
  }

  packageSelect?.addEventListener('change', updateEstimatedPrice);
  guestInput?.addEventListener('input', updateEstimatedPrice);

  // Date Availability Check Button
  document.getElementById('btnCheckAvailability')?.addEventListener('click', () => {
    const start = document.getElementById('resStart').value;
    const end = document.getElementById('resEnd').value;
    if (!start || !end) {
      showToast("Please enter both preferred start and end dates.", "error");
      return;
    }
    const isOverlapping = checkScheduleOverlap(start, end, state.schedules);
    if (isOverlapping) {
      showToast("❌ Date Unavailable: Overlaps an existing confirmed catering event.", "error");
    } else {
      showToast("✅ Date Available! You can submit your reservation request.", "success");
    }
  });

  // Reservation Form Submission
  document.getElementById('reservationForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const user = getCurrentUser();
    
    const payload = {
      customer_user_id: user.user_id,
      package_id: document.getElementById('resPackage').value,
      guest_count: Number(document.getElementById('resGuestCount').value),
      preferred_start_datetime: document.getElementById('resStart').value,
      preferred_end_datetime: document.getElementById('resEnd').value,
      event_location: document.getElementById('resLocation').value,
      event_details: document.getElementById('resDetails').value
    };

    const validation = validateReservationInput(payload);
    if (!validation.isValid) {
      showToast(validation.errors[0].message, "error");
      return;
    }

    const selectedPkg = state.packages.find(p => p.package_id === payload.package_id);
    const totalAmount = selectedPkg.package_price * payload.guest_count;

    const newRes = {
      reservation_id: 'res_' + Math.floor(1000 + Math.random() * 9000),
      customer_user_id: user.user_id,
      customer_name: user.full_name,
      preferred_start_datetime: payload.preferred_start_datetime,
      preferred_end_datetime: payload.preferred_end_datetime,
      event_location: payload.event_location,
      event_details: payload.event_details,
      guest_count: payload.guest_count,
      package_id: payload.package_id,
      package_name: selectedPkg.package_name,
      reservation_status: RESERVATION_STATUS.REQUESTED,
      submitted_at: new Date().toISOString(),
      total_amount: totalAmount,
      total_paid: 0,
      remaining_balance: totalAmount,
      payment_status: PAYMENT_STATUS.UNPAID
    };

    state.reservations.unshift(newRes);
    
    // Add Audit Log
    state.auditTrail.unshift({
      audit_trail_id: 'aud_' + Math.floor(1000 + Math.random() * 9000),
      occurred_at: new Date().toISOString(),
      user_id: user.user_id,
      action_type: 'RESERVATION_SUBMITTED',
      record_type: 'Reservation',
      record_id: newRes.reservation_id
    });

    showToast("🎉 Reservation Request Submitted Successfully!", "success");
    e.target.reset();
    updateEstimatedPrice();
    renderAllViews();
    switchView('myBookingsView');
  });

  // Report Export Buttons
  document.getElementById('btnExportCSV')?.addEventListener('click', () => {
    showToast("📄 Exporting report to CSV format...", "info");
  });

  document.getElementById('btnPrintReport')?.addEventListener('click', () => {
    window.print();
  });
}

// Render All View Sections
function renderAllViews() {
  renderPackagesCatalog();
  renderMyBookings();
  renderStaffQueue();
  renderInventoryTable();
  renderEquipmentTable();
  renderAuditTrailTable();
  renderReportTable('sales');
}

function switchView(viewId) {
  document.querySelectorAll('.view-section').forEach(sec => sec.classList.remove('active'));
  document.querySelectorAll('.nav-item button').forEach(btn => btn.classList.remove('active'));

  const targetView = document.getElementById(viewId);
  const targetBtn = document.querySelector(`[data-view-btn="${viewId}"]`);

  if (targetView) targetView.classList.add('active');
  if (targetBtn) targetBtn.classList.add('active');
}

// Renderers for System Modules
function renderPackagesCatalog() {
  const container = document.getElementById('packagesGrid');
  if (!container) return;

  container.innerHTML = state.packages.map(pkg => `
    <div class="glass-card">
      <span class="badge badge-confirmed" style="margin-bottom: 0.5rem;">${pkg.badge}</span>
      <h3 style="margin-bottom: 0.5rem;">${pkg.package_name}</h3>
      <h4 style="color: var(--accent-gold); font-size: 1.35rem; margin-bottom: 1rem;">${formatCurrency(pkg.package_price)} <span style="font-size: 0.85rem; color: var(--text-secondary);">/ head</span></h4>
      <p style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 1.5rem;">${pkg.package_details}</p>
      <button class="btn btn-outline btn-sm" onclick="selectPackageForBooking('${pkg.package_id}')" style="width: 100%;">Select & Book</button>
    </div>
  `).join('');
}

window.selectPackageForBooking = (pkgId) => {
  const select = document.getElementById('resPackage');
  if (select) {
    select.value = pkgId;
    select.dispatchEvent(new Event('change'));
  }
  switchView('reservationView');
};

function renderMyBookings() {
  const tbody = document.getElementById('myBookingsTableBody');
  if (!tbody) return;

  tbody.innerHTML = state.reservations.map(res => `
    <tr>
      <td><strong>${res.reservation_id}</strong></td>
      <td>${res.package_name}</td>
      <td>${formatDate(res.preferred_start_datetime)}</td>
      <td>${res.guest_count} pax</td>
      <td>${renderStatusBadge(res.reservation_status)}</td>
      <td>${formatCurrency(res.total_amount)}</td>
      <td>${formatCurrency(res.total_paid)}</td>
      <td>${renderStatusBadge(res.payment_status)}</td>
    </tr>
  `).join('');
}

function renderStaffQueue() {
  const tbody = document.getElementById('staffQueueTableBody');
  if (!tbody) return;

  tbody.innerHTML = state.reservations.map(res => `
    <tr>
      <td><strong>${res.reservation_id}</strong></td>
      <td>${res.customer_name}</td>
      <td>${formatDate(res.preferred_start_datetime)}</td>
      <td>${res.event_location}</td>
      <td>${res.guest_count} pax</td>
      <td>${res.package_name}</td>
      <td>${renderStatusBadge(res.reservation_status)}</td>
      <td>
        ${res.reservation_status === RESERVATION_STATUS.REQUESTED ? 
          `<button class="btn btn-primary btn-sm" onclick="confirmReservation('${res.reservation_id}')">Confirm Schedule</button>` : 
          `<span style="color: var(--text-muted); font-size: 0.8rem;">Confirmed</span>`}
      </td>
    </tr>
  `).join('');
}

window.confirmReservation = (resId) => {
  const res = state.reservations.find(r => r.reservation_id === resId);
  if (res) {
    res.reservation_status = RESERVATION_STATUS.CONFIRMED;
    state.schedules.push({
      schedule_id: 'sched_' + Math.floor(1000 + Math.random() * 9000),
      reservation_id: resId,
      start_datetime: res.preferred_start_datetime,
      end_datetime: res.preferred_end_datetime
    });
    
    // Audit Trail
    state.auditTrail.unshift({
      audit_trail_id: 'aud_' + Math.floor(1000 + Math.random() * 9000),
      occurred_at: new Date().toISOString(),
      user_id: getCurrentUser().user_id,
      action_type: 'RESERVATION_CONFIRMED',
      record_type: 'Reservation',
      record_id: resId
    });

    showToast(`✅ Reservation ${resId} Confirmed & Scheduled!`, "success");
    renderAllViews();
  }
};

function renderInventoryTable() {
  const tbody = document.getElementById('inventoryTableBody');
  if (!tbody) return;

  tbody.innerHTML = state.inventory.map(item => {
    const available = calculateAvailableQuantity(item.quantity_on_hand, item.quantity_reserved);
    const isLow = available < item.low_stock_threshold;
    return `
      <tr>
        <td><strong>${item.inventory_item_id}</strong></td>
        <td>${item.item_name}</td>
        <td><span class="badge">${item.item_type}</span></td>
        <td>${item.quantity_on_hand}</td>
        <td>${item.quantity_reserved}</td>
        <td><strong>${available}</strong></td>
        <td>${item.low_stock_threshold}</td>
        <td>
          ${isLow ? `<span class="badge badge-alert">LOW STOCK</span>` : `<span class="badge badge-confirmed">OK</span>`}
        </td>
      </tr>
    `;
  }).join('');
}

function renderEquipmentTable() {
  const tbody = document.getElementById('equipmentTableBody');
  if (!tbody) return;

  tbody.innerHTML = state.equipment.map(eq => `
    <tr>
      <td><strong>${eq.accountability_item_id}</strong></td>
      <td>${eq.order_id}</td>
      <td>${eq.equipment_name}</td>
      <td>${eq.released_quantity}</td>
      <td>${eq.returned_quantity}</td>
      <td>${eq.missing_quantity}</td>
      <td>${eq.damaged_quantity}</td>
      <td>
        ${eq.is_verified ? `<span class="badge badge-confirmed">VERIFIED</span>` : `<span class="badge badge-unpaid">PENDING CHECK</span>`}
      </td>
      <td>
        ${!eq.is_verified ? `<button class="btn btn-outline btn-sm" onclick="verifyEquipment('${eq.accountability_item_id}')">Verify Return</button>` : `<span style="color: var(--text-muted); font-size: 0.8rem;">Checked</span>`}
      </td>
    </tr>
  `).join('');
}

window.verifyEquipment = (eqItemId) => {
  const eq = state.equipment.find(e => e.accountability_item_id === eqItemId);
  if (eq) {
    eq.returned_quantity = eq.released_quantity;
    eq.missing_quantity = 0;
    eq.damaged_quantity = 0;
    eq.is_verified = true;

    state.auditTrail.unshift({
      audit_trail_id: 'aud_' + Math.floor(1000 + Math.random() * 9000),
      occurred_at: new Date().toISOString(),
      user_id: getCurrentUser().user_id,
      action_type: 'EQUIPMENT_VERIFIED',
      record_type: 'EventEquipmentAccountabilityItem',
      record_id: eqItemId
    });

    showToast(`🔍 Equipment Return Verified for ${eq.equipment_name}`, "success");
    renderAllViews();
  }
};

function renderAuditTrailTable() {
  const tbody = document.getElementById('auditTableBody');
  if (!tbody) return;

  tbody.innerHTML = state.auditTrail.map(aud => `
    <tr>
      <td><strong>${aud.audit_trail_id}</strong></td>
      <td>${formatDate(aud.occurred_at)}</td>
      <td>${aud.user_id}</td>
      <td><span class="badge badge-confirmed">${aud.action_type}</span></td>
      <td>${aud.record_type}</td>
      <td>${aud.record_id}</td>
    </tr>
  `).join('');
}

function renderReportTable(type) {
  const header = document.getElementById('reportTableHeader');
  const tbody = document.getElementById('reportTableBody');
  if (!header || !tbody) return;

  header.innerHTML = `<th>Transaction ID</th><th>Event Location</th><th>Total Amount</th><th>Paid Amount</th><th>Balance</th><th>Payment Status</th>`;
  tbody.innerHTML = state.reservations.map(res => `
    <tr>
      <td>${res.reservation_id}</td>
      <td>${res.event_location}</td>
      <td>${formatCurrency(res.total_amount)}</td>
      <td>${formatCurrency(res.total_paid)}</td>
      <td>${formatCurrency(res.remaining_balance)}</td>
      <td>${renderStatusBadge(res.payment_status)}</td>
    </tr>
  `).join('');
}
