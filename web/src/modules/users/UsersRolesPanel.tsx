import { useEffect, useMemo, useState } from 'react';
import { useToast } from '@core/app/ToastProvider';
import {
  ManagementFilterField,
  ManagementSelect,
  ManagementTableFrame,
  ManagementToolbar,
  useManagementPage,
} from '@shared/ui/ManagementControls';
import type { UserProfile, UserRole, UserStatus } from '@modules/auth/auth.types';
import { subscribeToUsers, updateUserAccess } from './users.service';
import './users.css';

type UserSort = 'name' | 'role' | 'status';
type SortDirection = 'asc' | 'desc';

type UsersRolesPanelProps = {
  currentUserId: string;
  currentUserName: string;
};

export function UsersRolesPanel({ currentUserId, currentUserName }: UsersRolesPanelProps) {
  const { showToast } = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [queryText, setQueryText] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState<UserSort>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [savingUserId, setSavingUserId] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setHasError(false);
    return subscribeToUsers(
      (nextUsers) => {
        setUsers(nextUsers);
        setIsLoading(false);
      },
      () => {
        setHasError(true);
        setIsLoading(false);
      },
    );
  }, []);

  const visibleUsers = useMemo(
    () => filterUsers(users, queryText, roleFilter, statusFilter, sortBy, sortDirection),
    [users, queryText, roleFilter, statusFilter, sortBy, sortDirection],
  );
  const page = useManagementPage(
    visibleUsers,
    `${queryText}|${roleFilter}|${statusFilter}|${sortBy}|${sortDirection}`,
  );
  const emptyMessage = getUserEmptyMessage(users.length, visibleUsers.length);

  function updateDraft(userId: string, change: Partial<Pick<UserProfile, 'role' | 'status'>>) {
    setUsers((currentUsers) => currentUsers.map((user) => (user.id === userId ? { ...user, ...change } : user)));
  }

  async function saveUser(user: UserProfile) {
    setSavingUserId(user.id);
    try {
      await updateUserAccess(
        user.id,
        user.role,
        user.status,
        { id: currentUserId, displayName: currentUserName },
      );
      showToast({ message: `${user.displayName}'s access was updated.`, tone: 'success' });
    } catch {
      showToast({ message: 'Access change could not be saved.', tone: 'error' });
    } finally {
      setSavingUserId(null);
    }
  }

  function resetFilters() {
    setRoleFilter('all');
    setStatusFilter('all');
    setSortBy('name');
    setSortDirection('asc');
  }

  return (
    <section className="users-section" aria-label="Users and roles">
      <ManagementToolbar
        summary={[
          { label: 'profiles', value: users.length },
          { label: 'admins', value: users.filter((user) => user.role === 'admin').length },
          { label: 'staff', value: users.filter((user) => user.role === 'staff').length },
          { label: 'customers', value: users.filter((user) => user.role === 'customer').length },
        ]}
        searchValue={queryText}
        searchPlaceholder="Search users"
        onSearchChange={setQueryText}
        filterContent={(
          <>
            <ManagementFilterField label="Role">
              <ManagementSelect
                value={roleFilter}
                options={[
                  { value: 'all', label: 'All roles' },
                  { value: 'admin', label: 'Administrator' },
                  { value: 'staff', label: 'Staff' },
                  { value: 'customer', label: 'Customer' },
                ]}
                onChange={setRoleFilter}
                ariaLabel="Filter users by role"
              />
            </ManagementFilterField>
            <ManagementFilterField label="Status">
              <ManagementSelect
                value={statusFilter}
                options={[
                  { value: 'all', label: 'All statuses' },
                  { value: 'active', label: 'Active' },
                  { value: 'inactive', label: 'Inactive' },
                  { value: 'suspended', label: 'Suspended' },
                ]}
                onChange={setStatusFilter}
                ariaLabel="Filter users by status"
              />
            </ManagementFilterField>
            <ManagementFilterField label="Sort by">
              <ManagementSelect
                value={sortBy}
                options={[
                  { value: 'name', label: 'Name' },
                  { value: 'role', label: 'Role' },
                  { value: 'status', label: 'Status' },
                ]}
                onChange={setSortBy}
                ariaLabel="Sort users by"
              />
            </ManagementFilterField>
            <ManagementFilterField label="Direction">
              <ManagementSelect
                value={sortDirection}
                options={[
                  { value: 'asc', label: 'Ascending' },
                  { value: 'desc', label: 'Descending' },
                ]}
                onChange={setSortDirection}
                ariaLabel="User sort direction"
              />
            </ManagementFilterField>
            <button type="button" className="management-secondary-button" onClick={resetFilters}>
              Reset filters
            </button>
          </>
        )}
      />

      <ManagementTableFrame
        loadingMessage={isLoading ? 'Loading user profiles…' : undefined}
        errorMessage={!isLoading && hasError ? 'Users could not be loaded.' : undefined}
        emptyMessage={!isLoading && !hasError ? emptyMessage : undefined}
        pagination={!isLoading && !hasError && visibleUsers.length > 0 ? {
          page: page.page,
          totalItems: visibleUsers.length,
          onPageChange: page.setPage,
        } : undefined}
      >
        <div className="management-table-wrap">
          <table className="management-table">
            <thead>
              <tr>
                <th scope="col" className="col-primary">User</th>
                <th scope="col" className="col-secondary">Role</th>
                <th scope="col" className="col-status">Status</th>
                <th scope="col" className="col-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {page.pageItems.map((user) => {
                const isCurrentUser = user.id === currentUserId;
                const disabled = isCurrentUser || savingUserId === user.id;
                return (
                  <tr key={user.id}>
                    <td className="col-primary">
                      <div className="management-table-primary">
                        <strong>{user.displayName}</strong>
                        <span>{isCurrentUser ? 'Current account' : `User ${shortId(user.id)}`}</span>
                      </div>
                    </td>
                    <td className="col-secondary">
                      <ManagementSelect<UserRole>
                        value={user.role}
                        options={[
                          { value: 'customer', label: 'Customer' },
                          { value: 'staff', label: 'Staff' },
                          { value: 'admin', label: 'Administrator' },
                        ]}
                        disabled={disabled}
                        onChange={(role) => updateDraft(user.id, { role })}
                        ariaLabel={`Role for ${user.displayName}`}
                      />
                    </td>
                    <td className="col-status">
                      <ManagementSelect<UserStatus>
                        value={user.status}
                        options={[
                          { value: 'active', label: 'Active' },
                          { value: 'inactive', label: 'Inactive' },
                          { value: 'suspended', label: 'Suspended' },
                        ]}
                        disabled={disabled}
                        onChange={(status) => updateDraft(user.id, { status })}
                        ariaLabel={`Status for ${user.displayName}`}
                      />
                    </td>
                    <td className="col-actions">
                      <div className="management-table-actions">
                        <button
                          className="management-primary-button"
                          type="button"
                          disabled={disabled}
                          onClick={() => void saveUser(user)}
                        >
                          {getSaveButtonLabel(user.id, currentUserId, savingUserId)}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </ManagementTableFrame>

      <p className="users-note">Your current administrator account cannot change its own role or status here.</p>
    </section>
  );
}

function getUserEmptyMessage(totalUsers: number, visibleUsers: number) {
  if (totalUsers === 0) return 'No users yet.';
  if (visibleUsers === 0) return 'No users match the current view.';
  return undefined;
}

function getSaveButtonLabel(userId: string, currentUserId: string, savingUserId: string | null) {
  if (savingUserId === userId) return 'Saving…';
  if (userId === currentUserId) return 'Protected';
  return 'Save';
}

function getUserSortValue(user: UserProfile, sortBy: UserSort) {
  if (sortBy === 'role') return user.role;
  if (sortBy === 'status') return user.status;
  return user.displayName;
}

function filterUsers(users: UserProfile[], query: string, role: string, status: string, sortBy: UserSort, direction: SortDirection) {
  const text = query.trim().toLocaleLowerCase();
  return [...users]
    .filter((user) => role === 'all' || user.role === role)
    .filter((user) => status === 'all' || user.status === status)
    .filter((user) => !text || `${user.displayName} ${user.id} ${user.role} ${user.status}`.toLocaleLowerCase().includes(text))
    .sort((left, right) => {
      const leftValue = getUserSortValue(left, sortBy);
      const rightValue = getUserSortValue(right, sortBy);
      const result = leftValue.localeCompare(rightValue, 'en-PH', { sensitivity: 'base' });
      return direction === 'asc' ? result : -result;
    });
}

function shortId(value: string) {
  return value.length <= 8 ? value : value.slice(0, 8);
}
