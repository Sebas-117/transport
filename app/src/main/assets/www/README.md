# Aplicación de Transporte Escolar · TecNM Campus León

**Equipo 10 · Pablo Sebastián Amézquita Aldana · No. Control 23240020**  
**Asignatura:** Fundamentos de Ingeniería de Software  
**Docente:** Carlos Alberto Trujillo

## Descripción

Prototipo funcional (MVP) de la aplicación de gestión y consulta de transporte escolar, construido a partir de:

- Modelo de negocio (contexto, actores, procesos, entidades, reglas RN1–RN8)
- Business Model Canvas
- Objetivos SMART
- Especificación de Requisitos de Software (SRS)
- Diagramas UML conceptuales (casos de uso, clases, secuencia, actividad, BPMN)
- Upper CASE (Visual Paradigm)
- Método Kanban

## Cómo ejecutar

1. Abre el archivo `index.html` en cualquier navegador moderno, **o**
2. Sirve la carpeta con cualquier servidor estático:

```bash
cd transporte_escolar
python3 -m http.server 8080
```

Luego visita: http://localhost:8080

### Instalar en Android (PWA – se comporta como app)

1. Abre la URL en **Chrome** del celular (misma red Wi‑Fi si usas el servidor local, o sube la carpeta a un hosting gratuito).
2. Menú ⋮ → **Instalar aplicación** / **Añadir a la pantalla de inicio**.
3. Se crea un icono y se abre a pantalla completa (sin barra del navegador).

No hace falta Google Play ni APK firmado: es una Progressive Web App (PWA) instalable.

### Lector de QR (demostrable)

**Flujo de demostración:**

1. Entra como `alumno1` / `1234` → menú **Mi código QR**.  
   Se muestra un QR personal de abordaje (también se puede descargar).
2. En otro dispositivo (o pestaña) entra como `operador1` / `1234` → **Escanear QR**.
3. Pulsa **Abrir cámara y escanear** y apunta al QR del alumno  
   (en PC sin cámara usa el botón **Simular escaneo (alumno1)**).
4. El sistema valida al alumno, la ruta y la capacidad (RN4) y registra el abordaje + notificación.

El payload del QR es: `TE|{alumnoId}|{matricula}|{timestamp}`

## Usuarios de prueba


| Usuario     | Contraseña | Rol          |
|-------------|------------|--------------|
| admin       | 1234       | Administrador |
| operador1   | 1234       | Operador     |
| alumno1     | 1234       | Alumno       |
| tutor1      | 1234       | Padre/Tutor  |
| alumno2     | 1234       | Alumno       |
| operador2   | 1234       | Operador     |

## Funcionalidades implementadas

### Administrador
- Dashboard con indicadores
- Gestión de usuarios (RF01)
- Gestión de vehículos
- Gestión de rutas (RN1)
- Programación de viajes con validaciones RN3, RN4, RN7
- Inicio / finalización de recorridos
- Reportes e historial
- Visualización de las 8 reglas de negocio

### Operador
- Mis recorridos asignados
- Iniciar / finalizar recorrido (ciclo RN5)
- Lista de abordaje digital (reemplaza listas en papel)
- **Lector de QR con cámara** para registrar abordaje
- Reportar incidencias con botones rápidos → notificaciones automáticas (RN6)

### Alumno
- Consulta de su propia ruta (RN2)
- **Código QR personal de abordaje** (generación + descarga)
- Confirmación de uso del servicio con validación de capacidad (RN4)
- Notificaciones


### Padre / Tutor
- Consulta de ruta del alumno
- Vista de ubicación del transporte (GPS opcional / simulado)
- Notificaciones de incidencias y salida

## Reglas de negocio aplicadas

- **RN1** Solo admin crea/modifica rutas y asignaciones
- **RN2** Alumno solo ve su información
- **RN3** Operador + vehículo obligatorios para iniciar
- **RN4** No se excede la capacidad del vehículo
- **RN5** Ciclo: Programado → En proceso → Finalizado
- **RN6** Toda incidencia genera notificación
- **RN7** Vehículo no puede estar en dos recorridos el mismo día
- **RN8** Autenticación y menú por rol

## Tecnología

- HTML5 + CSS3 + JavaScript vanilla
- Bootstrap 5.3 (CDN) + Bootstrap Icons
- **html5-qrcode** – lector de QR con cámara del dispositivo
- **qrcodejs** – generación de códigos QR
- **PWA** (manifest.json + service worker) – instalable en Android
- Persistencia en `localStorage` (sin backend requerido)
- Diseño responsive (móvil primero)


## Notas

- Los datos se reinician con el botón “Reset datos demo” del menú.
- El módulo de GPS es simulado (como se indica en la documentación: “opcional”).
- El módulo de pagos se dejó fuera del alcance (marcado como “si se implementa” en el modelo de negocio).
- Este es un **prototipo académico** orientado a demostrar requisitos, reglas de negocio y flujos, no un sistema de producción.

## Referencias del proyecto

- Modelo de Negocio Transporte Escolar
- Especificación de Requisitos de Software (SRS)
- Presentaciones de Upper CASE, Kanban y Unidad 3 (Ingeniería de Requisitos)
