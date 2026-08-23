import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import {
  getSafeAuthErrorMessage,
  registerCustomer,
  resetPassword,
  signInWithEmail,
} from './auth.service';

type FormMode = 'sign_in' | 'register' | 'reset_password';

type AuthFormProps = {
  onAuthenticated: () => Promise<void>;
};

export function AuthForm({ onAuthenticated }: AuthFormProps) {
  const [mode, setMode] = useState<FormMode>('sign_in');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  function switchMode(nextMode: FormMode) {
    setMode(nextMode);
    setPassword('');
    setConfirmPassword('');
    setMessage(null);
    setIsError(false);
  }

  async function submitAuthForm() {
    setMessage(null);
    setIsError(false);

    if (mode === 'register') {
      if (displayName.trim().length < 2) {
        showError('Enter your full name.');
        return;
      }

      if (password.length < 10) {
        showError('Use at least 10 characters for your password.');
        return;
      }

      if (password !== confirmPassword) {
        showError('The passwords do not match.');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      if (mode === 'sign_in') {
        await signInWithEmail(email, password);
        await onAuthenticated();
        return;
      }

      if (mode === 'register') {
        await registerCustomer(displayName, email, password);
        await onAuthenticated();
        return;
      }

      await resetPassword(email);
      setMessage(
        'If an account uses that email address, Firebase will send password reset instructions.',
      );
    } catch (error) {
      showError(getSafeAuthErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  function showError(errorMessage: string) {
    setMessage(errorMessage);
    setIsError(true);
  }

  return (
    <View style={styles.panel}>
      {mode === 'register' ? (
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

      {mode !== 'reset_password' ? (
        <AuthField
          label="Password"
          value={password}
          onChangeText={setPassword}
          autoCapitalize="none"
          secureTextEntry
          textContentType={mode === 'register' ? 'newPassword' : 'password'}
        />
      ) : null}

      {mode === 'register' ? (
        <AuthField
          label="Confirm password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          autoCapitalize="none"
          secureTextEntry
          textContentType="newPassword"
        />
      ) : null}

      {message ? (
        <Text
          selectable
          accessibilityLiveRegion={isError ? 'assertive' : 'polite'}
          style={[styles.message, isError && styles.errorMessage]}
        >
          {message}
        </Text>
      ) : null}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={getSubmitLabel(mode)}
        onPress={() => void submitAuthForm()}
        disabled={isSubmitting}
        style={({ pressed }) => [
          styles.primaryButton,
          pressed && !isSubmitting && styles.buttonPressed,
          isSubmitting && styles.buttonDisabled,
        ]}
      >
        <Text style={styles.primaryButtonText}>
          {isSubmitting ? 'Please wait…' : getSubmitLabel(mode)}
        </Text>
      </Pressable>

      <View style={styles.modeActions}>
        {mode !== 'sign_in' ? (
          <ModeButton label="Sign in instead" onPress={() => switchMode('sign_in')} />
        ) : null}
        {mode !== 'register' ? (
          <ModeButton label="Create account" onPress={() => switchMode('register')} />
        ) : null}
        {mode === 'sign_in' ? (
          <ModeButton
            label="Forgot password?"
            onPress={() => switchMode('reset_password')}
          />
        ) : null}
      </View>
    </View>
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

function ModeButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.modeButton, pressed && styles.modeButtonPressed]}
    >
      <Text style={styles.modeButtonText}>{label}</Text>
    </Pressable>
  );
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

const styles = StyleSheet.create({
  panel: {
    gap: 18,
    padding: 22,
    borderWidth: 1,
    borderColor: '#E0E6E2',
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
  },
  field: {
    gap: 8,
  },
  label: {
    color: '#586762',
    fontSize: 13,
    fontWeight: '700',
  },
  input: {
    minHeight: 50,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#DCE3DF',
    borderRadius: 14,
    color: '#17211F',
    backgroundColor: '#FFFFFF',
    fontSize: 16,
  },
  message: {
    padding: 12,
    borderRadius: 12,
    color: '#285448',
    backgroundColor: '#EAF5F1',
    fontSize: 14,
    lineHeight: 21,
  },
  errorMessage: {
    color: '#7F2C2C',
    backgroundColor: '#FFF0EE',
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
  buttonPressed: {
    backgroundColor: '#0E5144',
    transform: [{ scale: 0.99 }],
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  modeActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  modeButton: {
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  modeButtonPressed: {
    backgroundColor: '#EEF5F2',
  },
  modeButtonText: {
    color: '#0E5144',
    fontSize: 14,
    fontWeight: '700',
  },
});
