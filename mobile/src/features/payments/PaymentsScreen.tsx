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
import { PaymentLinkCard } from './PaymentLinkCard';
import { PaymentReceiptCard } from './PaymentReceiptCard';
import { subscribeToOwnPaymentReceipts } from './payment.service';
import type { PaymentReceipt } from './payment.types';

export function PaymentsScreen() {
  const router = useRouter();
  const { authState } = useAuth();
  const [receipts, setReceipts] = useState<PaymentReceipt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const customerId =
    authState.status === 'active' && authState.profile?.role === 'customer'
      ? authState.profile.id
      : null;

  useEffect(() => {
    if (!customerId) {
      setReceipts([]);
      setIsLoading(false);
      setHasError(false);
      return;
    }

    setIsLoading(true);
    setHasError(false);

    return subscribeToOwnPaymentReceipts(
      customerId,
      (nextReceipts) => {
        setReceipts(nextReceipts);
        setIsLoading(false);
      },
      () => {
        setReceipts([]);
        setHasError(true);
        setIsLoading(false);
      },
    );
  }, [customerId]);

  return (
    <>
      <Stack.Screen options={{ headerShown: true, title: 'Payments' }} />
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
      return (
        <View style={styles.centeredPage}>
          <Text selectable style={styles.title}>
            Sign in to view payments.
          </Text>
          <Text selectable style={styles.mutedText}>
            Payment receipts are private and are loaded only for the signed-in customer.
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
        data={receipts}
        keyExtractor={(receipt) => receipt.id}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text selectable style={styles.eyebrow}>
              Payments
            </Text>
            <Text selectable style={styles.title}>
              Your payment history.
            </Text>
            <Text selectable style={styles.mutedText}>
              Cash payments recorded by Dos Hermanos appear here. Final balance tracking will be
              added after reservation pricing and deposit rules are locked.
            </Text>
            <PaymentLinkCard />
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
        renderItem={({ item }) => <PaymentReceiptCard receipt={item} />}
      />
    );
  }
}

function getListMessage(isLoading: boolean, hasError: boolean): string {
  if (isLoading) {
    return 'Loading your payment receipts…';
  }

  if (hasError) {
    return 'We could not load your payment receipts right now.';
  }

  return 'No payments have been recorded for your reservations yet.';
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
    color: '#586762',
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
