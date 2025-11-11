# Club Nightlife UI Components Library

Production-ready React component library for the Club Nightlife SaaS application. Built with TypeScript, Tailwind CSS, and accessibility best practices.

## Overview

This library provides 9 core components plus utility functions to build the Club Nightlife frontend efficiently and consistently.

## Components

| Component | Purpose | Key Features |
|-----------|---------|--------------|
| **Button** | Action triggers | 5 variants, 3 sizes, loading states, icons |
| **Input** | Form fields | Labels, error states, icons, helper text |
| **Card** | Content containers | Composable structure, shadow/padding variants |
| **Modal** | Dialogs | Animations, keyboard support, backdrop click |
| **Loading** | Progress indicators | Spinner, overlay, skeleton, page loader |
| **Navbar** | Top navigation | Logo, user menu, responsive, sticky |
| **Sidebar** | Admin menu | Collapsible, role-based, nested items, badges |
| **QRDisplay** | QR codes | Generate, download, copy, customizable |
| **StatsCard** | KPI display | Trends, colors, interactive, loading state |

## Quick Start

### Installation

```bash
npm install
```

### Basic Usage

```tsx
import { Button, Input, Card, CardContent } from '@/components';

export default function Example() {
  return (
    <Card>
      <CardContent className="space-y-4">
        <Input label="Username" />
        <Button fullWidth variant="primary">
          Submit
        </Button>
      </CardContent>
    </Card>
  );
}
```

## Features

### Accessibility
- Full ARIA support with proper labels and roles
- Keyboard navigation (Tab, Enter, Escape)
- Screen reader friendly
- Color contrast WCAG AA compliant
- Focus states on all interactive elements

### TypeScript
- Full type safety with exported types
- Generic type support
- Component prop interfaces
- Event handler typing

### Styling
- Tailwind CSS only (no CSS modules)
- Consistent design tokens
- Light and dark mode ready
- Responsive design patterns
- Class conflict resolution with `tailwind-merge`

### Developer Experience
- Forward refs on all components
- Display names for debugging
- Comprehensive prop documentation
- Example usage in each component
- Clear error messages

## File Structure

```
frontend/components/
├── Button.tsx              # Action button with variants
├── Input.tsx               # Form input with label and errors
├── Card.tsx                # Composable card with subcomponents
├── Modal.tsx               # Dialog with animations
├── Loading.tsx             # Spinner, overlay, skeleton loaders
├── Navbar.tsx              # Top navigation bar
├── Sidebar.tsx             # Collapsible sidebar menu
├── QRDisplay.tsx           # QR code generator and display
├── StatsCard.tsx           # Dashboard KPI card
├── index.ts                # Central export file
├── COMPONENTS.md           # Full documentation
├── QUICK_START.md          # Quick reference guide
└── README.md               # This file

frontend/lib/
├── utils.ts                # Utility functions
└── ... (other lib files)
```

## Dependencies

Required packages (all included in package.json):

- **React** 18.2+ - UI library
- **Next.js** 14+ - Framework
- **TypeScript** 5.3+ - Type safety
- **Tailwind CSS** 3.4+ - Styling
- **Framer Motion** 10+ - Animations
- **Lucide React** - Icons
- **QRCode React** - QR code generation
- **Class Variance Authority** 0.7+ - Component variants
- **clsx** & **tailwind-merge** - Class utilities

## Component Variants & Props

### Button Variants
```tsx
<Button variant="primary">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="danger">Delete</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="outline">Outline</Button>
```

### Button Sizes
```tsx
<Button size="sm">Small</Button>
<Button size="md">Medium</Button>
<Button size="lg">Large</Button>
```

### Input Features
```tsx
<Input label="Email" type="email" />
<Input leftIcon={<Mail />} />
<Input error="This field is required" />
<Input helperText="Helpful hint text" />
```

### Card Variants
```tsx
<Card shadow="lg" padding="xl" border="light">
  <CardContent>Content</CardContent>
</Card>
```

### Loading States
```tsx
<Spinner size="md" color="primary" />
<LoadingOverlay isLoading={true} message="Loading..." />
<Skeleton count={3} />
<PageLoader message="Please wait..." />
```

### StatsCard Colors
```tsx
<StatsCard color="purple" />
<StatsCard color="blue" />
<StatsCard color="green" />
<StatsCard color="red" />
<StatsCard color="orange" />
<StatsCard color="pink" />
```

## Common Patterns

### Form Handling
```tsx
import { useForm } from 'react-hook-form';
import { Button, Input } from '@/components';

export default function MyForm() {
  const { register, formState: { errors } } = useForm();

  return (
    <form>
      <Input {...register('email')} error={errors.email?.message} />
      <Button type="submit">Submit</Button>
    </form>
  );
}
```

### Layout Structure
```tsx
import { Navbar, Sidebar } from '@/components';

export default function Layout({ children }) {
  return (
    <div className="flex flex-col h-screen">
      <Navbar />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
```

### Modal Dialog
```tsx
import { Modal, Button } from '@/components';
import { useState } from 'react';

export default function MyModal() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>Open</Button>
      <Modal isOpen={open} onClose={() => setOpen(false)}>
        Content goes here
      </Modal>
    </>
  );
}
```

## Styling Customization

### Using cn() utility
```tsx
import { cn } from '@/lib/utils';
import { Button } from '@/components';

<Button className={cn('rounded-full', isActive && 'ring-2')} />
```

### Extending with Tailwind
```tsx
<Card className="bg-gradient-to-r from-purple-50 to-blue-50">
  <CardContent>Custom styling</CardContent>
</Card>
```

## Utility Functions

The `@/lib/utils` module provides helpers:

```tsx
import {
  cn,                    // Merge Tailwind classes
  formatCurrency,        // "$1,299.00"
  formatDate,            // "Nov 11, 2025"
  debounce,              // Debounce function calls
  throttle,              // Throttle function calls
  isEmpty,               // Check if value is empty
  truncate,              // Truncate strings
  isValidEmail,          // Email validation
  isValidPhone,          // Phone validation
  copyToClipboard,       // Copy to clipboard
  // ... and more
} from '@/lib/utils';
```

## Accessibility Best Practices

1. **Use semantic HTML**: Always use appropriate HTML elements
2. **Add labels**: Every input should have a label
3. **Error messages**: Show validation errors clearly
4. **Keyboard support**: All components are keyboard accessible
5. **Focus management**: Modal and dialogs manage focus
6. **ARIA attributes**: Used appropriately throughout
7. **Color contrast**: All text meets WCAG AA standards

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Performance Considerations

- Components use React.memo where appropriate
- Minimal re-renders with proper prop memoization
- Framer Motion animations are GPU-accelerated
- Components don't load unused icons
- Tree-shakeable exports

## Contributing

When adding new components:

1. Follow the existing component pattern
2. Include proper TypeScript types
3. Add accessibility attributes
4. Use Tailwind CSS for styling
5. Support both light and dark modes
6. Include display names for debugging
7. Export types alongside components
8. Update COMPONENTS.md with documentation
9. Add examples to QUICK_START.md

## Documentation

- **COMPONENTS.md** - Complete component documentation with examples
- **QUICK_START.md** - Quick reference and common patterns
- **README.md** - This file

## License

MIT - Part of Club Nightlife SaaS

## Support

For issues or questions about components:

1. Check COMPONENTS.md for full documentation
2. Review example code in QUICK_START.md
3. Check component props with TypeScript intellisense
4. Run `npm run lint` to check for issues

---

**Version:** 1.0.0
**Last Updated:** November 11, 2025
**Tailwind CSS Version:** 3.4+
**React Version:** 18.2+
