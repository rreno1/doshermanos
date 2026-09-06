import type {
  EquipmentAssignment,
  EquipmentItem,
  EquipmentTransactionRecord,
} from './equipment.types';

export type EquipmentView = 'registry' | 'assignments' | 'activity';
export type SortDirection = 'asc' | 'desc';
export type EquipmentSort = 'name' | 'available' | 'total' | 'event' | 'equipment' | 'status' | 'date' | 'type';

export function getViewDefaults(view: EquipmentView): { sortBy: EquipmentSort; direction: SortDirection } {
  if (view === 'registry') return { sortBy: 'name', direction: 'asc' };
  if (view === 'assignments') return { sortBy: 'event', direction: 'desc' };
  return { sortBy: 'date', direction: 'desc' };
}

export function filterEquipmentItems(
  items: EquipmentItem[],
  query: string,
  status: string,
  sortBy: EquipmentSort,
  direction: SortDirection,
) {
  const text = query.trim().toLocaleLowerCase();
  return [...items]
    .filter((item) => status === 'all' || (status === 'active' ? item.isActive : !item.isActive))
    .filter((item) => !text || `${item.name} ${item.unit}`.toLocaleLowerCase().includes(text))
    .sort((left, right) => compareValues(
      getEquipmentItemSortValue(left, sortBy),
      getEquipmentItemSortValue(right, sortBy),
      direction,
    ));
}

export function filterAssignments(
  assignments: EquipmentAssignment[],
  query: string,
  status: string,
  sortBy: EquipmentSort,
  direction: SortDirection,
) {
  const text = query.trim().toLocaleLowerCase();
  return [...assignments]
    .filter((assignment) => status === 'all' || assignment.status === status)
    .filter((assignment) => !text || `${assignment.equipmentName} ${assignment.packageName} ${assignment.note} ${assignment.status}`.toLocaleLowerCase().includes(text))
    .sort((left, right) => compareValues(
      getAssignmentSortValue(left, sortBy),
      getAssignmentSortValue(right, sortBy),
      direction,
    ));
}

export function filterTransactions(
  transactions: EquipmentTransactionRecord[],
  query: string,
  type: string,
  sortBy: EquipmentSort,
  direction: SortDirection,
) {
  const text = query.trim().toLocaleLowerCase();
  return [...transactions]
    .filter((transaction) => type === 'all' || transaction.type === type)
    .filter((transaction) => !text || `${transaction.equipmentName} ${transaction.recordedByName} ${transaction.note} ${transaction.type}`.toLocaleLowerCase().includes(text))
    .sort((left, right) => compareValues(
      getTransactionSortValue(left, sortBy),
      getTransactionSortValue(right, sortBy),
      direction,
    ));
}

export function getEmptyMessage(
  totalCount: number,
  visibleCount: number,
  emptyMessage: string,
  noMatchMessage: string,
) {
  if (totalCount === 0) return emptyMessage;
  if (visibleCount === 0) return noMatchMessage;
  return undefined;
}

export function getSearchPlaceholder(view: EquipmentView) {
  if (view === 'registry') return 'Search equipment';
  if (view === 'assignments') return 'Search assignments';
  return 'Search activity';
}

export function getViewLabel(view: EquipmentView) {
  if (view === 'registry') return 'Equipment registry';
  if (view === 'assignments') return 'Equipment assignments';
  return 'Equipment activity';
}

function getEquipmentItemSortValue(item: EquipmentItem, sortBy: EquipmentSort) {
  if (sortBy === 'available') return item.availableQuantity;
  if (sortBy === 'total') return item.totalQuantity;
  return item.name;
}

function getAssignmentSortValue(assignment: EquipmentAssignment, sortBy: EquipmentSort) {
  if (sortBy === 'equipment') return assignment.equipmentName;
  if (sortBy === 'status') return assignment.status;
  return assignment.eventStartDate.getTime();
}

function getTransactionSortValue(transaction: EquipmentTransactionRecord, sortBy: EquipmentSort) {
  if (sortBy === 'equipment') return transaction.equipmentName;
  if (sortBy === 'type') return transaction.type;
  return transaction.createdAt.getTime();
}

function compareValues(left: string | number, right: string | number, direction: SortDirection) {
  const result = typeof left === 'number' && typeof right === 'number'
    ? left - right
    : String(left).localeCompare(String(right), 'en-PH', { sensitivity: 'base' });
  return direction === 'asc' ? result : -result;
}
