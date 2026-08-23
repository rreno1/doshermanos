import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { CateringPackage } from './package.types';

const pesoFormatter = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

type PackageCardProps = {
  cateringPackage: CateringPackage;
  onRequest?: () => void;
};

export function PackageCard({ cateringPackage, onRequest }: PackageCardProps) {
  const displayedMenuItems = cateringPackage.menuHighlights.slice(0, 4);
  const remainingItemCount = Math.max(
    cateringPackage.menuHighlights.length - displayedMenuItems.length,
    0,
  );

  return (
    <View style={styles.card}>
      <Text selectable style={styles.label}>
        Catering package
      </Text>
      <Text selectable style={styles.name}>
        {cateringPackage.name}
      </Text>
      <Text selectable style={styles.price}>
        Starting at {pesoFormatter.format(cateringPackage.priceInCentavos / 100)}
      </Text>
      <Text selectable style={styles.description}>
        {cateringPackage.description}
      </Text>

      {displayedMenuItems.length > 0 ? (
        <View style={styles.menuList} accessibilityLabel="Package highlights">
          {displayedMenuItems.map((menuItem) => (
            <View key={menuItem} style={styles.menuChip}>
              <Text selectable style={styles.menuChipText}>
                {menuItem}
              </Text>
            </View>
          ))}
          {remainingItemCount > 0 ? (
            <View style={styles.menuChip}>
              <Text selectable style={styles.menuChipText}>
                {remainingItemCount} more
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}

      {onRequest ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Request ${cateringPackage.name}`}
          onPress={onRequest}
          style={({ pressed }) => [styles.requestButton, pressed && styles.requestButtonPressed]}
        >
          <Text style={styles.requestButtonText}>Request this package</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E6E2',
    borderRadius: 24,
    padding: 22,
    marginBottom: 14,
  },
  label: {
    color: '#176B5B',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  name: {
    color: '#17211F',
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.8,
  },
  price: {
    color: '#0E5144',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 12,
  },
  description: {
    color: '#586762',
    fontSize: 15,
    lineHeight: 23,
    marginTop: 16,
  },
  menuList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 20,
  },
  menuChip: {
    backgroundColor: '#E5F3EF',
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 8,
  },
  menuChipText: {
    color: '#0E5144',
    fontSize: 13,
    fontWeight: '600',
  },
  requestButton: {
    alignSelf: 'flex-start',
    marginTop: 20,
    backgroundColor: '#176B5B',
    borderRadius: 999,
    paddingHorizontal: 17,
    paddingVertical: 12,
  },
  requestButtonPressed: {
    backgroundColor: '#0E5144',
    transform: [{ scale: 0.98 }],
  },
  requestButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
