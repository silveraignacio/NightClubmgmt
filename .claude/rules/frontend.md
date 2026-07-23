# Rule: Frontend

> Next.js 14 App Router. React 18. Zustand para auth. Mobile-first para staff views.

## Reglas no negociables

### R1. App Router conventions

```
app/
├── layout.tsx           # Root layout con <AuthInitializer />
├── page.tsx             # Landing pública
├── (auth)/              # Group sin segmento en URL
│   ├── login/page.tsx
│   ├── register-club/page.tsx
│   └── register-member/page.tsx
├── admin/               # Protected — requires auth + role
│   ├── layout.tsx       # RBAC redirects + sidebar
│   ├── page.tsx         # Dashboard
│   └── door/page.tsx
├── member/              # Member portal
└── club/[slug]/         # Public landing por subdomain
```

### R2. `'use client'` solo cuando necesario

Páginas que usan `useEffect`, `useState`, hooks: `'use client'` arriba.
Páginas que solo renderizan HTML estático: server component (default, sin `'use client'`).

### R3. `useEffect([user])` está PROHIBIDO — usar `[user?.clubId]`

❌ **Causa infinite loop** (bug verificado en sesión anterior):
```tsx
useEffect(() => {
  loadData();
}, [user]); // user es objeto, cambia de referencia en cada checkAuth()
```

✅ **Correcto** (string primitivo, estable):
```tsx
useEffect(() => {
  loadData();
}, [user?.clubId]);
```

O envolver loader en `useCallback`:
```tsx
const loadData = useCallback(async () => {
  if (!user?.clubId) return;
  // ...
}, [user?.clubId]);

useEffect(() => { loadData(); }, [loadData]);
```

### R4. Auth check global, no por componente

`checkAuth()` se llama **una sola vez** en `app/layout.tsx` via `<AuthInitializer />`. NO en cada componente que usa `useAuth()`.

```tsx
// app/layout.tsx
function AuthInitializer() {
  const checkAuth = useAuthStore(s => s.checkAuth);
  const ran = useRef(false);
  useEffect(() => {
    if (!ran.current) { ran.current = true; checkAuth(); }
  }, []);
  return null;
}
```

### R5. State management: Zustand para auth, useState/useReducer para local

- **Global auth state** → `useAuthStore` (persist en localStorage)
- **Server state** → React Query (subutilizado hoy, futuro)
- **Form state** → react-hook-form + Zod resolver
- **Local UI state** → useState

NO usar Context API para auth (Zustand es más eficiente).

### R6. API calls via `apiClient` (axios), nunca fetch directo en componente

❌ **Inconsistente**:
```tsx
const res = await fetch(`${API_URL}/clubs/${clubId}/members`);
```

✅ **Correcto** (usa interceptor con JWT auto):
```tsx
import apiClient from '@/lib/api';
const res = await apiClient.get(`/clubs/${clubId}/members`);
```

Excepción: `register-club` usa `fetch` porque no hay JWT aún (OK pero podría refactorizarse).

### R7. Forms con react-hook-form + Zod

```tsx
const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});
type FormData = z.infer<typeof schema>;

const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
  resolver: zodResolver(schema),
});
```

### R8. Componentes en `@/components` con barrel export

```tsx
import { Button, Card, Modal, QRScanner } from '@/components';
```

Exports en `frontend/components/index.ts`. NO importar de paths profundos.

### R9. Tailwind para estilos, no CSS modules ni styled-components

```tsx
<div className="flex items-center gap-3 p-4 bg-white rounded-lg shadow-sm">
```

Usar utility classes. Cuando se repite mucho un patrón, crear componente reusable.

### R10. Lucide-react para iconos, sin custom SVGs ad-hoc

```tsx
import { QrCode, Camera, CheckCircle } from 'lucide-react';
```

**Cuidado**: lucide-react v0.303 no tiene `Ambulance`. Usar `Siren`. No usar `title` prop (no existe).

### R11. Mobile-first para vistas de staff

Las páginas `/admin/door`, `/admin/bar`, `/admin/security`:
- Botones grandes (mín. 44px de altura)
- Texto legible (mín. 14px)
- Layouts que funcionan en pantalla de 5-6"
- QR scanner full-width
- Aforo en vivo visible sin scroll

### R12. Loading + error states siempre

```tsx
if (loading) return <PageLoader />;
if (error) return <ErrorBanner message={error} />;
if (!data) return <EmptyState />;
return <ActualUI data={data} />;
```

No mostrar UI parcialmente cargada que confunda al usuario.

### R13. Componentes accesibles

- `aria-label` en botones con solo icono
- `role` correcto (`button`, `dialog`, etc.)
- Contraste mínimo WCAG AA
- Focus states visibles
- Forms con `<label htmlFor>` correcto

## Estructura de archivo de componente

```tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { Card, Button } from '@/components';
import { SomeIcon } from 'lucide-react';
import apiClient from '@/lib/api';

interface Props {
  // ...
}

export default function MyComponent({ ... }: Props) {
  const { user } = useAuth();
  const [data, setData] = useState(...);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!user?.clubId) return;
    setLoading(true);
    try {
      const res = await apiClient.get(`/clubs/${user.clubId}/...`);
      setData(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user?.clubId]);

  useEffect(() => { loadData(); }, [loadData]);

  if (loading) return <PageLoader />;
  return ( /* JSX */ );
}
```

## Cómo verificar cumplimiento

1. **Typecheck**: `npx tsc --noEmit` en frontend
2. **Lint**: `npm run lint`
3. **Build**: `npm run build` (catch errors de ESLint promovidos)

## Referencias

- Root layout: `frontend/app/layout.tsx`
- Auth store: `frontend/lib/store/authStore.ts`
- API client: `frontend/lib/api.ts`
- Auth hook: `frontend/lib/hooks/useAuth.ts`
- Components: `frontend/components/index.ts`
- QR scanner: `frontend/components/QRScanner.tsx`
- Subdomain middleware: `frontend/middleware.ts`
