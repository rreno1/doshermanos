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
import { ReservationCard } from './ReservationCard';
import { subscribeToOwnReservations } from './reservation.service';
import type { ReservationRecord } from './reservation.types';

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
      {renderContent()}
    </>
  );

  function renderContent() {
    if (authState.status === 'loading') {
      return (
        <View style={styles.centeredPage}>
          <ActivityIndicator />
          <Text selectable accessibilityLiveRegion="polite" style={styles.mutedText}>
            Checking your account…
          </Text>
        </View>
      );
    }

    if (!customerId) {
      const title =
        authState.status === 'signed_out'
          ? 'Sign in to see your requests.'
          : 'Customer requests are not available for this account.';

      return (
        <View style={styles.centeredPage}>
          <Text selectable style={styles.title}>
            {title}
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
      );
    }

    return (
      <FlatList
        data={reservations}
        keyExtractor={(reservation) => reservation.id}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text selectable style={styles.eyebrow}>
              Reservations
            </Text>
            <Text selectable style={styles.title}>
              Track your events.
            </Text>
            <Text selectable style={styles.mutedText}>
              Your latest reservation requests appear here as Dos Hermanos reviews them.
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.statusBox}>
            {isLoading ? <ActivityIndicator /> : null}
            <Text
              selectable
              accessibilityLiveRegion={hasError ? 'assertive' : 'polite'}
              style={hasError ? styles.errorText : styles.mutedText}
            >
              {getListMessage(isLoading, hasError)}
            </Text>
          </View>
        }
        renderItem={({ item }) => <ReservationCard reservation={item} />}
      />
    );
  }
}

function getListMessage(isLoading: boolean, hasError: boolean) {
  if (isLoading) {
    return 'Loading your requests…';
  }

  if (hasError) {
    return 'We could not load your requests right now.';
  }

  return 'You have no reservation requests yet.';
}

const styles = StyleSheet.create({
  centeredPage: {
    flex: 1,
    justifyContent: 'center',
    gap: 14,
    padding: 24,
    backgroundColor: '#F5F7F5',
  },
  listContent: {
    padding: 20,
    paddingBottom: 48,
    gap: 12,
    backgroundColor: '#F5F7F5',
    flexGrow: 1,
  },
  header: {
    gap: 10,
    paddingBottom: 14,
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
    color: '#64716D',
    fontSize: 15,
    lineHeight: 22,
  },
  statusBox: {
    gap: 12,
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
