import { useEffect, useRef, useState } from 'react';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useAuth } from '../auth/AuthProvider';
import { loadActivePackageById } from '../packages/package.service';
import type { CateringPackage } from '../packages/package.types';
import { ReservationForm } from './ReservationForm';

export function ReservationRequestScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ packageId?: string | string[] }>();
  const { authState } = useAuth();
  const requestNumber = useRef(0);
  const [cateringPackage, setCateringPackage] = useState<CateringPackage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const packageId = Array.isArray(params.packageId) ? params.packageId[0] : params.packageId;
  const customerId =
    authState.status === 'active' && authState.profile?.role === 'customer'
      ? authState.profile.id
      : null;

  useEffect(() => {
    const currentRequest = requestNumber.current + 1;
    requestNumber.current = currentRequest;

    if (!packageId) {
      setLoadError('This package link is invalid.');
      setIsLoading(false);
      return;
    }

    const selectedPackageId = packageId;

    async function loadPackage() {
      setIsLoading(true);
      setLoadError(null);

      try {
        const activePackage = await loadActivePackageById(selectedPackageId);

        if (requestNumber.current !== currentRequest) {
          return;
        }

        if (!activePackage) {
          setLoadError('This package is no longer available.');
          return;
        }

        setCateringPackage(activePackage);
      } catch {
        if (requestNumber.current === currentRequest) {
          setLoadError('We could not load this package right now.');
        }
      } finally {
        if (requestNumber.current === currentRequest) {
          setIsLoading(false);
        }
      }
    }

    void loadPackage();

    return () => {
      requestNumber.current += 1;
    };
  }, [packageId]);

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: 'Request catering' }} />
      <KeyboardAvoidingView
        style={styles.page}
        behavior={process.env.EXPO_OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {renderContent()}
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );

  function renderContent() {
    if (isLoading) {
      return (
        <View style={styles.statusBox}>
          <ActivityIndicator />
          <Text selectable accessibilityLiveRegion="polite" style={styles.mutedText}>
            Loading package…
          </Text>
        </View>
      );
    }

    if (loadError || !cateringPackage) {
      return (
        <View style={styles.statusBox}>
          <Text selectable accessibilityLiveRegion="assertive" style={styles.errorText}>
            {loadError ?? 'This package is unavailable.'}
          </Text>
        </View>
      );
    }

    return (
      <>
        <View style={styles.packageSummary}>
          <Text selectable style={styles.eyebrow}>
            Selected package
          </Text>
          <Text selectable style={styles.title}>
            {cateringPackage.name}
          </Text>
          <Text selectable style={styles.mutedText}>
            Send your event details for review. This does not automatically confirm the booking.
          </Text>
        </View>

        {renderReservationAccess(cateringPackage)}
      </>
    );
  }

  function renderReservationAccess(selectedPackage: CateringPackage) {
    if (authState.status === 'loading') {
      return (
        <View style={styles.statusBox}>
          <ActivityIndicator />
          <Text selectable accessibilityLiveRegion="polite" style={styles.mutedText}>
            Checking your account…
          </Text>
        </View>
      );
    }

    if (!customerId) {
      const message =
        authState.status === 'signed_out'
          ? 'Sign in with a customer account before sending a reservation request.'
          : 'This account cannot create customer reservation requests.';

      return (
        <View style={styles.statusBox}>
          <Text selectable style={styles.mutedText}>
            {message}
          </Text>
          {authState.status === 'signed_out' ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/account')}
              style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}
            >
              <Text style={styles.primaryButtonText}>Open account</Text>
            </Pressable>
          ) : null}
        </View>
      );
    }

    return (
      <ReservationForm
        customerId={customerId}
        cateringPackage={selectedPackage}
        onSubmitted={() => router.replace('/reservations')}
      />
    );
  }
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#F5F7F5',
  },
  content: {
    padding: 20,
    paddingBottom: 48,
    gap: 22,
  },
  packageSummary: {
    gap: 10,
    paddingVertical: 8,
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
    fontSize: 34,
    lineHeight: 38,
    fontWeight: '700',
    letterSpacing: -1.2,
  },
  mutedText: {
    color: '#586762',
    fontSize: 15,
    lineHeight: 23,
  },
  statusBox: {
    gap: 14,
    padding: 22,
    borderWidth: 1,
    borderColor: '#DDE5E1',
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
  },
  errorText: {
    color: '#8A3232',
    fontSize: 14,
    lineHeight: 21,
  },
  primaryButton: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    backgroundColor: '#176B5B',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  buttonPressed: {
    backgroundColor: '#0E5144',
    transform: [{ scale: 0.98 }],
  },
});
