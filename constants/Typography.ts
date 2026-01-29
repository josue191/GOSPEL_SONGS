/**
 * Typography system for the application.
 * Uses 'Inter' as the primary modern Sans Serif font.
 */

export const Typography = {
    // Font Families
    families: {
        regular: 'Inter_400Regular',
        medium: 'Inter_500Medium',
        bold: 'Inter_700Bold',
        black: 'Inter_900Black',
    },

    // Font Sizes
    sizes: {
        h1: 32,
        h2: 24,
        h3: 20,
        body: 16,
        bodySmall: 14,
        caption: 12,
        xs: 10,
    },

    // Hierarchy Presets
    presets: {
        heading1: {
            fontSize: 32,
            fontFamily: 'Inter_900Black',
            letterSpacing: -0.5,
        },
        heading2: {
            fontSize: 24,
            fontFamily: 'Inter_700Bold',
            letterSpacing: -0.2,
        },
        heading3: {
            fontSize: 20,
            fontFamily: 'Inter_700Bold',
        },
        body: {
            fontSize: 16,
            fontFamily: 'Inter_400Regular',
            lineHeight: 24,
        },
        bodyBold: {
            fontSize: 16,
            fontFamily: 'Inter_700Bold',
            lineHeight: 24,
        },
        bodySmall: {
            fontSize: 14,
            fontFamily: 'Inter_400Regular',
            lineHeight: 20,
        },
        caption: {
            fontSize: 12,
            fontFamily: 'Inter_500Medium',
            letterSpacing: 0.5,
            textTransform: 'uppercase' as const,
        },
    }
};

export default Typography;
