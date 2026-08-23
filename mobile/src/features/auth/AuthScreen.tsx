import { Stack, useRouter } from 'expo-router';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { AccountPanel } from './AccountPanel';
import { AuthForm } from './AuthForm';
import { useAuth } from './AuthProvider';

export function AuthScreen() {
  const router = useRouter();
  const { authState, refreshAuthState } = useAuth();

  async function handleAuthenticated() {
    await refreshAuthState();
    router.back();
  }

  function handleSignedOut() {
    router.back();
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: 'Account' }} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.heading}>
          <Text selectable style={styles.eyebrow}>
            Dos Hermanos account
          </Text>
          <Text selectable style={styles.title}>
            {getScreenTitle(authState.status)}
          </Text>
          <Text selectable style={styles.subtitle}>
            {getScreenSubtitle(authState.status)}
          </Text>
        </View>

        {authState.status === 'loading' ? (
          <View style={styles.statusPanel}>
            <ActivityIndicator />
            <Text selectable accessibilityLiveRegion="polite" style={styles.subtitle}>
              Checking your account…
            </Text>
          </View>
        ) : null}

        {authState.status === 'signed_out' ? (
          <AuthForm onAuthenticated={handleAuthenticated} />
        ) : null}

        {authState.status === 'active' ||
        authState.status === 'inactive' ||
        authState.status === 'suspended' ||
        authState.status === 'error' ? (
          <AccountPanel
            status={authState.status}
            profile={authState.profile}
            onSignedOut={handleSignedOut}
          />
        ) : null}
      </ScrollView>
    </>
  );
}

function getScreenTitle(status: string) {
  if (status === 'active') {
    return 'Your account';
  }

  if (status === 'inactive' || status === 'suspended') {
    return 'Account access unavailable';
  }

  if (status === 'error') {
    return 'Account setup issue';
  }

  return 'Sign in or create an account';
}

function getScreenSubtitle(status: string) {
  if (status === 'active') {
    return 'Your account is ready for protected Dos Hermanos features.';
  }

  if (status === 'inactive' || status === 'suspended' || status === 'error') {
    return 'Protected business data stays unavailable until account access is valid.';
  }

  return 'Use your customer account to request catering and track your reservation requests.';
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    gap: 26,
    padding: 20,
    paddingBottom: 48,
    backgroundColor: '#F5F7F5',
  },
  heading: {
    gap: 10,
    paddingTop: 18,
  },
  eyebrow: {
    color: '#176B5B',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  title: {
    color: '#17211F',
    fontSize: 36,
    lineHeight: 40,
    fontWeight: '700',
    letterSpacing: -1.3,
  },
  subtitle: {
    color: '#586762',
    fontSize: 15,
    lineHeight: 23,
  },
  statusPanel: {
    minHeight: 130,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    padding: 22,
    borderWidth: 1,
    borderColor: '#E0E6E2',
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
  },
});
