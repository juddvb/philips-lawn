import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, type } from '../theme';
import { Icon } from './icons';
import { Screen } from './ui';

/** Brand mark, title and form area shared by sign-in and sign-up. */
export function AuthShell({ title, body, children, footer }: { title: string; body: string; children: ReactNode; footer?: ReactNode }) {
  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen footer={footer}>
        <View style={s.brand}>
          <Icon name="lawn" color={colors.green} />
          <Text style={s.brandText}>Philips Lawn</Text>
        </View>
        <View style={{ gap: 6 }}>
          <Text style={type.h1} accessibilityRole="header">{title}</Text>
          <Text style={type.body}>{body}</Text>
        </View>
        {children}
      </Screen>
    </KeyboardAvoidingView>
  );
}

export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <Text accessibilityRole="alert" style={s.error}>
      {message}
    </Text>
  );
}

const s = StyleSheet.create({
  brand: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 },
  brandText: { fontFamily: fonts.display, fontSize: 18, color: colors.green },
  error: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.error },
});
