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
              Cash payments recorded by Dos Hermanos appear here. Final balance tracking will be added after reservation pricing and deposit rules are locked.
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

function PaymentLinkCard() {
  return (
    <View style={styles.linkCard} accessible accessibilityLabel="Online payment link coming soon">
      <View style={styles.linkBadge}>
        <Text style={styles.linkBadgeText}>Coming soon</Text>
      </View>
      <Text selectable style={styles.linkTitle}>
        Hosted payment link
      </Text>
      <Text selectable style={styles.linkCopy}>
        Card, QR, and e-wallet checkout is being prepared. No payment provider or live checkout is enabled yet, and this app does not collect card details.
      </Text>
      <Pressable accessibilityRole="button" accessibilityState={{ disabled: true }} disabled style={styles.disabledButton}>
        <Text style={styles.disabledButtonText}>Online payment not enabled</Text>
      </Pressable>
    </View>
  );
}

function PaymentReceiptCard({ receipt }: { receipt: PaymentReceipt }) {
  return (
    <View style={styles.receiptCard} accessible accessibilityLabel={`Cash payment ${formatMoney(receipt.amountInCentavos)}`}>
      <View style={styles.receiptHeading}>
        <View>
          <Text style={styles.receiptLabel}>Cash payment</Text>
          <Text selectable style={styles.receiptAmount}>
            {formatMoney(receipt.amountInCentavos)}
          </Text>
        </View>
        <Text selectable style={styles.receiptDate}>
          {formatReceiptDate(receipt.createdAt)}
        </Text>
      </View>
      <ReceiptRow label="Package" value={receipt.packageName} />
      <ReceiptRow label="Event date" value={formatEventDate(receipt.eventStartDate)} />
      {receipt.reference ? <ReceiptRow label="Reference" value={receipt.reference} /> : null}
    </View>
  );
}

function ReceiptRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.receiptRow}>
      <Text style={styles.receiptRowLabel}>{label}</Text>
      <Text selectable style={styles.receiptRowValue}>
        {value}
      </Text>
    </View>
  );
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

function formatMoney(amountInCentavos: number): string {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
  }).format(amountInCentavos / 100);
}

function formatEventDate(date: Date): string {
  return new Intl.DateTimeFormat('en-PH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

function formatReceiptDate(date: Date): string {
  return new Intl.DateTimeFormat('en-PH', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
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
  linkCard: {
    gap: 10,
    marginTop: 10,
    padding: 18,
    borderWidth: 1,
    borderColor: '#CFE3DD',
    borderRadius: 20,
    backgroundColor: '#EEF7F4',
  },
  linkBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: '#FFF1D8',
  },
  linkBadgeText: {
    color: '#6D4F16',
    fontSize: 11,
    fontWeight: '700',
  },
  linkTitle: {
    color: '#17211F',
    fontSize: 18,
    fontWeight: '700',
  },
  linkCopy: {
    color: '#586762',
    fontSize: 14,
    lineHeight: 21,
  },
  disabledButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 15,
    paddingVertical: 11,
    borderRadius: 999,
    backgroundColor: '#E0E6E2',
  },
  disabledButtonText: {
    color: '#6F7B77',
    fontSize: 13,
    fontWeight: '700',
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
  receiptCard: {
    gap: 12,
    padding: 18,
    borderWidth: 1,
    borderColor: '#DDE5E1',
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
  },
  receiptHeading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 14,
  },
  receiptLabel: {
    color: '#176B5B',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  receiptAmount: {
    marginTop: 4,
    color: '#17211F',
    fontSize: 24,
    fontWeight: '700',
  },
  receiptDate: {
    color: '#64716D',
    fontSize: 12,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  receiptRowLabel: {
    color: '#64716D',
    fontSize: 13,
  },
  receiptRowValue: {
    flexShrink: 1,
    color: '#263732',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'right',
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
