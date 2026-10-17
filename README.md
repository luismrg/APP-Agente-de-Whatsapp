# Digloff - Software de Gestión de Taller Mecánico & Asistente IA de WhatsApp

**Digloff** es una plataforma integral para la gestión comercial y operativa de talleres mecánicos en España (`Europe/Madrid`), con CRM, vehículos y matrículas, oportunidades en tablero Kanban, calendario de citas con control de aforo en elevadores, bandeja de entrada compartida de WhatsApp (estilo Chatwoot) y un asistente virtual de IA (OpenRouter) capaz de consultar servicios, huecos libres y concertar citas automáticamente.

---

## 🚀 Tecnologías Principales

- **Frontend & Backend**: Next.js 15 (App Router), React 19, TypeScript.
- **Estilos & UI**: Tailwind CSS, Lucide Icons, diseño sobrio y moderno en modo claro (inspirado en Untitled UI y Linear).
- **Base de Datos & ORM**: SQLite local (`dev.db`) con Prisma ORM, preparado para migrar a PostgreSQL.
- **Autenticación**: Sesiones seguras mediante cookies HttpOnly con JWT (`jose`), contraseñas cifradas con `bcryptjs`, y control de acceso por roles (`ADMIN` y `EMPLEADO`).
- **Conexión de WhatsApp**: `@whiskeysockets/baileys` encapsulado en un patrón Singleton en `globalThis`, con almacenamiento de sesión persistente en `storage/baileys_auth` y reconexión automática tras reinicios.
- **Tiempo Real**: Server-Sent Events (SSE) vía `/api/realtime` con bus de eventos en memoria (`EventEmitter`).
- **Inteligencia Artificial**: OpenRouter API (compatible OpenAI) con llamada a herramientas (*Tool Calling*), buffer de espera de 8 segundos para agrupar ráfagas de mensajes del cliente y derivación automática a personas ante emergencias.

---

## 🔑 Credenciales de Acceso de Prueba (Seed)

La base de datos viene precargada con datos realistas en español de España:

| Rol | Correo Electrónico | Contraseña | Permisos |
| :--- | :--- | :--- | :--- |
| **Administrador** | `admin@digloff.com` | `admin1234` | Acceso total: Panel, Bandeja, Contactos, Potenciales, Calendario, Asistente IA, Usuarios, Negocio |
| **Empleado 1** | `marcos@digloff.com` | `empleado1234` | Panel, Bandeja (responder y notas internas), Contactos, Potenciales, Calendario |
| **Empleado 2** | `elena@digloff.com` | `empleado1234` | Panel, Bandeja, Contactos, Potenciales, Calendario |

---

## 🛠️ Puesta en Marcha Rápida (Localhost)

### 1. Variables de Entorno
Copia el archivo de ejemplo si no existe:
```bash
cp .env.example .env
```
Contenido básico del `.env`:
```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="digloff_jwt_secret_key_workshop_2026_super_secure"
ADMIN_EMAIL="admin@digloff.com"
ADMIN_PASSWORD="admin1234"
OPENROUTER_API_KEY="" # Opcional: añade tu clave de https://openrouter.ai/keys
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 2. Base de Datos y Semillado
```bash
npx prisma db push
npx tsx prisma/seed.ts
```

### 3. Iniciar el Servidor de Desarrollo
```bash
npm run dev
```
Abre en tu navegador: [http://localhost:3000](http://localhost:3000)

---

## 📱 Módulos y Pantallas

1. **Panel**: Métricas en tiempo real de conversaciones hoy/semana, % de atención de IA, citas de hoy y próximas, tiempo medio de primera respuesta, alerta de chats que requieren atención humana y gráfico de actividad de los últimos 30 días.
2. **Bandeja de Entrada de WhatsApp**:
   - 3 columnas: Lista de conversaciones con filtros (Mías, Sin asignar, Todas, Con IA, Necesitan atención, Resueltas), buscador por nombre/teléfono/matrícula.
   - Hilo de chat con burbujas diferenciadas (Cliente, IA, Empleado y Notas Internas privadas del taller).
   - Interruptor individual de IA por conversación. Si un empleado escribe a mano por WhatsApp, la IA se pausa automáticamente en esa conversación.
   - Ficha lateral con datos de contacto, vehículos y próximas citas con botón rápido para agendar.
3. **Contactos & Vehículos**: Directorio de clientes con alta manual o automática desde WhatsApp, vehículos con matrículas en formato europeo, kilometraje y acceso directo al chat.
4. **Potenciales (Embudo Kanban)**: 6 etapas (Nuevo, En conversación, Presupuesto enviado, Cita agendada, Ganado, Perdido) con arrastrar y soltar interactivo y cálculo acumulado en euros.
5. **Calendario**: Vistas Mes, Semana y Día, citas identificadas con etiqueta de origen IA o manual, cambio rápido de estado y validación estricta de aforo según número de elevadores simultáneos.
6. **Asistente de IA (Admin)**:
   - Visor de código QR en vivo con auto-reconexión Baileys.
   - Selector dinámico de modelo de OpenRouter y slider de temperatura.
   - Editor de personalidad y reglas de comportamiento.
   - CRUD de servicios del taller con casilla «Requiere valoración previa».
   - Horarios de apertura y capacidad de elevadores.
   - Base de conocimiento de preguntas frecuentes (coche de cortesía, garantías, Bizum).
   - Simulador de chat interactivo en vivo.
7. **Usuarios (Admin)**: Gestión de altas, edición y desactivación de empleados.
8. **Negocio (Admin)**: Datos fiscales, dirección, teléfono y logotipo del taller.

---

## 🔒 Zona Horaria e Idioma
Toda la interfaz y el formateo de fechas y horas operan bajo el estándar español:
- **Idioma**: Español de España (`es-ES`)
- **Zona Horaria**: `Europe/Madrid`
