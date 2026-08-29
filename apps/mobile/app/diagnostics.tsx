import Feather from '@expo/vector-icons/Feather';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../src/components/Button';
import { Text } from '../src/components/Text';
import { ENTITLEMENT_PRO, PLACEMENTS, PRODUCTS, isTestStore, resolveApiKey } from '../src/purchases/config';
import { purchasesSupported, useEntitlements } from '../src/store/entitlements';
import { useTheme } from '../src/theme/ThemeProvider';

interface Probe {
  offerings: string[];
  currentOffering: string | null;
  packages: string[];
  entitlementsAll: string[];
  entitlementsActive: string[];
  placements: Record<string, string | null>;
  error: string | null;
}

/**
 * What RevenueCat actually reports.
 *
 * A misconfigured dashboard fails *silently*: a mistyped entitlement id reads
 * as "this user has not purchased", which looks like a business outcome rather
 * than a bug. This screen exists so that guess becomes a fact — it shows what
 * the code is looking for beside what the SDK actually returned.
 */
export default function DiagnosticsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const status = useEntitlements((s) => s.status);
  const reason = useEntitlements((s) => s.reason);
  const isPro = useEntitlements((s) => s.isPro);
  const configure = useEntitlements((s) => s.configure);

  const [probe, setProbe] = useState<Probe | null>(null);
  const [busy, setBusy] = useState(false);

  const run = useCallback(async () => {
    if (!purchasesSupported()) return;
    setBusy(true);
    try {
      const Purchases = (await import('react-native-purchases')).default;

      const offerings = await Purchases.getOfferings();
      const info = await Purchases.getCustomerInfo();

      const placements: Record<string, string | null> = {};
      for (const [name, id] of Object.entries(PLACEMENTS)) {
        try {
          const offering = await Purchases.getCurrentOfferingForPlacement(id);
          placements[name] = offering?.identifier ?? null;
        } catch {
          placements[name] = null;
        }
      }

      setProbe({
        offerings: Object.keys(offerings.all),
        currentOffering: offerings.current?.identifier ?? null,
        packages: (offerings.current?.availablePackages ?? []).map(
          (p) => `${p.identifier} → ${p.product.identifier} (${p.product.priceString})`,
        ),
        entitlementsAll: Object.keys(info.entitlements.all),
        entitlementsActive: Object.keys(info.entitlements.active),
        placements,
        error: null,
      });
    } catch (error) {
      setProbe({
        offerings: [],
        currentOffering: null,
        packages: [],
        entitlementsAll: [],
        entitlementsActive: [],
        placements: {},
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'ready') void run();
  }, [status, run]);

  const key = resolveApiKey();
  // Enough to confirm which key is loaded, never enough to reuse it.
  const maskedKey = key ? `${key.slice(0, 9)}…${key.slice(-4)}` : 'none';

  const entitlementMatches =
    probe !== null && probe.entitlementsAll.includes(ENTITLEMENT_PRO);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colour.bg, paddingTop: insets.top }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: theme.space.md,
          paddingHorizontal: theme.layout.gutter,
          paddingTop: theme.space.md,
          paddingBottom: theme.space.base,
        }}
      >
        <Pressable onPress={() => router.back()} hitSlop={10} accessibilityRole="button" accessibilityLabel="Back">
          <Feather name="chevron-left" size={22} color={theme.colour.textPrimary} />
        </Pressable>
        <Text variant="title2">Purchases diagnostics</Text>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: theme.layout.gutter,
          paddingBottom: theme.space['4xl'],
          gap: theme.space.lg,
        }}
      >
        <Section title="SDK">
          <Row label="Status" value={status} bad={status === 'unavailable'} />
          {!!reason && <Row label="Reason" value={reason} bad />}
          <Row label="Environment" value={purchasesSupported() ? 'supported' : 'not supported here'} bad={!purchasesSupported()} />
          <Row label="Key" value={maskedKey} bad={key === null} />
          <Row label="Store" value={isTestStore() ? 'Test Store (sandbox)' : 'production keys'} />
          <Row label="Pro active" value={isPro ? 'yes' : 'no'} />
        </Section>

        <Section title="What the code expects">
          <Row label="Entitlement" value={ENTITLEMENT_PRO} />
          <Row label="Products" value={Object.values(PRODUCTS).join(', ')} />
          <Row label="Placements" value={Object.values(PLACEMENTS).join(', ')} />
        </Section>

        <Section title="What RevenueCat returned">
          {probe === null ? (
            <Row label="Probe" value={busy ? 'running…' : 'not run'} />
          ) : probe.error ? (
            <Row label="Error" value={probe.error} bad />
          ) : (
            <>
              <Row
                label="Entitlements defined"
                value={probe.entitlementsAll.join(', ') || 'none'}
                bad={probe.entitlementsAll.length === 0}
              />
              <Row
                label="Name matches code"
                value={entitlementMatches ? 'yes' : `NO — code wants "${ENTITLEMENT_PRO}"`}
                bad={!entitlementMatches}
              />
              <Row label="Entitlements active" value={probe.entitlementsActive.join(', ') || 'none'} />
              <Row label="Offerings" value={probe.offerings.join(', ') || 'none'} bad={probe.offerings.length === 0} />
              <Row label="Current offering" value={probe.currentOffering ?? 'none'} bad={!probe.currentOffering} />
              <Row
                label="Packages"
                value={probe.packages.length ? probe.packages.join('\n') : 'none — a paywall cannot render'}
                bad={probe.packages.length === 0}
              />
              {Object.entries(probe.placements).map(([name, offering]) => (
                <Row key={name} label={`Placement ${name}`} value={offering ?? 'not configured (falls back)'} />
              ))}
            </>
          )}
        </Section>

        <View style={{ gap: theme.space.sm }}>
          <Button label={busy ? 'Checking…' : 'Run check again'} disabled={busy} onPress={() => void run()} />
          {status !== 'ready' && (
            <Button label="Retry configure" variant="secondary" onPress={() => void configure()} />
          )}
        </View>

        <Text variant="caption" colour="tertiary">
          If entitlements and offerings are empty, the dashboard has nothing attached to this
          key&apos;s project. If the entitlement name does not match, the code and the dashboard
          disagree — that fails silently as &quot;not purchased&quot;.
        </Text>
      </ScrollView>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const theme = useTheme();
  return (
    <View style={{ gap: theme.space.sm }}>
      <Text variant="overline" colour="tertiary">
        {title}
      </Text>
      <View
        style={{
          borderRadius: theme.radius.lg,
          borderWidth: theme.borderWidth.hairline,
          borderColor: theme.colour.border,
          backgroundColor: theme.colour.surface,
          padding: theme.space.base,
          gap: theme.space.sm,
        }}
      >
        {children}
      </View>
    </View>
  );
}

function Row({ label, value, bad = false }: { label: string; value: string; bad?: boolean }) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: theme.space.md, alignItems: 'flex-start' }}>
      <Text variant="caption" colour="tertiary" style={{ width: 132 }}>
        {label}
      </Text>
      <Text variant="caption" colour={bad ? 'danger' : 'primary'} style={{ flex: 1 }}>
        {value}
      </Text>
    </View>
  );
}
