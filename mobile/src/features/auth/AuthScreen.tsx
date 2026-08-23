import { useState } from 'react';
import { useRouter } from 'expo-router';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  getSafeAuthErrorMessage,
  registerCustomer,
  resetPassword,
  signInWithEmail,
  signOutCurrentUser,
} from './auth.service';
import { useAuth } from './AuthProvider';

type FormMode = 'sign_in' | 'register' | 'reset_password';

export function AuthScreen() {
  const router = useRouter();
  const { authState, refreshAuthState } = useAuth();
  const [formMode, setFormMode] = useState<FormMode>('sign_in');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  function switchMode(nextMode: FormMode) {
    setFormMode(nextMode);
    setPassword('');
    setConfirmPassword('');
    setMessage(null);
    setIsError(false);
  }

  async function submitAuthForm() {
    setMessage(null);
    setIsError(false);

    if (formMode === 'register') {
      if (displayName.trim().length < 2) {
        setMessage('Enter your full name.');
        setIsError(true);
        return;
      }

      if (password.length < 10) {
        setMessage('Use at least 10 characters for your password.');
        setIsError(true);
        return;
      }

      if (password !== confirmPassword) {
        setMessage('The passwords do not match.');
        setIsError(true);
        return;
      }
    }

    setIsSubmitting(true);

    try {
      if (formMode === 'sign_in') {
        await signInWithEmail(email, password);
        await refreshAuthState();
        router.back();
        return;
      }

      if (formMode === 'register') {
        await registerCustomer(displayName, email, password);
        await refreshAuthState();
        router.back();
        return;
      }

      await resetPassword(email);
      setMessage(
        'If an account uses that email address, Firebase will send password reset instructions.',
      );
    } catch (error) {
      setMessage(getSafeAuthErrorMessage(error));
      setIsError(true);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSignOut() {
    setIsSubmitting(true);
    setMessage(null);
    setIsError(false);

    try {
      await signOutCurrentUser();
      router.back();
    } catch (error) {
      setMessage(getSafeAuthErrorMessage(error));
      setIsError(true);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.topBar}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Go back"
              onPress={() => router.back()}
              style={({ pressed }) => [
                styles.backButton,
                pressed && styles.buttonPressed,
              ]}
            >
              <Text style={styles.backButtonText}>Back</Text>
            </Pressable>
            <Text style={styles.brand}>Dos Hermanos</Text>
          </View>

          <View style={styles.heading}>
            <Text style={styles.eyebrow}>Dos Hermanos account</Text>
            <Text style={styles.title}>{getScreenTitle(authState.status, formMode)}</Text>
            <Text style={styles.subtitle}>
              {getScreenSubtitle(authState.status, formMode)}
            </Text>
          </View>

          {authState.status === 'active' && authState.profile ? (
            <View style={styles.panel}>
              <Text style={styles.label}>Signed in as</Text>
              <Text style={styles.accountName}>{authState.profile.displayName}</Text>
              <Text style={styles.accountRole}>{formatRole(authState.profile.role)}</Text>

              {message ? (
                <Message text={message} isError={isError} />
              ) : null}

              <Pressable
                accessibilityRole="button"
                onPress={() => void handleSignOut()}
                disabled={isSubmitting}
                style={({ pressed }) => [
                  styles.secondaryButton,
                  pressed && styles.buttonPressed,
                  isSubmitting && styles.buttonDisabled,
                ]}
              >
                <Text style={styles.secondaryButtonText}>
                  {isSubmitting ? 'Signing out…' : 'Sign out'}
                </Text>
              </Pressable>
            </View>
          ) : null}

          {authState.status === 'inactive' || authState.status === 'suspended' ? (
            <View style={styles.panel}>
              <Message
                text={
                  authState.status === 'suspended'
                    ? 'This account is suspended and cannot access protected business data.'
                    : 'This account is inactive and cannot access protected business data.'
                }
                isError
              />
              <Pressable
                accessibilityRole="button"
                onPress={() => void handleSignOut()}
                disabled={isSubmitting}
                style={({ pressed }) => [
                  styles.secondaryButton,
                  pressed && styles.buttonPressed,
                  isSubmitting && styles.buttonDisabled,
                ]}
              >
                <Text style={styles.secondaryButtonText}>Sign out</Text>
              </Pressable>
            </View>
          ) : null}

          {authState.status === 'error' ? (
            <View style={styles.panel}>
              <Message
                text="We could not load your account profile. Sign out and try again, or contact an administrator if the problem continues."
                isError
              />
              <Pressable
                accessibilityRole="button"
                onPress={() => void handleSignOut()}
                disabled={isSubmitting}
                style={({ pressed }) => [
                  styles.secondaryButton,
                  pressed && styles.buttonPressed,
                  isSubmitting && styles.buttonDisabled,
                ]}
              >
                <Text style={styles.secondaryButtonText}>Sign out</Text>
              </Pressable>
            </View>
          ) : null}

          {authState.status === 'signed_out' ? (
            <View style={styles.panel}>
              {formMode === 'register' ? (
                <AuthField
                  label="Full name"
                  value={displayName}
                  onChangeText={setDisplayName}
                  autoCapitalize="words"
                  textContentType="name"
                />
              ) : null}

              <AuthField
                label="Email address"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                textContentType="emailAddress"
              />

              {formMode !== 'reset_password' ? (
                <AuthField
                  label="Password"
                  value={password}
                  onChangeText={setPassword}
                  autoCapitalize="none"
                  secureTextEntry
                  textContentType={formMode === 'register' ? 'newPassword' : 'password'}
                />
              ) : null}

              {formMode === 'register' ? (
                <AuthField
                  label="Confirm password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  autoCapitalize="none"
                  secureTextEntry
                  textContentType="newPassword"
                />
              ) : null}

              {message ? <Message text={message} isError={isError} /> : null}

              <Pressable
                accessibilityRole="button"
                onPress={() => void submitAuthForm()}
                disabled={isSubmitting}
                style={({ pressed }) => [
                  styles.primaryButton,
                  pressed && styles.buttonPressed,
                  isSubmitting && styles.buttonDisabled,
                ]}
              >
                <Text style={styles.primaryButtonText}>
                  {isSubmitting ? 'Please wait…' : getSubmitLabel(formMode)}
                </Text>
              </Pressable>

              <View style={styles.modeActions}>
                {formMode !== 'sign_in' ? (
                  <ModeButton label="Sign in instead" onPress={() => switchMode('sign_in')} />
                ) : null}
                {formMode !== 'register' ? (
                  <ModeButton label="Create account" onPress={() => switchMode('register')} />
                ) : null}
                {formMode === 'sign_in' ? (
                  <ModeButton
                    label="Forgot password?"
                    onPress={() => switchMode('reset_password')}
                  />
                ) : null}
              </View>
            </View>
          ) : null}

          {authState.status === 'loading' ? (
            <View style={styles.panel}>
              <Text style={styles.statusText}>Checking your account…</Text>
            </View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

type AuthFieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  autoCapitalize: 'none' | 'words';
  keyboardType?: 'default' | 'email-address';
  secureTextEntry?: boolean;
  textContentType?: 'name' | 'emailAddress' | 'password' | 'newPassword';
};

function AuthField({
  label,
  value,
  onChangeText,
  autoCapitalize,
  keyboardType = 'default',
  secureTextEntry = false,
  textContentType,
}: AuthFieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChangeText}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        textContentType={textContentType}
        style={styles.input}
      />
    </View>
  );
}

function Message({ text, isError }: { text: string; isError: boolean }) {
  return (
    <View style={[styles.message, isError && styles.errorMessage]}>
      <Text style={[styles.messageText, isError && styles.errorMessageText]}>
        {text}
      </Text>
    </View>
  );
}

function ModeButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress}>
      <Text style={styles.modeButtonText}>{label}</Text>
    </Pressable>
  );
}

function getScreenTitle(status: string, mode: FormMode) {
  if (status === 'active') {
    return 'Your account';
  }

  if (status === 'inactive' || status === 'suspended') {
    return 'Account access unavailable';
  }

  if (status === 'error') {
    return 'Account setup issue';
  }

  if (mode === 'register') {
    return 'Create your customer account';
  }

  if (mode === 'reset_password') {
    return 'Reset your password';
  }

  return 'Sign in';
}

function getScreenSubtitle(status: string, mode: FormMode) {
  if (status === 'active') {
    return 'Your account is ready for protected Dos Hermanos features.';
  }

  if (status === 'inactive' || status === 'suspended' || status === 'error') {
    return 'Protected business data stays unavailable until account access is valid.';
  }

  if (mode === 'register') {
    return 'Create a customer account for reservations and customer-only information.';
  }

  if (mode === 'reset_password') {
    return 'Enter your email address to request password reset instructions.';
  }

  return 'Sign in to access your reservations and customer-only information.';
}

function getSubmitLabel(mode: FormMode) {
  if (mode === 'register') {
    return 'Create account';
  }

  if (mode === 'reset_password') {
    return 'Send reset instructions';
  }

  return 'Sign in';
}

function formatRole(role: string) {
  if (role === 'admin') {
    return 'Administrator';
  }

  if (role === 'staff') {
    return 'Staff';
  }

  return 'Customer';
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F7F5',
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  topBar: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#DCE3DF',
    backgroundColor: '#FFFFFF',
  },
  backButtonText: {
    color: '#0E5144',
    fontSize: 14,
    fontWeight: '700',
  },
  brand: {
    color: '#17211F',
    fontSize: 16,
    fontWeight: '700',
  },
  heading: {
    paddingTop: 54,
    paddingBottom: 28,
  },
  eyebrow: {
    color: '#176B5B',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  title: {
    color: '#17211F',
    fontSize: 38,
    lineHeight: 41,
    fontWeight: '700',
    letterSpacing: -1.4,
  },
  subtitle: {
    color: '#64716D',
    fontSize: 15,
    lineHeight: 23,
    marginTop: 14,
  },
  panel: {
    gap: 18,
    padding: 22,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E0E6E2',
    backgroundColor: '#FFFFFF',
  },
  field: {
    gap: 8,
  },
  label: {
    color: '#64716D',
    fontSize: 13,
    fontWeight: '700',
  },
  input: {
    minHeight: 50,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#DCE3DF',
    color: '#17211F',
    backgroundColor: '#FFFFFF',
    fontSize: 16,
  },
  primaryButton: {
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: '#176B5B',
    paddingHorizontal: 16,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryButton: {
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#DCE3DF',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
  },
  secondaryButtonText: {
    color: '#17211F',
    fontSize: 15,
    fontWeight: '700',
  },
  buttonPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  modeActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  modeButtonText: {
    color: '#0E5144',
    fontSize: 14,
    fontWeight: '700',
  },
  message: {
    padding: 13,
    borderRadius: 12,
    backgroundColor: '#EAF5F1',
  },
  messageText: {
    color: '#285448',
    fontSize: 14,
    lineHeight: 21,
  },
  errorMessage: {
    backgroundColor: '#FFF0EE',
  },
  errorMessageText: {
    color: '#7F2C2C',
  },
  accountName: {
    color: '#17211F',
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.7,
  },
  accountRole: {
    color: '#0E5144',
    fontSize: 14,
    fontWeight: '700',
  },
  statusText: {
    color: '#64716D',
    fontSize: 15,
    textAlign: 'center',
  },
});
