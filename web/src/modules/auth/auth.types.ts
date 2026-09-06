export type UserRole = 'customer' | 'staff' | 'admin';

export type UserStatus = 'active' | 'inactive' | 'suspended';

export type UserProfile = {
  id: string;
  displayName: string;
  role: UserRole;
  status: UserStatus;
};
