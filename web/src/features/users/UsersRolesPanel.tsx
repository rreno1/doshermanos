import { useMemo, useState, useEffect } from 'react';
import type { UserProfile, UserRole, UserStatus } from '../auth/auth.types';
import { subscribeToUsers, updateUserAccess } from './users.service';
import './users.css';

export function UsersRolesPanel({ currentUserId }: { currentUserId: string }) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [queryText, setQueryText] = useState('');
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

  const visibleUsers = useMemo(() => {
    const normalizedQuery = queryText.trim().toLocaleLowerCase();

    if (!normalizedQuery) {
      return users;
    }

    return users.filter((user) =>
      [user.displayName, user.id, user.role, user.status]
        .join(' ')
        .toLocaleLowerCase()
        .includes(normalizedQuery),
    );
  }, [queryText, users]);

  function updateDraft(userId: string, change: Partial<Pick<UserProfile, 'role' | 'status'>>) {
    setUsers((currentUsers) =>
      currentUsers.map((user) => (user.id === userId ? { ...user, ...change } : user)),
    );
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
      <div className="users-heading">
        <label className="users-search">
          <span>Search</span>
          <input
            type="search"
            value={queryText}
            placeholder="Name, role, status, or user ID"
            onChange={(event) => setQueryText(event.target.value)}
          />
        </label>
      </div>

      <div className="users-summary" aria-label="User summary">
        <span><strong>{users.length}</strong> profiles</span>
        <span><strong>{users.filter((user) => user.role === 'admin').length}</strong> admins</span>
        <span><strong>{users.filter((user) => user.role === 'staff').length}</strong> staff</span>
        <span><strong>{users.filter((user) => user.role === 'customer').length}</strong> customers</span>
      </div>

      {message ? <div className="users-message" role="status">{message}</div> : null}

      {isLoading ? <UsersStatus message="Loading users…" /> : null}
      {!isLoading && hasError ? <UsersStatus message="Users could not be loaded." error /> : null}
      {!isLoading && !hasError && visibleUsers.length === 0 ? (
        <UsersStatus message={users.length === 0 ? 'No users yet.' : 'No users match this search.'} />
      ) : null}

      {!isLoading && !hasError && visibleUsers.length > 0 ? (
        <div className="users-table-wrap">
          <table className="users-table">
            <thead>
              <tr>
                <th scope="col">User</th>
                <th scope="col">Role</th>
                <th scope="col">Status</th>
                <th scope="col">Action</th>
              </tr>
            </thead>
            <tbody>
              {visibleUsers.map((user) => {
                const isCurrentUser = user.id === currentUserId;

                return (
                  <tr key={user.id}>
                    <td>
                      <strong>{user.displayName}</strong>
                      <span className="users-id">{user.id}</span>
                      {isCurrentUser ? <span className="users-current">Current account</span> : null}
                    </td>
                    <td>
                      <select
                        aria-label={`Role for ${user.displayName}`}
                        value={user.role}
                        disabled={isCurrentUser || savingUserId === user.id}
                        onChange={(event) => updateDraft(user.id, { role: event.target.value as UserRole })}
                      >
                        <option value="customer">Customer</option>
                        <option value="staff">Staff</option>
                        <option value="admin">Administrator</option>
                      </select>
                    </td>
                    <td>
                      <select
                        aria-label={`Status for ${user.displayName}`}
                        value={user.status}
                        disabled={isCurrentUser || savingUserId === user.id}
                        onChange={(event) => updateDraft(user.id, { status: event.target.value as UserStatus })}
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="suspended">Suspended</option>
                      </select>
                    </td>
                    <td>
                      <button
                        className="users-save-button"
                        type="button"
                        disabled={isCurrentUser || savingUserId === user.id}
                        onClick={() => void saveUser(user)}
                      >
                        {savingUserId === user.id ? 'Saving…' : isCurrentUser ? 'Protected' : 'Save'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}

      <p className="users-note">Your current administrator account cannot change its own role or status here.</p>
    </section>
  );
}

function UsersStatus({ message, error = false }: { message: string; error?: boolean }) {
  return (
    <div className={`users-empty${error ? ' users-error' : ''}`} role={error ? 'alert' : 'status'}>
      {message}
    </div>
  );
}
