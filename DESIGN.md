# Design

## Visual Theme
“Handcrafted luxury meets modern storytelling.” A soft, warm, and organic aesthetic that emphasizes heritage through a contemporary editorial lens.

## Color Palette
Using OKLCH for perceptual uniformity and brand depth.

| Name | OKLCH | Role | Usage |
|---|---|---|---|
| Henna Deep | `oklch(0.28 0.05 32)` | Primary Text / Accents | Deep, rich brown of dried henna |
| Terracotta | `oklch(0.58 0.11 48)` | Secondary / Accents | Warm earthy clay tones |
| Sage | `oklch(0.72 0.04 145)` | Tertiary / Accents | Muted botanical green |
| Warm Cream | `oklch(0.97 0.01 85)` | Background | Soft, non-pure white ivory |
| Sandstone | `oklch(0.88 0.03 78)` | Surface / Cards | Light earthy neutral |
| Muted Gold | `oklch(0.82 0.08 92)` | CTA / Interactive | Refined luxury accent |

## Typography
- **Headings**: `Bodoni Moda` (Serif). Elegant, high-contrast, editorial.
- **Body**: `Jost` (Sans-serif). Modern, geometric, readable.
- **Scale**: Minor Third (1.200) for product, Major Third (1.250) for brand storytelling.

## Layout & Spacing
- **Grid**: 12-column flexible grid with generous gutters (32px+).
- **Rhythm**: Varied vertical spacing (64px, 96px, 128px) to create editorial movement.
- **Containers**: Max-width 1440px, but allow full-bleed immersive sections.

## Components
- **Product Cards**: Softly rounded corners (8px), layered depth, asymmetrical layouts.
- **Buttons**: Minimalist, serif labels, subtle hover elevation.
- **Separators**: Fine ornamental lines inspired by henna patterns.
- **Navigation**: Transparent, floating, minimal.

## Motion & Interactions
- **Timing**: 300-500ms for storytelling reveals, 150-250ms for functional feedback.
- **Easing**: Exponential ease-out (`cubic-bezier(0.16, 1, 0.3, 1)`).
- **Parallax**: Subtle layered movement in hero and story sections.
- **Hover**: Organic elevation and soft color transitions.
