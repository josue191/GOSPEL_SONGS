/**
 * Design system colors based on the application icon.
 * Modern, premium feel with Deep Blue and Gold accents.
 */

const TintColorLight = '#112940'; // Deep Blue from Icon
const TintColorDark = '#EAB308'; // Gold/Yellow from Icon

export const Colors = {
    light: {
        text: '#0F172A',
        background: '#F8FAFC',
        tint: TintColorLight,
        tabIconDefault: '#64748B',
        tabIconSelected: TintColorLight,
        primary: '#112940',
        secondary: '#334155',
        accent: '#D97706',
        muted: '#94A3B8',
        card: '#FFFFFF',
        border: '#E2E8F0',
    },
    dark: {
        text: '#F8FAFC',
        background: '#04070D', // Darker, premium black-ish blue
        tint: TintColorDark,
        tabIconDefault: '#64748B',
        tabIconSelected: TintColorDark,
        primary: '#112940', // Deep Blue from Icon
        secondary: '#1E293B',
        accent: '#EAB308', // Gold from Icon
        muted: '#64748B',
        card: '#0F172A', // Navy Card
        border: '#1E293B',
    },
};

export default Colors;
