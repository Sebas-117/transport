# Cómo generar el APK de Transporte Escolar

Proyecto Android listo: WebView a pantalla completa + permisos de cámara para el lector QR + todos los archivos de la app empaquetados en `assets/www`.

**Package ID:** `mx.tecnm.leon.transporte`  
**Nombre:** Transporte Escolar  
**minSdk:** 24 (Android 7+)

---

## Opción A — Android Studio (recomendado en tu PC)

1. Instala [Android Studio](https://developer.android.com/studio).
2. Abre la carpeta `android_app` como proyecto.
3. Espera a que Gradle sincronice (descarga SDK si hace falta).
4. Menú **Build → Build Bundle(s) / APK(s) → Build APK(s)**.
5. El APK queda en:
   ```
   app/build/outputs/apk/debug/app-debug.apk
   ```
6. Cópialo al celular e instálalo (activa “Orígenes desconocidos” / instalar apps desconocidas).

Desde terminal (con SDK instalado):

```bash
cd android_app
chmod +x gradlew
./gradlew assembleDebug
```

---

## Opción B — GitHub Actions (sin instalar nada)

1. Crea un repositorio nuevo en GitHub.
2. Sube **todo el contenido** de la carpeta `android_app`.
3. Ve a **Actions → Build APK → Run workflow**.
4. Al terminar, descarga el artefacto **TransporteEscolar-debug** (el `.apk`).

El workflow ya está en `.github/workflows/build-apk.yml`.

---

## Opción C — Línea de comandos (Linux/Mac con SDK)

```bash
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools
sdkmanager "platforms;android-34" "build-tools;34.0.0" "platform-tools"
cd android_app
./gradlew assembleDebug
```

---

## Qué incluye el APK

- App completa offline (HTML/CSS/JS + Bootstrap + QR)
- Lector de QR con cámara (permiso CAMERA)
- Roles: admin, operador, alumno, tutor
- Datos de demostración (usuarios `admin` / `operador1` / `alumno1` / `tutor1`, clave `1234`)

## Notas

- Es un APK **debug** (firmado con clave de depuración). Sirve para instalar y demostrar en clase.
- Para Play Store haría falta un keystore de release y preferiblemente un AAB (`./gradlew bundleRelease`).
- La primera vez que uses el escáner QR, Android pedirá permiso de cámara.
