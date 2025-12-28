# Seido Karate Club - Theme Customization Guide

This guide explains how to customize the application's theme without touching component code.

## 🎨 Theme Architecture

The theme system is completely separated from component logic, making it easy to:
- Change colors across the entire app
- Switch between different themes
- Support light/dark modes
- Maintain consistency

## 📁 Theme File Structure

```
src/theme/
├── config/
│   ├── colors.ts       # All color definitions
│   ├── typography.ts   # Font settings
│   ├── spacing.ts      # Spacing and border radius
│   └── layout.ts       # Breakpoints and layout
└── index.ts            # Main theme export
```

## 🎨 Changing Colors

### Current Theme: Seido Karate (Black & Gold)

The current theme uses:
- **Primary**: Deep black (#1a1a1a) - Professional and strong
- **Accent**: Gold (#FFD700) - From the Seido logo
- **Background**: Clean white with subtle grays

### How to Change Colors

Edit `src/theme/config/colors.ts`:

```typescript
export const colors = {
  light: {
    // Change primary color (currently black)
    primary: '0 0% 10%',      // HSL format: Hue Saturation Lightness
    
    // Change accent color (currently gold)
    accent: '45 100% 50%',    // 45° = gold/yellow hue
    
    // Change background
    background: '0 0% 100%',  // Pure white
    
    // ... other colors
  },
  dark: {
    // Dark mode variants
  }
}
```

### HSL Color Format

All colors use HSL (Hue, Saturation, Lightness) format:

```
'H S% L%'
 │ │  └─ Lightness (0% = black, 100% = white)
 │ └──── Saturation (0% = gray, 100% = vivid)
 └────── Hue (0-360°, color wheel position)
```

**Common Hues:**
- Red: 0°
- Orange: 30°
- Yellow/Gold: 45-60°
- Green: 120°
- Blue: 240°
- Purple: 270°

### Example: Change to Blue Theme

```typescript
export const colors = {
  light: {
    primary: '240 100% 25%',    // Deep blue instead of black
    accent: '200 100% 50%',     // Cyan accent instead of gold
    // ... rest stays the same
  }
}
```

The entire app will update automatically!

## 🔤 Changing Typography

Edit `src/theme/config/typography.ts`:

```typescript
export const typography = {
  fontFamily: {
    // Change from Inter to your preferred font
    sans: 'Roboto, system-ui, sans-serif',
    // Or use a custom font:
    sans: '"Your Custom Font", Inter, system-ui, sans-serif',
  },
  
  fontSize: {
    base: '1rem',     // Change base font size
    // ... other sizes
  },
}
```

### Using Custom Fonts

1. **Add font to `index.html`:**

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;600;700&display=swap" rel="stylesheet">
```

2. **Update typography config:**

```typescript
fontFamily: {
  sans: 'Roboto, system-ui, sans-serif',
}
```

## 📏 Changing Spacing

Edit `src/theme/config/spacing.ts`:

```typescript
export const spacing = {
  borderRadius: {
    xl: '0.75rem',    // Default border radius
    // Change to make everything more/less rounded
    xl: '1.5rem',     // More rounded
    xl: '0.25rem',    // Less rounded
  },
}
```

## 📱 Changing Breakpoints

Edit `src/theme/config/layout.ts`:

```typescript
export const layout = {
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
}
```

## 🌓 Light/Dark Mode

The theme automatically supports dark mode. Colors are defined for both modes in `colors.ts`.

### Testing Dark Mode

1. Open browser DevTools
2. Toggle dark mode:
   ```javascript
   document.documentElement.classList.toggle('dark')
   ```

### Customizing Dark Mode

Edit the `dark` section in `colors.ts`:

```typescript
export const colors = {
  light: {
    // Light mode colors
  },
  dark: {
    background: '0 0% 5%',     // Very dark background
    foreground: '0 0% 95%',    // Light text
    primary: '0 0% 15%',       // Slightly lighter than background
    accent: '45 100% 50%',     // Keep gold accent
    // ... other dark mode colors
  }
}
```

## 🎯 Using Theme in Components

### Option 1: CSS Variables (Recommended)

Components automatically use CSS variables:

```tsx
<div className="bg-primary text-primary-foreground">
  This uses theme colors automatically
</div>
```

### Option 2: Import Theme Config

```typescript
import { colors } from '@/theme';

// Use in JavaScript/TypeScript
const primaryColor = colors.light.primary;
```

### Option 3: Helper Functions

```typescript
import { getStatusClasses } from '@/theme';

// Get status-specific classes
const classes = getStatusClasses('pass');
// Returns: 'bg-green-50 text-green-700 ...'
```

## 🔄 Creating Multiple Themes

You can create multiple theme configurations:

### 1. Create Theme Variants

```typescript
// src/theme/config/colors.ts
export const themes = {
  seido: {
    light: { /* Seido colors */ },
    dark: { /* Seido dark */ },
  },
  
  alternative: {
    light: {
      primary: '240 100% 25%',  // Blue theme
      accent: '200 100% 50%',
      // ... other colors
    },
    dark: { /* Alternative dark */ },
  },
}

// Export current theme
export const colors = themes.seido;  // Change to themes.alternative
```

### 2. Runtime Theme Switching

Create a theme provider component to switch themes dynamically.

## 📋 Quick Reference

### Common Customizations

**Make everything more rounded:**
```typescript
// spacing.ts
borderRadius: { xl: '1.5rem' }
```

**Increase base font size:**
```typescript
// typography.ts
fontSize: { base: '1.125rem' }  // 18px instead of 16px
```

**Change primary color to blue:**
```typescript
// colors.ts
primary: '240 100% 25%'
```

**Use a different font:**
```typescript
// typography.ts
fontFamily: { sans: 'Roboto, system-ui, sans-serif' }
```

## 🎨 Color Palette Generator

Use these tools to generate HSL color palettes:
- [HSL Color Picker](https://hslpicker.com/)
- [Coolors](https://coolors.co/)
- [Adobe Color](https://color.adobe.com/)

## ✅ Best Practices

1. **Always use HSL format** for colors (not hex or rgb)
2. **Test both light and dark modes** after changes
3. **Maintain sufficient contrast** for accessibility
4. **Keep semantic naming** (primary, accent, etc.)
5. **Document custom colors** with comments

## 🔍 Debugging Theme Issues

### Colors not updating?

1. Check if you're using CSS variables correctly
2. Ensure `src/index.css` imports are correct
3. Clear browser cache and rebuild:
   ```bash
   rm -rf node_modules/.vite
   npm run dev
   ```

### Dark mode not working?

1. Verify dark mode classes in `index.css`
2. Check if `dark` class is applied to `<html>` element
3. Ensure dark mode colors are defined in `colors.ts`

---

**Happy theming! 🎨**

For questions or issues, refer to the main README.md or contact the development team.
