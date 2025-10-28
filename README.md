# Sinergia - Conexión Aleatoria Inteligente

Aplicación web para conectar empleados aleatoriamente mediante IA. Los usuarios pueden buscar conexiones por afinidad o reto, y participar en chats en tiempo real.

## 🚀 Stack Tecnológico

- **Frontend**: React + TypeScript + Vite
- **Estilos**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Edge Functions + Realtime)
- **IA**: Google Gemini API
- **Autenticación**: Supabase Auth
- **Router**: React Router v6

## 📋 Funcionalidades

### ✅ Autenticación
- Registro de usuarios
- Inicio de sesión
- Gestión de sesiones con Supabase Auth

### 👤 Perfil de Usuario
- Edición de información personal
- Habilidades, intereses profesionales y hobbies
- Disponibilidad y modo preferido

### 🔍 Playground (Búsqueda de Conexiones)
- Búsqueda por **Afinidad**: Usuarios con intereses similares
- Búsqueda por **Reto**: Usuarios con perspectivas diferentes
- Sugerencia opcional de tema de conversación
- Recomendaciones generadas por IA (Gemini)

### 💬 Chat en Tiempo Real
- Mensajería instantánea con Supabase Realtime
- Temas de conversación generados por IA basados en el input del usuario
- Interfaz intuitiva y responsiva
- **Resumen automático con IA** al terminar el chat
- **Puntos clave** extraídos de la conversación

### 📚 Historial de Conversaciones
- Resúmenes de chats anteriores
- Puntos clave destacados por IA
- Filtrado por fecha
- Acceso completo a todos tus chats pasados

## 🛠️ Configuración

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar variables de entorno

El archivo `.env` ya está configurado con las credenciales de Supabase. Las variables son:

```env
VITE_SUPABASE_URL=https://afhpqphlpuelytyyfiqt.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key
VITE_GEMINI_API_KEY=tu-gemini-api-key
```

### 3. Configurar Gemini API Key en Supabase

Las Edge Functions necesitan acceso a la API de Gemini. Configúrala en Supabase:

```bash
# Usando Supabase CLI (recomendado)
npx supabase secrets set GEMINI_API_KEY= --project-ref afhpqphlpuelytyyfiqt
```

O desde el Dashboard de Supabase:
1. Ve a **Project Settings** → **Edge Functions**
2. En **Secrets**, agrega:
   - `GEMINI_API_KEY`

### 4. Ejecutar la aplicación

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

## 📁 Estructura del Proyecto

```
sinergia-app/
├── src/
│   ├── components/
│   │   ├── ui/          # Componentes reutilizables (Button, Input, Card)
│   │   └── Layout.tsx   # Layout principal con navegación
│   ├── contexts/
│   │   └── AuthContext.tsx  # Context de autenticación
│   ├── lib/
│   │   └── supabase.ts      # Cliente de Supabase
│   ├── pages/
│   │   ├── Auth.tsx         # Login/Registro
│   │   ├── Profile.tsx      # Perfil de usuario
│   │   ├── Playground.tsx   # Búsqueda de conexiones
│   │   ├── Chat.tsx         # Chat en tiempo real
│   │   └── History.tsx      # Historial de chats
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── .env
└── package.json
```

## 🗄️ Base de Datos (Supabase)

### Tablas creadas:

1. **users**: Perfil extendido de usuarios
2. **matches**: Emparejamientos entre usuarios
3. **chat_messages**: Mensajes de chat
4. **chat_history**: Historial con resúmenes de IA

### Edge Functions desplegadas:

1. **find-recommendations**: Genera recomendaciones de usuarios con IA
2. **generate-topic**: Crea temas de conversación con IA basados en el input del usuario
3. **initiate-match**: Inicia un emparejamiento entre usuarios
4. **summarize-chat**: Genera resumen y puntos clave de la conversación con IA

### Row Level Security (RLS):

- Los usuarios solo pueden ver/editar su propio perfil
- Los mensajes de chat solo son visibles para los participantes
- Los matches solo son accesibles por los usuarios involucrados

## 🔒 Seguridad

- **RLS habilitado** en todas las tablas
- **Variables de entorno** para credenciales sensibles
- **Autenticación JWT** con Supabase
- **Validación** de permisos a nivel de base de datos

## 🎨 UI/UX

- Diseño moderno y minimalista
- Esquema de colores personalizado
- Modo claro/oscuro (preparado)
- Completamente responsivo
- Iconos de Lucide React

## 📝 Notas Importantes

1. **La aplicación requiere que configures la GEMINI_API_KEY en Supabase** para que las Edge Functions funcionen
2. Las Edge Functions ya están desplegadas y listas para usar
3. La base de datos tiene RLS activado para máxima seguridad
4. El chat usa Supabase Realtime para actualizaciones instantáneas

## 🐛 Solución de Problemas

### Error en Edge Functions
Si las recomendaciones de IA no funcionan, verifica que:
1. La `GEMINI_API_KEY` esté configurada en Supabase
2. Las Edge Functions estén activas en el proyecto

### Error de autenticación
Asegúrate de que las variables `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` estén correctas en `.env`

## 📄 Licencia

MIT
