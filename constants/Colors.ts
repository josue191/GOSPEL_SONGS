/**
 * Design system colors based on the application icon.
 * Modern, premium feel with Deep Blue and Gold accents.
 */

const TintColorLight = '#1E3A8A';
const TintColorDark = '#F59E0B';

export const Colors = {
    light: {
        text: '#0F172A',
        background: '#F8FAFC',
        tint: TintColorLight,
        tabIconDefault: '#64748B',
        tabIconSelected: TintColorLight,
        primary: '#1E3A8A',
        secondary: '#334155',
        accent: '#D97706',
        muted: '#94A3B8',
        card: '#FFFFFF',
        border: '#E2E8F0',
    },
    dark: {
        text: '#F8FAFC',
        background: '#0F172A',
        tint: TintColorDark,
        tabIconDefault: '#64748B',
        tabIconSelected: TintColorDark,
        primary: '#1E3A8A',
        secondary: '#1E293B',
        accent: '#F59E0B',
        muted: '#64748B',
        card: '#1E293B',
        border: '#334155',
    },
};

export default Colors;
