import { StyleSheet, Text, View } from 'react-native';
import type { PaymentReceipt } from './payment.types';

export function PaymentReceiptCard({ receipt }: { receipt: PaymentReceipt }) {
  return (
    <View
      style={styles.card}
      accessible
      accessibilityLabel={`Cash payment ${formatMoney(receipt.amountInCentavos)}`}
    >
      <View style={styles.heading}>
        <View>
          <Text style={styles.label}>Cash payment</Text>
          <Text selectable style={styles.amount}>
            {formatMoney(receipt.amountInCentavos)}
          </Text>
        </View>
        <Text selectable style={styles.date}>
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
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text selectable style={styles.rowValue}>
        {value}
      </Text>
    </View>
  );
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
  card: {
    gap: 12,
    padding: 18,
    borderWidth: 1,
    borderColor: '#DDE5E1',
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
  },
  heading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 14,
  },
  label: {
    color: '#176B5B',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  amount: {
    marginTop: 4,
    color: '#17211F',
    fontSize: 24,
    fontWeight: '700',
  },
  date: {
    color: '#64716D',
    fontSize: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  rowLabel: {
    color: '#64716D',
    fontSize: 13,
  },
  rowValue: {
    flexShrink: 1,
    color: '#263732',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'right',
  },
});
