import { useEffect, useState } from 'react';
import { Stack, useRouter } from 'expo-router';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useAuth } from '../auth/AuthProvider';
import { subscribeToOwnReservations } from './reservation.service';
import type { ReservationRecord, ReservationStatus } from './reservation.types';

const statusLabels: Record<ReservationStatus, string> = {
  pending_review: 'Pending review',
  confirmed: 'Confirmed',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
  completed: 'Completed',
};

export function MyReservationsScreen() {
  const router = useRouter();
  const { authState } = useAuth();
  const [reservations, setReservations] = useState<ReservationRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const customerId =
    authState.status === 'active' && authState.profile?.role === 'customer'
      ? authState.profile.id
      : null;

  useEffect(() => {
    if (!customerId) {
      setReservations([]);
      setIsLoading(false);
      setHasError(false);
      return;
    }

    setIsLoading(true);
    setHasError(false);

    return subscribeToOwnReservations(
      customerId,
      (nextReservations) => {
        setReservations(nextReservations);
        setIsLoading(false);
      },
      () => {
        setReservations([]);
        setHasError(true);
        setIsLoading(false);
      },
    );
  }, [customerId]);

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: 'My requests' }} />
      {authState.status === 'loading' ? (
        <View style={styles.centeredPage}>
          <ActivityIndicator />
          <Text selectable style={styles.mutedText}>Checking your account…</Text>
        </View>
      ) : !customerId ? (
        <View style={styles.centeredPage}>
          <Text selectable style={styles.title}>
            {authState.status === 'signed_out'
              ? 'Sign in to see your requests.'
              : 'Customer requests are not available for this account.'}
          </Text>
          <Text selectable style={styles.mutedText}>
            Reservation records are private and are loaded only for the signed-in customer.
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
        <FlatList
          data={reservations}
          keyExtractor={(reservation) => reservation.id}
          contentInsetAdjustmentBehavior="automatic"
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <View style={styles.header}>
              <Text selectable style={styles.eyebrow}>Reservations</Text>
              <Text selectable style={styles.title}>Track your events.</Text>
              <Text selectable style={styles.mutedText}>
                Your latest reservation requests appear here as Dos Hermanos reviews them.
              </Text>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.statusBox}>
              {isLoading ? <ActivityIndicator /> : null}
              <Text selectable style={hasError ? styles.errorText : styles.mutedText}>
                {isLoading
                  ? 'Loading your requests…'
                  : hasError
                    ? 'We could not load your requests right now.'
                    : 'You have no reservation requests yet.'}
              </Text>
            </View>
          }
          renderItem={({ item }) => <ReservationCard reservation={item} />}
        />
      )}
    </>
  );
}

function ReservationCard({ reservation }: { reservation: ReservationRecord }) {
  const eventDates =
    reservation.event.startDate === reservation.event.endDate
      ? reservation.event.startDate
      : `${reservation.event.startDate} to ${reservation.event.endDate}`;

  return (
    <View style={styles.card}>
      <View style={styles.cardHeading}>
        <Text selectable style={styles.cardTitle}>{reservation.package.packageName}</Text>
        <View style={styles.statusPill}>
          <Text selectable style={styles.statusText}>{statusLabels[reservation.status]}</Text>
        </View>
      </View>
      <Text selectable style={styles.mutedText}>{eventDates}</Text>
      <Text selectable style={styles.mutedText}>
        {reservation.event.guestCount.toLocaleString('en-PH')} guests · {reservation.event.location}
      </Text>
      {reservation.event.serviceRequirements ? (
        <Text selectable style={styles.requirements}>{reservation.event.serviceRequirements}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  centeredPage: { flex: 1, justifyContent: 'center', gap: 14, padding: 24, backgroundColor: '#F5F7F5' },
  listContent: { padding: 20, paddingBottom: 48, gap: 12, backgroundColor: '#F5F7F5', flexGrow: 1 },
  header: { gap: 10, paddingBottom: 14 },
  eyebrow: { color: '#176B5B', fontSize: 12, fontWeight: '700', letterSpacing: 1.1, textTransform: 'uppercase' },
  title: { color: '#17211F', fontSize: 34, lineHeight: 38, fontWeight: '700', letterSpacing: -1.2 },
  mutedText: { color: '#64716D', fontSize: 15, lineHeight: 22 },
  statusBox: { gap: 12, padding: 22, borderWidth: 1, borderColor: '#DDE5E1', borderRadius: 20, backgroundColor: '#FFFFFF' },
  errorText: { color: '#8A3232', fontSize: 14, lineHeight: 21 },
  primaryButton: { alignSelf: 'flex-start', borderRadius: 999, backgroundColor: '#176B5B', paddingHorizontal: 20, paddingVertical: 14 },
  primaryButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  buttonPressed: { backgroundColor: '#0E5144', transform: [{ scale: 0.98 }] },
  card: { gap: 8, padding: 20, borderWidth: 1, borderColor: '#DDE5E1', borderRadius: 20, backgroundColor: '#FFFFFF' },
  cardHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  cardTitle: { flex: 1, color: '#17211F', fontSize: 18, fontWeight: '700' },
  statusPill: { borderRadius: 999, backgroundColor: '#E5F3EF', paddingHorizontal: 9, paddingVertical: 5 },
  statusText: { color: '#0E5144', fontSize: 12, fontWeight: '700' },
  requirements: { color: '#40514C', fontSize: 14, lineHeight: 21, paddingTop: 4 },
});
