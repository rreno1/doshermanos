import { useEffect, useRef, useState } from 'react';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import DateTimePicker from '@expo/ui/community/datetime-picker';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useAuth } from '../auth/AuthProvider';
import { loadActivePackageById } from '../packages/package.service';
import type { CateringPackage } from '../packages/package.types';
import { createReservationRequest } from './reservation.service';
import { validateReservationForm } from './reservation.validation';

function formatDateOnly(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function ReservationRequestScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ packageId?: string | string[] }>();
  const { authState } = useAuth();
  const requestNumber = useRef(0);
  const [cateringPackage, setCateringPackage] = useState<CateringPackage | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [location, setLocation] = useState('');
  const [guestCount, setGuestCount] = useState('');
  const [serviceRequirements, setServiceRequirements] = useState('');

  const packageId = Array.isArray(params.packageId) ? params.packageId[0] : params.packageId;

  useEffect(() => {
    const currentRequest = requestNumber.current + 1;
    requestNumber.current = currentRequest;

    if (!packageId) {
      setErrorMessage('This package link is invalid.');
      setIsLoading(false);
      return;
    }

    async function loadPackage() {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const activePackage = await loadActivePackageById(packageId);

        if (requestNumber.current !== currentRequest) {
          return;
        }

        if (!activePackage) {
          setErrorMessage('This package is no longer available.');
          return;
        }

        setCateringPackage(activePackage);
      } catch {
        if (requestNumber.current === currentRequest) {
          setErrorMessage('We could not load this package right now.');
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

  async function handleSubmit() {
    if (!cateringPackage) {
      return;
    }

    if (authState.status !== 'active' || authState.profile?.role !== 'customer') {
      return;
    }

    const validation = validateReservationForm({
      startDate: formatDateOnly(startDate),
      endDate: formatDateOnly(endDate),
      location,
      guestCount,
      serviceRequirements,
    });

    if (!validation.value) {
      setErrorMessage(validation.message);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await createReservationRequest(
        authState.profile.id,
        cateringPackage,
        validation.value,
      );
      router.replace('/reservations');
    } catch {
      setErrorMessage('We could not send your reservation request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  const canRequest = authState.status === 'active' && authState.profile?.role === 'customer';

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: 'Request catering' }} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {isLoading ? (
            <View style={styles.statusBox}>
              <ActivityIndicator />
              <Text selectable style={styles.mutedText}>Loading package…</Text>
            </View>
          ) : errorMessage && !cateringPackage ? (
            <View style={styles.statusBox}>
              <Text selectable style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : cateringPackage ? (
            <>
              <View style={styles.packageSummary}>
                <Text selectable style={styles.eyebrow}>Selected package</Text>
                <Text selectable style={styles.title}>{cateringPackage.name}</Text>
                <Text selectable style={styles.mutedText}>
                  Send your event details for review. This does not automatically confirm the booking.
                </Text>
              </View>

              {authState.status === 'loading' ? (
                <View style={styles.statusBox}>
                  <ActivityIndicator />
                  <Text selectable style={styles.mutedText}>Checking your account…</Text>
                </View>
              ) : !canRequest ? (
                <View style={styles.statusBox}>
                  <Text selectable style={styles.mutedText}>
                    {authState.status === 'signed_out'
                      ? 'Sign in with a customer account before sending a reservation request.'
                      : 'This account cannot create customer reservation requests.'}
                  </Text>
                  {authState.status === 'signed_out' ? (
                    <Pressable
                      accessibilityRole="button"
                      style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}
                      onPress={() => router.push('/account')}
                    >
                      <Text style={styles.primaryButtonText}>Open account</Text>
                    </Pressable>
                  ) : null}
                </View>
              ) : (
                <View style={styles.form}>
                  <FieldLabel label="Start date" />
                  <DateTimePicker value={startDate} mode="date" onValueChange={(_, date) => setStartDate(date)} />

                  <FieldLabel label="End date" />
                  <DateTimePicker value={endDate} mode="date" onValueChange={(_, date) => setEndDate(date)} />

                  <FieldLabel label="Event location" />
                  <TextInput
                    value={location}
                    onChangeText={setLocation}
                    placeholder="Venue or complete event location"
                    maxLength={300}
                    style={styles.input}
                  />

                  <FieldLabel label="Guest count" />
                  <TextInput
                    value={guestCount}
                    onChangeText={setGuestCount}
                    placeholder="Expected number of guests"
                    keyboardType="number-pad"
                    maxLength={5}
                    style={styles.input}
                  />

                  <FieldLabel label="Service requirements" optional />
                  <TextInput
                    value={serviceRequirements}
                    onChangeText={setServiceRequirements}
                    placeholder="Setup, service, dietary, or other event requirements"
                    maxLength={1000}
                    multiline
                    textAlignVertical="top"
                    style={[styles.input, styles.textArea]}
                  />

                  {errorMessage ? <Text selectable style={styles.errorText}>{errorMessage}</Text> : null}

                  <Pressable
                    accessibilityRole="button"
                    disabled={isSubmitting}
                    style={({ pressed }) => [
                      styles.primaryButton,
                      pressed && !isSubmitting && styles.buttonPressed,
                      isSubmitting && styles.buttonDisabled,
                    ]}
                    onPress={() => void handleSubmit()}
                  >
                    <Text style={styles.primaryButtonText}>
                      {isSubmitting ? 'Sending request…' : 'Send reservation request'}
                    </Text>
                  </Pressable>
                </View>
              )}
            </>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

function FieldLabel({ label, optional = false }: { label: string; optional?: boolean }) {
  return (
    <View style={styles.labelRow}>
      <Text style={styles.label}>{label}</Text>
      {optional ? <Text style={styles.optional}>Optional</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#F5F7F5' },
  content: { padding: 20, paddingBottom: 48, gap: 22 },
  packageSummary: { gap: 10, paddingVertical: 8 },
  eyebrow: { color: '#176B5B', fontSize: 12, fontWeight: '700', letterSpacing: 1.1, textTransform: 'uppercase' },
  title: { color: '#17211F', fontSize: 34, lineHeight: 38, fontWeight: '700', letterSpacing: -1.2 },
  mutedText: { color: '#64716D', fontSize: 15, lineHeight: 23 },
  form: { gap: 12 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 6 },
  label: { color: '#263732', fontSize: 14, fontWeight: '700' },
  optional: { color: '#74817D', fontSize: 12 },
  input: { minHeight: 50, borderWidth: 1, borderColor: '#D8E0DC', borderRadius: 14, backgroundColor: '#FFFFFF', paddingHorizontal: 14, color: '#17211F', fontSize: 15 },
  textArea: { minHeight: 112, paddingTop: 14 },
  primaryButton: { alignSelf: 'flex-start', marginTop: 8, borderRadius: 999, backgroundColor: '#176B5B', paddingHorizontal: 20, paddingVertical: 14 },
  primaryButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  buttonPressed: { backgroundColor: '#0E5144', transform: [{ scale: 0.98 }] },
  buttonDisabled: { opacity: 0.55 },
  statusBox: { gap: 14, padding: 22, borderWidth: 1, borderColor: '#DDE5E1', borderRadius: 20, backgroundColor: '#FFFFFF' },
  errorText: { color: '#8A3232', fontSize: 14, lineHeight: 21 },
});
