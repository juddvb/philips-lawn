import { Link } from 'expo-router';
import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, fonts, radius, space, touch, type } from '../theme';
import { Icon } from './icons';

/** Scrollable page on the ground color, safe-area aware. */
export function Screen({ children, footer }: { children: ReactNode; footer?: ReactNode }) {
  return (
    <SafeAreaView style={s.screen} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
        {children}
      </ScrollView>
      {footer ? <View style={s.footer}>{footer}</View> : null}
    </SafeAreaView>
  );
}

/** Page title block with an optional kicker line and account shortcut. */
export function Header({ kicker, title, body, account }: { kicker?: string; title: string; body?: string; account?: boolean }) {
  return (
    <View style={s.header}>
      {kicker || account ? (
        <View style={s.headerRow}>
          <Text style={type.kicker}>{kicker}</Text>
          {account ? (
            <Link href="/account" asChild>
              <Pressable accessibilityRole="button" accessibilityLabel="Account" hitSlop={8} style={s.iconBtn}>
                <Icon name="account" color={colors.ink} />
              </Pressable>
            </Link>
          ) : null}
        </View>
      ) : null}
      <Text style={type.h1} accessibilityRole="header">{title}</Text>
      {body ? <Text style={type.body}>{body}</Text> : null}
    </View>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  return <View style={[s.card, style]}>{children}</View>;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled,
  busy,
}: {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'quiet';
  disabled?: boolean;
  busy?: boolean;
}) {
  const off = disabled || busy;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: off, busy }}
      disabled={off}
      onPress={onPress}
      style={({ pressed }) => [s.btn, s[variant], (pressed || off) && { opacity: off ? 0.5 : 0.85 }]}
    >
      {busy ? (
        <ActivityIndicator color={variant === 'primary' ? colors.surface : colors.ink} />
      ) : (
        <Text style={[s.btnText, variant === 'primary' && { color: colors.surface }]}>{title}</Text>
      )}
    </Pressable>
  );
}

export function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[s.chip, selected && s.chipOn]}
    >
      <Text style={[s.chipText, selected && { color: colors.surface }]}>{label}</Text>
    </Pressable>
  );
}

export function Field({ label, ...input }: { label: string } & TextInputProps) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={type.label}>{label}</Text>
      <TextInput accessibilityLabel={label} placeholderTextColor={colors.muted} style={s.input} {...input} />
    </View>
  );
}

/** Marks a screen whose real content arrives in a later build phase. */
export function ComingInPhase({ phase, what }: { phase: number; what: string }) {
  return (
    <Card style={{ borderStyle: 'dashed' }}>
      <Text style={type.label}>Coming in phase {phase}</Text>
      <Text style={type.small}>{what}</Text>
    </Card>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ground },
  content: { padding: space.xl, paddingTop: space.lg, gap: 14 },
  footer: { paddingHorizontal: space.xl, paddingTop: space.md, paddingBottom: space.lg, gap: 10, borderTopWidth: 1, borderTopColor: colors.line, backgroundColor: colors.ground },
  header: { gap: 6, marginBottom: 4 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: touch },
  iconBtn: { width: touch, height: touch, alignItems: 'center', justifyContent: 'center', marginRight: -10 },
  card: { backgroundColor: colors.surface, borderColor: colors.line, borderWidth: 1, borderRadius: radius.card, padding: 14, gap: 10 },
  btn: { minHeight: 52, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center', paddingHorizontal: space.lg },
  primary: { backgroundColor: colors.green },
  secondary: { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.ink },
  quiet: { minHeight: touch },
  btnText: { fontFamily: fonts.bodyBold, fontSize: 16, color: colors.ink },
  chip: { minHeight: touch, paddingHorizontal: space.md, justifyContent: 'center', borderRadius: 10, borderWidth: 1, borderColor: colors.control, backgroundColor: colors.surface },
  chipOn: { backgroundColor: colors.ink, borderColor: colors.ink },
  chipText: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.ink },
  input: { height: 48, paddingHorizontal: 14, borderWidth: 1.5, borderColor: colors.ink, borderRadius: radius.md, fontFamily: fonts.body, fontSize: 15, backgroundColor: colors.surface, color: colors.ink },
});
