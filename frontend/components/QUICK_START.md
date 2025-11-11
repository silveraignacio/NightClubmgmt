# UI Components Quick Start Guide

Fast reference for using Club Nightlife UI components in your frontend.

## Installation

```bash
cd frontend
npm install
```

## Basic Setup

1. **Tailwind CSS** is already configured
2. **Required dependencies** are in package.json:
   - `class-variance-authority` - Component variants
   - `framer-motion` - Animations
   - `lucide-react` - Icons
   - `qrcode.react` - QR code generation
   - `tailwind-merge` & `clsx` - Class merging

## Common Usage Patterns

### Form Page Example

```tsx
import { Button, Input, Card, CardContent, CardHeader, CardTitle } from '@/components';
import { Mail, Lock } from 'lucide-react';
import { useState } from 'react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // API call
    } catch (err) {
      setError('Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Sign In</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              leftIcon={<Mail className="h-4 w-4" />}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              leftIcon={<Lock className="h-4 w-4" />}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={error}
              required
            />

            <Button
              type="submit"
              fullWidth
              isLoading={loading}
              loadingText="Signing in..."
            >
              Sign In
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
```

### Dashboard Layout Example

```tsx
import { Navbar, Sidebar, SidebarMenuItem } from '@/components';
import { Home, Users, Settings, BarChart3, LogOut } from 'lucide-react';
import { useState } from 'react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [user] = useState({
    id: '1',
    name: 'John Doe',
    email: 'john@club.example.com',
    role: 'Admin',
  });

  const menuItems: SidebarMenuItem[] = [
    { label: 'Dashboard', href: '/dashboard', icon: <Home className="h-5 w-5" /> },
    { label: 'Members', href: '/members', icon: <Users className="h-5 w-5" />, badge: 5 },
    { label: 'Analytics', href: '/analytics', icon: <BarChart3 className="h-5 w-5" /> },
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
    <div className="min-h-screen bg-gray-50">
      <Navbar
        logoText="Club Nightlife"
        user={user}
        onLogout={() => {
          // Handle logout
          window.location.href = '/login';
        }}
      />

      <div className="flex">
        <Sidebar
          items={menuItems}
          currentRole={user.role}
          isCollapsed={sidebarCollapsed}
          onCollapsedChange={setSidebarCollapsed}
          activeHref="/dashboard"
        />

        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
```

### Dashboard Stats Example

```tsx
import { StatsCard, StatsGrid } from '@/components';
import { Users, DollarSign, TrendingUp, Calendar } from 'lucide-react';

export default function DashboardStats() {
  return (
    <StatsGrid columns={4} gap="lg">
      <StatsCard
        title="Total Members"
        value="1,234"
        icon={<Users className="h-6 w-6" />}
        color="purple"
        trend={{ direction: 'up', value: 12, period: 'last month' }}
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
        actionLabel="View details"
        onClick={() => console.log('View engagement')}
      />

      <StatsCard
        title="Events This Month"
        value="12"
        icon={<Calendar className="h-6 w-6" />}
        color="orange"
      />
    </StatsGrid>
  );
}
```

### Modal Dialog Example

```tsx
import { Modal, Button, Input } from '@/components';
import { useState } from 'react';

export default function EventForm() {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');

  const handleCreate = async () => {
    // API call to create event
    setIsOpen(false);
    setName('');
  };

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Create Event</Button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Create New Event"
        description="Add a new event to your club"
        footer={
          <div className="flex gap-2 justify-end w-full">
            <Button variant="secondary" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate}>Create</Button>
          </div>
        }
      >
        <Input
          label="Event Name"
          placeholder="Summer Festival"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </Modal>
    </>
  );
}
```

### QR Code Example

```tsx
import { QRDisplay } from '@/components';

export default function EventQR() {
  const eventUrl = `https://club.example.com/events/abc123`;

  return (
    <QRDisplay
      value={eventUrl}
      title="Event QR Code"
      description="Scan to register for the event"
      downloadFileName="event-registration.png"
    />
  );
}
```

## Component Import Paths

```tsx
// All components
import {
  Button,
  Input,
  Card, CardHeader, CardTitle, CardContent, CardFooter,
  Modal,
  Spinner, LoadingOverlay, Skeleton, PageLoader,
  Navbar,
  Sidebar,
  QRDisplay, QRScanner,
  StatsCard, StatsGrid,
} from '@/components';

// Utilities
import {
  cn,
  formatCurrency,
  formatDate,
  debounce,
  isValidEmail,
} from '@/lib/utils';
```

## Styling Tips

### Custom Styling
Use the `cn()` utility to merge classes:

```tsx
import { Button } from '@/components';
import { cn } from '@/lib/utils';

<Button className={cn('custom-class', isActive && 'active-state')}>
  Click me
</Button>
```

### Dark Mode
Components use gray colors by default. Add dark mode support:

```tsx
<Card className="dark:bg-gray-900 dark:border-gray-700">
  <CardContent>Content</CardContent>
</Card>
```

## Accessibility Checklist

- [ ] All interactive elements have visible focus states
- [ ] Use semantic HTML (`<button>`, `<label>`, etc.)
- [ ] Provide `aria-label` for icon-only buttons
- [ ] Always show error messages for validation
- [ ] Use `disabled` state instead of hiding elements
- [ ] Keyboard navigation works (Tab, Enter, Escape)
- [ ] Color is not the only indicator (use icons/text too)

## Common Props Reference

### All Components
- `className` - Additional CSS classes
- `ref` - Forward ref support

### Button
- `variant` - 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline'
- `size` - 'sm' | 'md' | 'lg'
- `isLoading` - Show loading state
- `disabled` - Disable button

### Input
- `label` - Input label
- `error` - Error message
- `type` - Input type (text, email, password, etc.)
- `required` - Mark as required

### Card
- `shadow` - 'none' | 'sm' | 'md' | 'lg' | 'xl'
- `padding` - 'none' | 'sm' | 'md' | 'lg' | 'xl'
- `border` - 'none' | 'light' | 'dark'
- `interactive` - Add hover effects

## Performance Tips

1. **Memoize Components**: Use `React.memo()` for components rendered in lists
2. **Lazy Load**: Use `React.lazy()` for heavy modals/overlays
3. **Debounce Handlers**: Use `debounce()` for search/filter inputs
4. **Optimize Re-renders**: Use `useCallback()` for event handlers

## Troubleshooting

**Components not styled?**
- Verify Tailwind CSS is imported in your layout
- Check PostCSS configuration
- Clear `.next` folder and rebuild

**Missing type errors?**
- Ensure `strict: true` in tsconfig.json
- Import types: `import type { ButtonProps } from '@/components'`

**Icons not showing?**
- Check lucide-react is installed
- Import from 'lucide-react'

## Further Reading

- Full documentation: See [COMPONENTS.md](./COMPONENTS.md)
- Tailwind CSS docs: https://tailwindcss.com
- Lucide Icons: https://lucide.dev
- Framer Motion: https://www.framer.com/motion
- Class Variance Authority: https://cva.style
