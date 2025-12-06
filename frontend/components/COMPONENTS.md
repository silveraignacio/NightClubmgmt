# Club Nightlife UI Components

A comprehensive library of production-ready, accessible React components for the Club Nightlife SaaS application. Built with TypeScript, Tailwind CSS, and accessibility best practices in mind.

## Table of Contents

1. [Button](#button)
2. [Input](#input)
3. [Card](#card)
4. [Modal](#modal)
5. [Loading](#loading)
6. [Navbar](#navbar)
7. [Sidebar](#sidebar)
8. [QRDisplay](#qrdisplay)
9. [StatsCard](#statscard)
10. [Utilities](#utilities)

---

## Button

Versatile button component with multiple variants, sizes, and loading states.

### Features
- **Variants**: `primary`, `secondary`, `danger`, `ghost`, `outline`
- **Sizes**: `sm`, `md`, `lg`
- **Loading State**: Built-in spinner animation
- **Icon Support**: Left and right icons
- **Accessibility**: ARIA attributes, focus states, keyboard support

### Usage

```tsx
import { Button } from '@/components';

export default function Example() {
  return (
    <>
      {/* Primary Button */}
      <Button variant="primary" size="md">
        Save Changes
      </Button>

      {/* Button with Loading State */}
      <Button isLoading={loading} loadingText="Saving...">
        Save
      </Button>

      {/* Button with Icons */}
      <Button
        leftIcon={<Save className="h-4 w-4" />}
        rightIcon={<ChevronRight className="h-4 w-4" />}
      >
        Next Step
      </Button>

      {/* Danger Button */}
      <Button variant="danger">Delete</Button>

      {/* Full Width Button */}
      <Button fullWidth variant="primary">
        Continue
      </Button>
    </>
  );
}
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'primary' \| 'secondary' \| 'danger' \| 'ghost' \| 'outline'` | `'primary'` | Button style variant |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Button size |
| `isLoading` | `boolean` | `false` | Show loading spinner |
| `loadingText` | `string` | `'Loading...'` | Text shown during loading |
| `leftIcon` | `ReactNode` | - | Icon shown on the left |
| `rightIcon` | `ReactNode` | - | Icon shown on the right |
| `fullWidth` | `boolean` | - | Make button full width |
| `disabled` | `boolean` | - | Disable the button |

---

## Input

Flexible text input component with labels, error states, icons, and helper text.

### Features
- **Label Support**: Integrated labels with required indicator
- **Error Handling**: Visual error states with icons and messages
- **Icons**: Support for left and right icons
- **Helper Text**: Guidance text below input
- **Accessibility**: ARIA labels, error descriptions
- **Full Width**: Optional full-width variant

### Usage

```tsx
import { Input } from '@/components';
import { Mail, Lock, AlertCircle } from 'lucide-react';

export default function Example() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  return (
    <>
      {/* Basic Input */}
      <Input
        label="Email"
        type="email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      {/* Input with Icon */}
      <Input
        label="Password"
        type="password"
        placeholder="Enter your password"
        leftIcon={<Lock className="h-4 w-4" />}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      {/* Input with Error */}
      <Input
        label="Username"
        error="Username is already taken"
        helperText="Choose a unique username"
      />

      {/* Full Width Input */}
      <Input
        label="Address"
        fullWidth
        required
        helperText="Your full street address"
      />
    </>
  );
}
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | `string` | - | Input label |
| `error` | `string` | - | Error message |
| `helperText` | `string` | - | Helper text below input |
| `leftIcon` | `ReactNode` | - | Icon on the left |
| `rightIcon` | `ReactNode` | - | Icon on the right |
| `fullWidth` | `boolean` | `false` | Full width variant |
| `type` | `string` | `'text'` | Input type |
| `disabled` | `boolean` | - | Disable the input |
| `required` | `boolean` | - | Mark as required |

---

## Card

Container component for grouping content with consistent styling and shadow effects.

### Features
- **Variants**: Multiple shadow and padding options
- **Subcomponents**: Header, Title, Description, Content, Footer
- **Border Options**: Light, dark, or no border
- **Interactive**: Optional hover effects
- **Flexible**: Composable structure

### Usage

```tsx
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components';
import { Button } from '@/components';

export default function Example() {
  return (
    <>
      {/* Basic Card */}
      <Card>
        <CardContent>
          <p>This is the card content</p>
        </CardContent>
      </Card>

      {/* Card with Structure */}
      <Card shadow="lg">
        <CardHeader>
          <CardTitle>User Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <p>User information goes here</p>
        </CardContent>
        <CardFooter>
          <Button variant="secondary">Cancel</Button>
          <Button variant="primary">Save</Button>
        </CardFooter>
      </Card>

      {/* Interactive Card */}
      <Card
        interactive
        onClick={() => console.log('Card clicked')}
      >
        <CardContent>
          <p>Click me!</p>
        </CardContent>
      </Card>
    </>
  );
}
```

### Card Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `shadow` | `'none' \| 'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'` | Shadow level |
| `padding` | `'none' \| 'sm' \| 'md' \| 'lg' \| 'xl'` | `'lg'` | Padding |
| `border` | `'none' \| 'light' \| 'dark'` | `'light'` | Border style |
| `interactive` | `boolean` | `false` | Add hover effects |

---

## Modal

Accessible modal dialog component with backdrop and animations.

### Features
- **Smooth Animations**: Fade and scale animations
- **Accessibility**: ARIA attributes, focus management
- **Keyboard Support**: Close on Escape key
- **Backdrop Click**: Optional close on backdrop click
- **Custom Sizes**: sm, md, lg, xl variants
- **Scrollable Content**: Auto-scroll when content is large
- **Portal**: Renders to document.body

### Usage

```tsx
import { Modal, Button, Input } from '@/components';
import { useState } from 'react';

export default function Example() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>
        Open Modal
      </Button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Create Event"
        description="Add a new event to your club"
        size="md"
        showCloseButton
      >
        <div className="space-y-4">
          <Input label="Event Name" placeholder="Enter event name" />
          <Input label="Date" type="date" />
        </div>
      </Modal>
    </>
  );
}
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `isOpen` | `boolean` | - | Control modal visibility |
| `onClose` | `() => void` | - | Callback when closing |
| `title` | `string` | - | Modal title |
| `description` | `string` | - | Modal description |
| `size` | `'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'` | Modal size |
| `showCloseButton` | `boolean` | `true` | Show close button |
| `closeOnBackdropClick` | `boolean` | `true` | Close on backdrop click |
| `closeOnEscapeKey` | `boolean` | `true` | Close on Escape key |
| `header` | `ReactNode` | - | Custom header |
| `footer` | `ReactNode` | - | Custom footer |

---

## Loading

Loading indicators for various use cases.

### Features
- **Spinner**: Animated loading spinner
- **LoadingOverlay**: Full or partial page overlay
- **Skeleton**: Placeholder skeleton for content
- **PageLoader**: Full-page loading state
- **Accessibility**: Proper ARIA attributes and roles

### Usage

```tsx
import { Spinner, LoadingOverlay, Skeleton, PageLoader } from '@/components';

export default function Example() {
  const [loading, setLoading] = useState(true);

  return (
    <>
      {/* Spinner */}
      <Spinner size="md" color="primary" />

      {/* Loading Overlay */}
      <div className="relative h-80">
        <LoadingOverlay
          isLoading={loading}
          message="Fetching data..."
        />
      </div>

      {/* Skeleton Loader */}
      <Skeleton count={3} height="h-4" width="w-full" />

      {/* Page Loader */}
      {loading && <PageLoader message="Loading..." />}
    </>
  );
}
```

### Component Props

**Spinner:**
- `size`: `'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'` (default: `'md'`)
- `color`: `'primary' | 'secondary' | 'white' | 'success' | 'error'`

**LoadingOverlay:**
- `isLoading`: `boolean`
- `message`: `string` (optional)
- `size`: `'sm' | 'md' | 'lg'` (default: `'md'`)
- `fullScreen`: `boolean` (default: `false`)

**Skeleton:**
- `count`: `number` (default: `1`)
- `height`: `string` (default: `'h-4'`)
- `width`: `string` (default: `'w-full'`)
- `circle`: `boolean` (default: `false`)

---

## Navbar

Top navigation bar with logo, links, and user menu.

### Features
- **Sticky**: Optional sticky positioning
- **Responsive**: Mobile hamburger menu
- **User Menu**: Dropdown with profile, settings, logout
- **Logo**: Custom logo/text support
- **Links**: Navigation links with icons
- **Right Content**: Slot for additional content

### Usage

```tsx
import { Navbar } from '@/components';
import { Home, Settings, LogOut } from 'lucide-react';
import { useState } from 'react';

export default function Example() {
  const [user, setUser] = useState({
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'Admin',
  });

  return (
    <Navbar
      logoText="Club Nightlife"
      user={user}
      links={[
        { label: 'Home', href: '/', icon: <Home className="h-4 w-4" /> },
        { label: 'Events', href: '/events' },
      ]}
      onLogout={() => {
        setUser(null);
        // Handle logout
      }}
      onProfileClick={() => {
        // Navigate to profile
      }}
      onSettingsClick={() => {
        // Navigate to settings
      }}
    />
  );
}
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `logo` | `ReactNode` | - | Logo component |
| `logoText` | `string` | `'Club Nightlife'` | Logo text |
| `user` | `NavbarUser \| null` | - | Current user |
| `links` | `NavbarLink[]` | `[]` | Navigation links |
| `sticky` | `boolean` | `true` | Sticky positioning |
| `onLogout` | `() => void` | - | Logout callback |
| `onProfileClick` | `() => void` | - | Profile click callback |
| `onSettingsClick` | `() => void` | - | Settings click callback |

---

## Sidebar

Admin sidebar with collapsible menu and role-based access.

### Features
- **Collapsible**: Collapse/expand functionality
- **Role-Based**: Show/hide items based on user role
- **Nested Items**: Support for submenu items
- **Badges**: Display counts/badges on items
- **Icons**: Icon support for menu items
- **Active States**: Highlight current page

### Usage

```tsx
import { Sidebar } from '@/components';
import { Home, Users, Settings, BarChart3 } from 'lucide-react';
import { useState } from 'react';

export default function Example() {
  const [collapsed, setCollapsed] = useState(false);

  const menuItems = [
    {
      label: 'Dashboard',
      href: '/dashboard',
      icon: <Home className="h-5 w-5" />,
    },
    {
      label: 'Members',
      href: '/members',
      icon: <Users className="h-5 w-5" />,
      badge: 12,
    },
    {
      label: 'Analytics',
      href: '/analytics',
      icon: <BarChart3 className="h-5 w-5" />,
      requiredRoles: ['admin'],
    },
    {
      label: 'Settings',
      icon: <Settings className="h-5 w-5" />,
      children: [
        { label: 'General', href: '/settings/general' },
        { label: 'Security', href: '/settings/security' },
      ],
    },
  ];

  return (
    <Sidebar
      items={menuItems}
      currentRole="admin"
      isCollapsed={collapsed}
      onCollapsedChange={setCollapsed}
      activeHref="/dashboard"
    />
  );
}
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `items` | `SidebarMenuItem[]` | - | Menu items |
| `currentRole` | `string` | - | Current user role |
| `activeHref` | `string` | - | Current active page |
| `isCollapsed` | `boolean` | `false` | Collapsed state |
| `onCollapsedChange` | `(collapsed: boolean) => void` | - | Collapse callback |
| `header` | `ReactNode` | - | Header content |
| `footer` | `ReactNode` | - | Footer content |

---

## QRDisplay

Component to display QR codes with download and copy functionality.

### Features
- **QR Generation**: Uses qrcode.react
- **Customizable**: Size, colors, error correction level
- **Download**: Download as PNG
- **Copy**: Copy to clipboard
- **Accessible**: Proper ARIA labels
- **Value Display**: Show encoded value

### Usage

```tsx
import { QRDisplay } from '@/components';

export default function Example() {
  const eventQRValue = 'https://club.example.com/events/abc123';

  return (
    <QRDisplay
      value={eventQRValue}
      title="Event QR Code"
      description="Scan to register for the event"
      size={256}
      level="H"
      showDownloadButton
      showCopyButton
      downloadFileName="event-qr.png"
    />
  );
}
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `string` | - | Value to encode |
| `size` | `number` | `256` | QR code size in pixels |
| `level` | `'L' \| 'M' \| 'Q' \| 'H'` | `'H'` | Error correction level |
| `title` | `string` | - | Display title |
| `description` | `string` | - | Display description |
| `showDownloadButton` | `boolean` | `true` | Show download button |
| `showCopyButton` | `boolean` | `true` | Show copy button |
| `downloadFileName` | `string` | `'qrcode.png'` | Download file name |
| `bgColor` | `string` | `'#ffffff'` | Background color |
| `fgColor` | `string` | `'#000000'` | Foreground color |

---

## StatsCard

KPI card component for dashboard displays.

### Features
- **Value Display**: Large, prominent numbers
- **Icons**: Color-coded icons
- **Trends**: Display trend direction and percentage
- **Colors**: 6 color variants
- **Loading State**: Skeleton loading
- **Interactive**: Optional click handler
- **Customizable**: Footer, action labels

### Usage

```tsx
import { StatsCard, StatsGrid } from '@/components';
import { Users, DollarSign, TrendingUp } from 'lucide-react';

export default function Example() {
  return (
    <StatsGrid columns={3}>
      <StatsCard
        title="Total Members"
        value="1,234"
        icon={<Users className="h-6 w-6" />}
        color="purple"
        trend={{ direction: 'up', value: 12, period: 'last month' }}
        actionLabel="View all"
        onClick={() => console.log('clicked')}
      />

      <StatsCard
        title="Revenue"
        value="$45,231"
        icon={<DollarSign className="h-6 w-6" />}
        color="green"
        trend={{ direction: 'up', value: 8 }}
      />

      <StatsCard
        title="Engagement"
        value="78%"
        icon={<TrendingUp className="h-6 w-6" />}
        color="blue"
        loading
      />
    </StatsGrid>
  );
}
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `string` | - | Card title |
| `value` | `string \| number` | - | Main value |
| `icon` | `ReactNode` | - | Display icon |
| `color` | Color variant | `'purple'` | Color scheme |
| `trend` | Object | - | Trend data |
| `description` | `string` | - | Description text |
| `loading` | `boolean` | `false` | Loading state |
| `compact` | `boolean` | `false` | Compact layout |
| `actionLabel` | `string` | - | Action text |
| `onClick` | `() => void` | - | Click handler |
| `footer` | `ReactNode` | - | Footer content |

---

## Utilities

Helper functions for common tasks.

### Available Functions

```tsx
import {
  cn,                    // Merge Tailwind classes
  formatCurrency,        // Format numbers as currency
  formatDate,            // Format dates
  formatDateTime,        // Format dates and times
  truncate,              // Truncate strings
  capitalize,            // Capitalize strings
  camelToSpace,          // Convert camelCase to spaces
  isEmpty,               // Check if value is empty
  debounce,              // Debounce functions
  throttle,              // Throttle functions
  generateId,            // Generate random IDs
  copyToClipboard,       // Copy to clipboard
  formatFileSize,        // Format file sizes
  parseQueryParams,      // Parse URL parameters
  buildQueryString,      // Build URL query strings
  sleep,                 // Delay execution
  isValidEmail,          // Validate email
  isValidPhone,          // Validate phone number
} from '@/lib/utils';
```

### Example Usage

```tsx
import { cn, formatCurrency, debounce, isValidEmail } from '@/lib/utils';

// Merge classes
const buttonClass = cn('px-4 py-2', isActive && 'bg-blue-500');

// Format currency
const price = formatCurrency(1299); // "$1,299.00"

// Debounce search
const handleSearch = debounce((query: string) => {
  // Make API call
}, 300);

// Validate email
if (!isValidEmail(email)) {
  setError('Invalid email');
}
```

---

## Installation & Setup

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Update Tailwind Config

The components work with the default Tailwind CSS configuration. Ensure `tailwind.config.ts` includes:

```ts
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

### 3. Import Components

```tsx
// Import individual components
import { Button, Input, Card } from '@/components';

// Or import from components/index.ts
import { Button, Modal, Navbar } from '@/components';
```

---

## Accessibility Features

All components include:

- **ARIA Labels**: Proper `aria-label`, `aria-describedby`, `aria-haspopup`
- **Keyboard Navigation**: Full keyboard support
- **Focus Management**: Visible focus states
- **Semantic HTML**: Proper heading levels, button types
- **Color Contrast**: WCAG AA compliant
- **Screen Reader Support**: Live regions, status announcements

---

## Best Practices

1. **Always use semantic HTML**: Use `<button>` for buttons, `<label>` for inputs
2. **Provide meaningful labels**: Use `aria-label` for icon-only buttons
3. **Test with keyboard**: Ensure all interactive elements are keyboard accessible
4. **Use error states**: Always show validation errors to users
5. **Loading states**: Provide feedback during async operations
6. **Role-based access**: Use sidebar role checks to protect sensitive content

---

## Troubleshooting

### "Cannot find module '@/components'"
- Ensure tsconfig.json has the `@/*` path alias
- Verify the components directory exists at `/frontend/components`

### Tailwind classes not applying
- Check that Tailwind CSS is properly installed
- Verify `tailwind.config.ts` includes the components path
- Rebuild with `npm run build`

### CVA not found
- Run `npm install class-variance-authority`
- Check package.json includes the dependency

---

## Contributing

When adding new components:

1. Follow the existing component structure
2. Export types alongside components
3. Include proper TypeScript types
4. Add accessibility attributes
5. Use Tailwind CSS for styling
6. Document with JSDoc comments
7. Include example usage in COMPONENTS.md

---

## License

MIT - Part of Club Nightlife SaaS
