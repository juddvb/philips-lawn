/**
 * Design tokens copied from the clickable prototype
 * (https://claude.ai/artifact/5HjExiVoXGXKgNnpH2BC9p).
 * Display type is Bricolage Grotesque, body is Public Sans. Fonts load in src/app/_layout.tsx.
 */

export const colors = {
  ground: '#F5F7F2',
  surface: '#FFFFFF',
  ink: '#14221A',
  muted: '#55655A',
  green: '#2B7A3A',
  greenDark: '#1E5A2A',
  greenTint: '#E3F0E1',
  line: '#DCE3D5',
  control: '#C7D1C1',
  warn: '#8A4B12',
  warnTint: '#FFF1DA',
  info: '#173F6B',
  infoTint: '#E2ECF7',
  highlight: '#FFD25A',
  /** Muted text on the dark ink header (pro dashboard). */
  onInkMuted: '#B9CBB8',
  error: '#A1261B',
} as const;

export const fonts = {
  display: 'BricolageGrotesque_700Bold',
  displaySemi: 'BricolageGrotesque_600SemiBold',
  body: 'PublicSans_400Regular',
  bodyMedium: 'PublicSans_500Medium',
  bodySemi: 'PublicSans_600SemiBold',
  bodyBold: 'PublicSans_700Bold',
} as const;

export const radius = { sm: 8, md: 12, lg: 14, card: 16, xl: 18 } as const;

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28 } as const;

/** Minimum touch target. */
export const touch = 44;

export const type = {
  h1: { fontFamily: fonts.display, fontSize: 30, lineHeight: 33, letterSpacing: -0.5, color: colors.ink },
  h2: { fontFamily: fonts.display, fontSize: 20, lineHeight: 24, color: colors.ink },
  stat: { fontFamily: fonts.display, fontSize: 22, color: colors.ink },
  body: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22, color: colors.muted },
  label: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.ink },
  kicker: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.muted },
  small: { fontFamily: fonts.body, fontSize: 12, lineHeight: 17, color: colors.muted },
} as const;
