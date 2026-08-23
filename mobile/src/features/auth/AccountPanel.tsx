import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { getSafeAuthErrorMessage, signOutCurrentUser } from './auth.service';
import type { UserProfile } from './auth.types';

type AccountPanelProps = {
  status: 'active' | 'inactive' | 'suspended' | 'error';
  profile: UserProfile | null;
  onSignedOut: () => void;
};

export function AccountPanel({ status, profile, onSignedOut }: AccountPanelProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSignOut() {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await signOutCurrentUser();
      onSignedOut();
    } catch (error) {
      setErrorMessage(getSafeAuthErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <View style={styles.panel}>
      {status === 'active' && profile ? (
        <View style={styles.accountDetails}>
          <Text style={styles.label}>Signed in as</Text>
          <Text selectable style={styles.accountName}>
            {profile.displayName}
          </Text>
          <Text selectable style={styles.accountRole}>
            {formatRole(profile.role)}
          </Text>
        </View>
      ) : (
        <Text selectable accessibilityLiveRegion="assertive" style={styles.errorMessage}>
          {getUnavailableMessage(status)}
        </Text>
      )}

      {errorMessage ? (
        <Text selectable accessibilityLiveRegion="assertive" style={styles.errorMessage}>
          {errorMessage}
        </Text>
      ) : null}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Sign out"
        onPress={() => void handleSignOut()}
        disabled={isSubmitting}
        style={({ pressed }) => [
          styles.secondaryButton,
          pressed && !isSubmitting && styles.buttonPressed,
          isSubmitting && styles.buttonDisabled,
        ]}
      >
        <Text style={styles.secondaryButtonText}>
          {isSubmitting ? 'Signing out…' : 'Sign out'}
        </Text>
      </Pressable>
    </View>
  );
}

function getUnavailableMessage(status: AccountPanelProps['status']) {
  if (status === 'suspended') {
    return 'This account is suspended and cannot access protected business data.';
  }

  if (status === 'inactive') {
    return 'This account is inactive and cannot access protected business data.';
  }

  return 'We could not load your account profile. Sign out and try again, or contact an administrator if the problem continues.';
}

function formatRole(role: UserProfile['role']) {
  if (role === 'admin') {
    return 'Administrator';
  }

  if (role === 'staff') {
    return 'Staff';
  }

  return 'Customer';
}

const styles = StyleSheet.create({
  panel: {
    gap: 18,
    padding: 22,
    borderWidth: 1,
    borderColor: '#E0E6E2',
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
  },
  accountDetails: {
    gap: 6,
  },
  label: {
    color: '#586762',
    fontSize: 13,
    fontWeight: '700',
  },
  accountName: {
    color: '#17211F',
    fontSize: 22,
    fontWeight: '700',
  },
  accountRole: {
    color: '#0E5144',
    fontSize: 14,
    fontWeight: '700',
  },
  errorMessage: {
    padding: 12,
    borderRadius: 12,
    color: '#7F2C2C',
    backgroundColor: '#FFF0EE',
    fontSize: 14,
    lineHeight: 21,
  },
  secondaryButton: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#DCE3DF',
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
  },
  secondaryButtonText: {
    color: '#17211F',
    fontSize: 15,
    fontWeight: '700',
  },
  buttonPressed: {
    backgroundColor: '#F1F5F3',
    transform: [{ scale: 0.99 }],
  },
  buttonDisabled: {
    opacity: 0.55,
  },
});
