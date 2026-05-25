# 💬 Chat Corporativo — WhatsApp Interno Empresarial

Una plataforma completa, moderna, responsive y segura de comunicación interna en tiempo real para empleados, diseñada con la experiencia premium de herramientas como WhatsApp Web, Slack y Discord.

---

## 🚀 Características Principales

### 1. Sistema de Usuarios
*   **Registro e Inicio de Sesión:** Acceso seguro con validación de correo electrónico y contraseña empresarial.
*   **Perfiles Personalizados:** Selección de nombre de usuario, subida de foto de perfil y actualización de estado personalizado ("¿Qué estás haciendo?").
*   **Estados de Conexión:** Indicador online/offline visual y hora de última conexión.
*   **Gestión de Estados:** Disponible (🟢), Ocupado (🟡), Ausente (⚪), No Molestar (🔴).

### 2. Roles y Permisos
*   **Rol Administrador y Empleado.**
*   **Panel de Administración (Dashboard):**
    *   Métricas en tiempo real (usuarios online, mensajes enviados, almacenamiento total usado).
    *   Gestión de usuarios: Bloquear, desbloquear, cambiar roles o eliminar cuentas.
    *   Visualización de logs de auditoría del sistema.
    *   Estadísticas detalladas de almacenamiento por categorías.

### 3. Chat Privado y en Tiempo Real
*   **Mensajería Instantánea:** Comunicación uno a uno fluida usando WebSockets con Socket.io.
*   **Indicador de Escritura:** Visualización de quién está escribiendo ("escribiendo...").
*   **Confirmación de Mensajes:** Doble check para mensajes enviados y leídos (azul al ser leídos).
*   **Emojis Integrados:** Selector rápido de emojis clasificados por categorías.
*   **Acciones en Mensajes:** Responder, editar, eliminar y reenviar mensajes a otros chats.
*   **Búsqueda:** Búsqueda en historial persistente almacenado en MySQL.
*   **Scroll Infinito:** Carga optimizada de mensajes anteriores al hacer scroll.

### 4. Grupos y Canales
*   **Grupos de Discusión:** Creación de salas de chat grupales para equipos.
*   **Canales por Departamento predeterminados:** Ventas, Administración, Soporte, Recursos Humanos.
*   **Administración del Grupo:** Roles dentro de grupos (Admin, Moderador, Miembro), descripción del grupo y listado de participantes.

### 5. Archivos Multimedia
*   **Envío de archivos diversos:** Imágenes, PDFs, Documentos Office, Videos, Audios y Archivos ZIP.
*   **Límites de tamaño configurables** y almacenamiento estructurado en el servidor.
*   **Vistas previas integradas:** Visualizador de imágenes, reproductor de video y opción de descarga rápida de archivos.

### 6. Diseño Premium y Experiencia de Usuario
*   **Temas Oscuro y Claro:** Totalmente integrado a las preferencias del usuario.
*   **Responsive:** Diseñado tanto para monitores de escritorio de alta resolución como para celulares.
*   **Animaciones Suaves:** Transiciones interactivas que añaden una sensación de fluidez y modernidad.

---

## 🛠️ Tecnologías Utilizadas

*   **Backend:** Node.js con Express, Socket.io para comunicación bidireccional y JWT para autenticación segura.
*   **Frontend:** React + Vite, Axios, React Router, Lucide Icons, Date-fns.
*   **Base de Datos & ORM:** MySQL 8.0 + Prisma ORM (para consultas tipadas y migraciones automatizadas).
*   **Contenedores:** Docker + Docker Compose para modularización y despliegue rápido.
*   **Seguridad:** Encriptación bcrypt para contraseñas, middleware de rate limiting, sanitización de datos (XSS), cabeceras de seguridad Helmet y CORS configurado.

---

## 📂 Estructura del Proyecto

```
chat/
├── backend/                  # Servidor de API Express y Sockets
│   ├── src/
│   │   ├── config/           # Base de datos e inicializaciones
│   │   ├── controllers/      # Controladores de rutas
│   │   ├── middleware/       # Autenticación, límites y validaciones
│   │   ├── routes/           # Definición de endpoints REST
│   │   ├── services/         # Lógica de negocio (Auth, Chat, Files, etc.)
│   │   ├── socket/           # Manejadores de eventos de Socket.io
│   │   ├── utils/            # Loggers y helpers
│   │   └── index.js          # Punto de entrada de la aplicación
│   ├── Dockerfile
│   └── package.json
├── frontend/                 # Aplicación SPA React
│   ├── src/
│   │   ├── api/              # Configuración de Axios
│   │   ├── components/       # Componentes visuales y reutilizables
│   │   ├── context/          # Contextos de Auth, Sockets y Tema
│   │   ├── pages/            # Páginas de Login, Registro, Chat, Perfil, Admin
│   │   ├── App.jsx           # Ruteo principal y envolturas
│   │   ├── index.css         # Hoja de estilos global y variables CSS
│   │   └── main.jsx          # Renderizado de React
│   ├── Dockerfile
│   ├── nginx.conf            # Configuración para servir la app en producción
│   └── package.json
├── prisma/                   # Esquema de base de datos y migraciones
│   ├── schema.prisma
│   └── seed.js               # Script para poblar la DB inicialmente
├── uploads/                  # Carpeta de almacenamiento para archivos multimedia
│   ├── avatars/
│   ├── images/
│   ├── documents/
│   ├── videos/
│   └── audio/
├── docker-compose.yml        # Configuración de contenedores
├── .env                      # Variables de entorno
├── .env.example              # Plantilla de variables de entorno
└── README.md                 # Guía del proyecto
```

---

## 🚀 Instalación y Despliegue con Docker (Recomendado)

### Requisitos Previos
*   Tener **Docker** y **Docker Compose** instalados en la máquina.

### Paso 1: Configurar Variables de Entorno
Copia el archivo de plantilla `.env.example` y crea tu archivo `.env` en la raíz del proyecto:
```bash
cp .env.example .env
```
Abre el archivo `.env` y define contraseñas seguras para MySQL y las claves JWT:
```env
MYSQL_PASSWORD=TuPasswordSeguraMySQL
MYSQL_ROOT_PASSWORD=TuRootPasswordSeguraMySQL
JWT_SECRET=UnSecretoMuyLargoYSeguroParaJWT
JWT_REFRESH_SECRET=OtroSecretoMuyLargoYSeguroParaRefresh
```

### Paso 2: Iniciar la Aplicación
Ejecuta el siguiente comando en la raíz del proyecto para descargar las imágenes, construir los contenedores y levantar la aplicación en segundo plano:
```bash
docker-compose up -d --build
```

Este comando levantará tres servicios automáticamente:
1.  **MySQL (`chat_mysql`)** expuesto en el puerto `3308` (evitando conflictos si ya tienes MySQL corriendo en el host).
2.  **Backend (`chat_backend`)** en el puerto `5000`.
3.  **Frontend (`chat_frontend`)** en el puerto `3000`.

La base de datos se migrará automáticamente y se poblará con datos semilla iniciales.

### Paso 3: Probar la Aplicación
Abre tu navegador e ingresa a:
👉 **[http://localhost:3000](http://localhost:3000)**

#### Cuentas de Prueba Creadas (Seed):
*   **Administrador:** `admin` o `admin@empresa.com` | Contraseña: `Ciudadano`
*   **Empleados de prueba:**
    *   `maria@empresa.com` | Contraseña: `empleado123`
    *   `carlos@empresa.com` | Contraseña: `empleado123`
    *   `ana@empresa.com` | Contraseña: `empleado123`

---

## 🛠️ Comandos Docker Útiles

*   **Ver el estado de los contenedores:**
    ```bash
    docker-compose ps
    ```
*   **Ver los logs del backend en tiempo real:**
    ```bash
    docker-compose logs -f backend
    ```
*   **Detener y remover los contenedores:**
    ```bash
    docker-compose down
    ```
*   **Reconstruir contenedores si realizas cambios:**
    ```bash
    docker-compose up -d --build
    ```
*   **Limpiar volúmenes de base de datos para empezar de cero:**
    ```bash
    docker-compose down -v
    ```

---

## 🔧 Instalación Manual (Desarrollo Local)

Si prefieres ejecutar los servicios localmente sin Docker, sigue estos pasos:

### 1. Base de Datos
*   Asegúrate de tener MySQL corriendo.
*   Crea una base de datos vacía llamada `chat_corporativo`.
*   Configura el archivo `.env` en la raíz con tu URL de conexión local:
    ```env
    DATABASE_URL="mysql://usuario:password@localhost:3306/chat_corporativo"
    ```

### 2. Ejecutar Backend
```bash
cd backend
npm install
npx prisma migrate dev --name init
npx prisma db seed
npm run dev
```
El servidor backend se iniciará en `http://localhost:5000`.

### 3. Ejecutar Frontend
En una nueva pestaña de la terminal:
```bash
cd frontend
npm install
npm run dev
```
El frontend se iniciará en `http://localhost:3000`.

---

## 🔒 Seguridad Aplicada
*   **Encriptación de contraseñas:** Implementación de `bcryptjs` con 12 rondas de salting para garantizar que las contraseñas no se almacenen en texto plano.
*   **Tokens JWT de doble capa:** Acceso seguro con Access Token de corta duración y Refresh Token persistido de forma segura.
*   **Rate Limiting:** Protección contra ataques de fuerza bruta y denegación de servicio (DoS) limitando los intentos de login y subida de archivos por IP.
*   **Protección XSS & Cabeceras:** Sanitización activa de mensajes para prevenir la inyección de scripts HTML/JS y uso de `helmet` para configurar cabeceras HTTP de seguridad robusta.
*   **Sanitización de Consultas:** Consultas tipadas de Prisma ORM que previenen ataques de inyección SQL.

---

## 📈 Guía para Producción
1.  **Variables de Entorno:** Nunca subas el archivo `.env` al repositorio de control de versiones. Genera claves JWT de alta seguridad y almacena las contraseñas en un administrador de configuración secreto.
2.  **CORS:** Limita la variable de entorno `FRONTEND_URL` al dominio de producción exacto de tu aplicación para restringir solicitudes maliciosas externas.
3.  **Tamaño de Archivos:** Ajusta la variable `MAX_FILE_SIZE` según el almacenamiento disponible de tu servidor.
4.  **Almacenamiento de Subidas:** En producción, es recomendable montar el volumen de la carpeta `/app/uploads` en un servicio de almacenamiento compartido o en la nube (ej: AWS S3, Google Cloud Storage) mediante controladores de volumen o adaptadores de código para garantizar la persistencia e independencia de los contenedores.
5.  **SSL/TLS:** Configura Nginx en producción para servir la aplicación bajo protocolo seguro `HTTPS` instalando un certificado SSL (ej: Let's Encrypt).
