import { Pressable, StyleSheet, Text, View } from 'react-native';

export function PaymentLinkCard() {
  return (
    <View style={styles.card} accessible accessibilityLabel="Online payment link coming soon">
      <View style={styles.badge}>
        <Text style={styles.badgeText}>Coming soon</Text>
      </View>
      <Text selectable style={styles.title}>
        Hosted payment link
      </Text>
      <Text selectable style={styles.copy}>
        Card, QR, and e-wallet checkout is being prepared. No payment provider or live checkout is enabled yet, and this app does not collect card details.
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: true }}
        disabled
        style={styles.disabledButton}
      >
        <Text style={styles.disabledButtonText}>Online payment not enabled</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 10,
    marginTop: 10,
    padding: 18,
    borderWidth: 1,
    borderColor: '#CFE3DD',
    borderRadius: 20,
    backgroundColor: '#EEF7F4',
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: '#FFF1D8',
  },
  badgeText: {
    color: '#6D4F16',
    fontSize: 11,
    fontWeight: '700',
  },
  title: {
    color: '#17211F',
    fontSize: 18,
    fontWeight: '700',
  },
  copy: {
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
});
