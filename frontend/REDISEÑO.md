# REFSA Chat — Rediseño v2.0 (Frontend)

Este paquete contiene **solo los archivos modificados** del frontend para llevar el nuevo diseño empresarial de REFSA Chat sobre tu repo existente (`gouxgle/chatrefsa`).

## Cómo aplicarlo

1. Descomprimí el ZIP sobre la carpeta `frontend/` de tu repo (sobreescribiendo los archivos).
2. (Opcional) Asegurate de que `date-fns` y `lucide-react` ya estén instalados — están en tu `package.json` actual.
3. Levantá el stack como siempre:

```bash
docker-compose up -d --build
```

> No tocamos backend, sockets, rutas, ni la lógica de auth/chat. Solo CSS, JSX, layout y assets.

## ¿Qué cambia visualmente?

- **Identidad REFSA**: logo en login, sidebar, empty state y favicon. Colores corporativos (azul `#2D7FB0` + naranja `#F39C2F`).
- **Login / Registro / Forgot / Reset / Verify** con layout split-screen (panel de marca + formulario).
- **Sidebar** con header refinado, tira de marca, lista de chats con item activo destacado, control de **densidad** (compact / normal / cozy) y selector de **tema** claro/oscuro.
- **Chat window** con burbujas tinted blue-white, lienzo con resplandor brand sutil, indicadores `escribiendo…` con dots, área de input refinada.
- **Panel de grupo** con tabs (Miembros / Multimedia / Configuración), toggles para silenciar y permisos, acciones destructivas separadas.
- **Profile** con hero gradient REFSA, avatar 128 px solapado, tabs Cuenta / Seguridad, status chips clickeables.
- **Admin Dashboard** completamente rediseñado: tabs como píldoras, stat cards con trend chips, barras de almacenamiento proporcionales, role-pills y state-pills, paginación con info, empty states.
- **Sistema de toasts** in-app (`useToast`) — usado en envío de archivo, guardar perfil, crear/bloquear/eliminar usuarios, etc.
- **What's new tip** que se muestra una sola vez después del primer login post-rediseño.
- **Empty states** específicos: sin conversaciones, sin resultados de búsqueda, sin mensajes en thread.
- **Responsive mobile**: el sidebar se desliza, back button en el header del chat.

## Archivos modificados / nuevos

```
frontend/index.html                            — meta theme-color + favicon
frontend/public/favicon.png                     — favicon REFSA
frontend/src/index.css                          — tokens nuevos + densidad
frontend/src/App.jsx                            — wrap con ToastProvider
frontend/src/assets/refsa-mark.png              — variantes del logo
frontend/src/assets/refsa-mark-transparent.png
frontend/src/assets/refsa-logo-full.png
frontend/src/components/auth/AuthBrandPanel.jsx — panel de marca para auth
frontend/src/components/layout/Sidebar.jsx      — sidebar refactorizado
frontend/src/components/layout/ChatWindow.jsx   — panel de grupo + toasts + empty
frontend/src/components/layout/GroupInfoPanel.jsx — NUEVO: panel con tabs
frontend/src/components/WhatsNewTip.jsx         — NUEVO: banner novedades
frontend/src/context/ThemeContext.jsx           — agrega densidad
frontend/src/context/ToastContext.jsx           — NUEVO: sistema de toasts
frontend/src/pages/Auth.css                     — split-screen layout
frontend/src/pages/Chat.css                     — todo el sistema visual
frontend/src/pages/Chat.jsx                     — banner verificación + toast
frontend/src/pages/Login.jsx                    — usa AuthBrandPanel
frontend/src/pages/Register.jsx                 — usa AuthBrandPanel
frontend/src/pages/ForgotPassword.jsx           — usa AuthBrandPanel
frontend/src/pages/ResetPassword.jsx            — usa AuthBrandPanel
frontend/src/pages/VerifyEmail.jsx              — usa AuthBrandPanel
frontend/src/pages/Profile.jsx                  — rediseño hero + tabs
frontend/src/pages/admin/Dashboard.jsx          — rediseño completo
```

## Notas técnicas

- La densidad se guarda en `localStorage` como `density` (valor: `compact` / `normal` / `cozy`).
- El tema se guarda como `theme` (`light` / `dark`).
- El banner "Novedades" usa la clave `refsa-chat:whatsnew-v2-dismissed` — borrala si querés volver a verlo.
- Todos los iconos siguen viniendo de `lucide-react` (sin agregar dependencias nuevas).
- Las acciones destructivas en el panel de configuración del grupo y "agregar miembros" muestran un toast "Próximamente" — están listas para conectar al backend cuando se implementen.

— REFSA Chat · v2.0
