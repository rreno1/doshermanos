import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { loadActivePackages } from './package.service';
import type { CateringPackage } from './package.types';

const pesoFormatter = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export function PackageCatalogScreen() {
  const [packages, setPackages] = useState<CateringPackage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadPackages = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    setErrorMessage(null);

    try {
      const activePackages = await loadActivePackages();
      setPackages(activePackages);
    } catch {
      setPackages([]);
      setErrorMessage('We could not load the packages right now. Please try again.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadInitialPackages() {
      if (!isMounted) {
        return;
      }

      await loadPackages();
    }

    void loadInitialPackages();

    return () => {
      isMounted = false;
    };
  }, [loadPackages]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        data={packages}
        keyExtractor={(cateringPackage) => cateringPackage.id}
        contentContainerStyle={styles.content}
        refreshing={isRefreshing}
        onRefresh={() => void loadPackages(true)}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.brandRow}>
              <Text style={styles.brand}>Dos Hermanos</Text>
              <Text style={styles.location}>Hilongos, Leyte</Text>
            </View>
            <Text style={styles.eyebrow}>Catering packages</Text>
            <Text style={styles.title}>Choose a package that fits your event.</Text>
            <Text style={styles.subtitle}>
              Browse the currently available Dos Hermanos catering packages.
            </Text>
          </View>
        }
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.statusBox}>
              <ActivityIndicator size="small" color="#176B5B" />
              <Text style={styles.statusText}>Loading available packages…</Text>
            </View>
          ) : errorMessage ? (
            <View style={styles.statusBox}>
              <Text style={styles.errorText}>{errorMessage}</Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => void loadPackages()}
                style={({ pressed }) => [
                  styles.retryButton,
                  pressed && styles.retryButtonPressed,
                ]}
              >
                <Text style={styles.retryButtonText}>Try again</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.statusBox}>
              <Text style={styles.statusText}>
                No catering packages are available right now. Please check again later.
              </Text>
            </View>
          )
        }
        renderItem={({ item }) => <PackageCard cateringPackage={item} />}
      />
    </SafeAreaView>
  );
}

type PackageCardProps = {
  cateringPackage: CateringPackage;
};

function PackageCard({ cateringPackage }: PackageCardProps) {
  const displayedMenuItems = cateringPackage.menuHighlights.slice(0, 4);
  const remainingItemCount = Math.max(
    cateringPackage.menuHighlights.length - displayedMenuItems.length,
    0,
  );

  return (
    <View style={styles.packageCard}>
      <Text style={styles.packageLabel}>Catering package</Text>
      <Text style={styles.packageName}>{cateringPackage.name}</Text>
      <Text style={styles.packagePrice}>
        Starting at {pesoFormatter.format(cateringPackage.priceInCentavos / 100)}
      </Text>
      <Text style={styles.packageDescription}>{cateringPackage.description}</Text>

      {displayedMenuItems.length > 0 ? (
        <View style={styles.menuList}>
          {displayedMenuItems.map((menuItem) => (
            <View key={menuItem} style={styles.menuChip}>
              <Text style={styles.menuChipText}>{menuItem}</Text>
            </View>
          ))}
          {remainingItemCount > 0 ? (
            <View style={styles.menuChip}>
              <Text style={styles.menuChipText}>{remainingItemCount} more</Text>
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F7F5',
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    flexGrow: 1,
  },
  header: {
    paddingTop: 12,
    paddingBottom: 34,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 54,
  },
  brand: {
    color: '#17211F',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  location: {
    color: '#64716D',
    fontSize: 13,
  },
  eyebrow: {
    color: '#176B5B',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  title: {
    color: '#17211F',
    fontSize: 42,
    lineHeight: 44,
    fontWeight: '700',
    letterSpacing: -1.8,
    maxWidth: 500,
  },
  subtitle: {
    color: '#64716D',
    fontSize: 16,
    lineHeight: 25,
    marginTop: 18,
    maxWidth: 520,
  },
  packageCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E6E2',
    borderRadius: 24,
    padding: 22,
    marginBottom: 14,
  },
  packageLabel: {
    color: '#176B5B',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  packageName: {
    color: '#17211F',
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.8,
  },
  packagePrice: {
    color: '#0E5144',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 12,
  },
  packageDescription: {
    color: '#64716D',
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
  statusBox: {
    minHeight: 180,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E6E2',
    borderRadius: 22,
    padding: 24,
  },
  statusText: {
    color: '#64716D',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  errorText: {
    color: '#7F2C2C',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#176B5B',
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  retryButtonPressed: {
    backgroundColor: '#0E5144',
    transform: [{ scale: 0.98 }],
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
