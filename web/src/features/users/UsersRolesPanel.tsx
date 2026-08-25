import { useEffect, useMemo, useState } from 'react';
import {
  ManagementFilterField,
  ManagementPagination,
  ManagementTabs,
  ManagementToolbar,
  useManagementPage,
} from '../../app/ManagementControls';
import type { UserProfile, UserRole, UserStatus } from '../auth/auth.types';
import { subscribeToUsers, updateUserAccess } from './users.service';
import './users.css';

type UserSort = 'name' | 'role' | 'status';
type SortDirection = 'asc' | 'desc';

const tabs = [{ value: 'users', label: 'Users' }] as const;

export function UsersRolesPanel({ currentUserId }: { currentUserId: string }) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [queryText, setQueryText] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState<UserSort>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [savingUserId, setSavingUserId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

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

  function updateDraft(userId: string, change: Partial<Pick<UserProfile, 'role' | 'status'>>) {
    setUsers((currentUsers) => currentUsers.map((user) => (user.id === userId ? { ...user, ...change } : user)));
  }

  async function saveUser(user: UserProfile) {
    setSavingUserId(user.id);
    setMessage(null);
    try {
      await updateUserAccess(user.id, user.role, user.status);
      setMessage(`${user.displayName}'s access was updated.`);
    } catch {
      setMessage('Access change could not be saved.');
    } finally {
      setSavingUserId(null);
    }
  }

  return (
    <section className="users-section" aria-label="Users and roles">
      <ManagementTabs value="users" options={[...tabs]} onChange={() => undefined} label="User views" />

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
              <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}>
                <option value="all">All roles</option>
                <option value="admin">Administrator</option>
                <option value="staff">Staff</option>
                <option value="customer">Customer</option>
              </select>
            </ManagementFilterField>
            <ManagementFilterField label="Status">
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <option value="all">All statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
            </ManagementFilterField>
            <ManagementFilterField label="Sort by">
              <select value={sortBy} onChange={(event) => setSortBy(event.target.value as UserSort)}>
                <option value="name">Name</option>
                <option value="role">Role</option>
                <option value="status">Status</option>
              </select>
            </ManagementFilterField>
            <ManagementFilterField label="Direction">
              <select value={sortDirection} onChange={(event) => setSortDirection(event.target.value as SortDirection)}>
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </select>
            </ManagementFilterField>
            <button
              type="button"
              className="management-secondary-button"
              onClick={() => {
                setRoleFilter('all');
                setStatusFilter('all');
                setSortBy('name');
                setSortDirection('asc');
              }}
            >
              Reset filters
            </button>
          </>
        )}
      />

      {message ? <div className="users-message" role="status">{message}</div> : null}
      {renderContent()}
      <p className="users-note">Your current administrator account cannot change its own role or status here.</p>
    </section>
  );

  function renderContent() {
    if (isLoading) return <UsersStatus message="Loading users…" />;
    if (hasError) return <UsersStatus message="Users could not be loaded." error />;
    if (visibleUsers.length === 0) {
      return <UsersStatus message={users.length === 0 ? 'No users yet.' : 'No users match the current view.'} />;
    }

    return (
      <>
        <div className="management-table-wrap">
          <table className="management-table">
            <thead>
              <tr><th>User</th><th>Role</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {page.pageItems.map((user) => {
                const isCurrentUser = user.id === currentUserId;
                return (
                  <tr key={user.id}>
                    <td>
                      <div className="management-table-primary">
                        <strong>{user.displayName}</strong>
                        <span>{isCurrentUser ? 'Current account' : `User ${shortId(user.id)}`}</span>
                      </div>
                    </td>
                    <td>
                      <select
                        aria-label={`Role for ${user.displayName}`}
                        value={user.role}
                        disabled={isCurrentUser || savingUserId === user.id}
                        onChange={(event) => updateDraft(user.id, { role: event.target.value as UserRole })}
                      >
                        <option value="customer">Customer</option><option value="staff">Staff</option><option value="admin">Administrator</option>
                      </select>
                    </td>
                    <td>
                      <select
                        aria-label={`Status for ${user.displayName}`}
                        value={user.status}
                        disabled={isCurrentUser || savingUserId === user.id}
                        onChange={(event) => updateDraft(user.id, { status: event.target.value as UserStatus })}
                      >
                        <option value="active">Active</option><option value="inactive">Inactive</option><option value="suspended">Suspended</option>
                      </select>
                    </td>
                    <td>
                      <div className="management-table-actions">
                        <button
                          className="management-primary-button"
                          type="button"
                          disabled={isCurrentUser || savingUserId === user.id}
                          onClick={() => void saveUser(user)}
                        >
                          {savingUserId === user.id ? 'Saving…' : isCurrentUser ? 'Protected' : 'Save'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <ManagementPagination page={page.page} totalItems={visibleUsers.length} onPageChange={page.setPage} />
      </>
    );
  }
}

function filterUsers(users: UserProfile[], query: string, role: string, status: string, sortBy: UserSort, direction: SortDirection) {
  const text = query.trim().toLocaleLowerCase();
  return [...users]
    .filter((user) => role === 'all' || user.role === role)
    .filter((user) => status === 'all' || user.status === status)
    .filter((user) => !text || `${user.displayName} ${user.id} ${user.role} ${user.status}`.toLocaleLowerCase().includes(text))
    .sort((left, right) => {
      const leftValue = sortBy === 'role' ? left.role : sortBy === 'status' ? left.status : left.displayName;
      const rightValue = sortBy === 'role' ? right.role : sortBy === 'status' ? right.status : right.displayName;
      const result = leftValue.localeCompare(rightValue, 'en-PH', { sensitivity: 'base' });
      return direction === 'asc' ? result : -result;
    });
}

function UsersStatus({ message, error = false }: { message: string; error?: boolean }) {
  return <div className={error ? 'management-empty-state management-empty-state-error' : 'management-empty-state'} role={error ? 'alert' : 'status'}>{message}</div>;
}

function shortId(value: string) { return value.length <= 8 ? value : value.slice(0, 8); }
