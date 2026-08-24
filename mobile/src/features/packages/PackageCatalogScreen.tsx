import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../auth/AuthProvider';
import { PackageCard } from './PackageCard';
import { loadActivePackages } from './package.service';
import type { CateringPackage } from './package.types';

export function PackageCatalogScreen() {
  const router = useRouter();
  const { authState } = useAuth();
  const [packages, setPackages] = useState<CateringPackage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const requestNumber = useRef(0);

  const loadPackages = useCallback(async (isRefresh = false) => {
    const currentRequest = requestNumber.current + 1;
    requestNumber.current = currentRequest;

    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    setErrorMessage(null);

    try {
      const activePackages = await loadActivePackages();

      if (requestNumber.current === currentRequest) {
        setPackages(activePackages);
      }
    } catch {
      if (requestNumber.current === currentRequest) {
        setPackages([]);
        setErrorMessage('We could not load the packages right now. Please try again.');
      }
    } finally {
      if (requestNumber.current === currentRequest) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    void loadPackages();

    return () => {
      requestNumber.current += 1;
    };
  }, [loadPackages]);

  const canRequest = authState.status === 'active' && authState.profile?.role === 'customer';

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
              <Text selectable style={styles.brand}>
                Dos Hermanos
              </Text>
              <View style={styles.headerActions}>
                {canRequest ? (
                  <>
                    <HeaderAction label="Requests" onPress={() => router.push('/reservations')} />
                    <HeaderAction label="Payments" onPress={() => router.push('/payments')} />
                  </>
                ) : null}
                <HeaderAction label="Account" onPress={() => router.push('/account')} />
              </View>
            </View>

            <Text selectable style={styles.eyebrow}>
              Catering packages
            </Text>
            <Text selectable style={styles.title}>
              Choose a package that fits your event.
            </Text>
            <Text selectable style={styles.subtitle}>
              {canRequest
                ? 'Pick a package and send your event details for review.'
                : 'Browse available packages and sign in when you are ready to request one.'}
            </Text>
          </View>
        }
        ListEmptyComponent={
          <CatalogStatus
            isLoading={isLoading}
            errorMessage={errorMessage}
            onRetry={() => void loadPackages()}
          />
        }
        renderItem={({ item }) => (
          <PackageCard
            cateringPackage={item}
            onRequest={
              canRequest
                ? () =>
                    router.push({
                      pathname: '/reservation',
                      params: { packageId: item.id },
                    })
                : undefined
            }
          />
        )}
      />
    </SafeAreaView>
  );
}

function HeaderAction({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => pressed && styles.headerActionPressed}
    >
      <Text style={styles.headerAction}>{label}</Text>
    </Pressable>
  );
}

function CatalogStatus({
  isLoading,
  errorMessage,
  onRetry,
}: {
  isLoading: boolean;
  errorMessage: string | null;
  onRetry: () => void;
}) {
  if (isLoading) {
    return (
      <View style={styles.statusBox}>
        <ActivityIndicator size="small" color="#176B5B" />
        <Text selectable accessibilityLiveRegion="polite" style={styles.statusText}>
          Loading available packages…
        </Text>
      </View>
    );
  }

  if (errorMessage) {
    return (
      <View style={styles.statusBox}>
        <Text selectable accessibilityLiveRegion="assertive" style={styles.errorText}>
          {errorMessage}
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={onRetry}
          style={({ pressed }) => [styles.retryButton, pressed && styles.retryButtonPressed]}
        >
          <Text style={styles.retryButtonText}>Try again</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.statusBox}>
      <Text selectable style={styles.statusText}>
        No catering packages are available right now. Please check again later.
      </Text>
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
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16,
    marginBottom: 54,
  },
  brand: {
    color: '#17211F',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  headerActions: {
    maxWidth: 220,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: 12,
  },
  headerAction: {
    color: '#176B5B',
    fontSize: 13,
    fontWeight: '700',
    paddingVertical: 6,
  },
  headerActionPressed: {
    opacity: 0.6,
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
    color: '#586762',
    fontSize: 16,
    lineHeight: 25,
    marginTop: 18,
    maxWidth: 520,
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
    color: '#586762',
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
