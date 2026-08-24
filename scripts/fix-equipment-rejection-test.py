from pathlib import Path

path = Path('firebase/tests/equipment.rules.test.mjs')
content = path.read_text(encoding='utf-8')
old = """  await assertSucceeds(
    updateDoc(doc(database, 'reservations', 'reservation-a'), {
      status: 'rejected',
      updatedAt: serverTimestamp(),
    }),
  );

  const batch = writeBatch(database);
"""
new = """  const rejectionBatch = writeBatch(database);
  rejectionBatch.update(doc(database, 'reservations', 'reservation-a'), {
    status: 'rejected',
    updatedAt: serverTimestamp(),
  });
  rejectionBatch.set(doc(database, 'reservationDecisions', 'reservation-a-rejected'), {
    reservationId: 'reservation-a',
    customerId: 'customer-a',
    previousStatus: 'pending_review',
    newStatus: 'rejected',
    decidedBy: 'staff-a',
    decidedByName: 'Staff A',
    createdAt: serverTimestamp(),
  });
  await assertSucceeds(rejectionBatch.commit());

  const batch = writeBatch(database);
"""
if old not in content:
    raise SystemExit('Expected equipment rejection setup not found')
path.write_text(content.replace(old, new, 1), encoding='utf-8')
