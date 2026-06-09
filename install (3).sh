#!/bin/bash

# =============================================================
#  SCRIPT DE INSTALACIÓN - PROYECTO MINECRAFT WEB
#  Repositorio: https://github.com/Rubentub/Proyectofinal
#  Instala Nginx + PHP + MySQL y despliega la web automáticamente
# =============================================================

set -e  # Si algo falla, el script se detiene

# ─── CONFIGURACIÓN DE LA BASE DE DATOS ───────────────────────
DB_NAME="gsbase"
DB_USER="gsuser"
DB_PASS="1234Gs@"
DB_ROOT_PASS="root1234"
# ─────────────────────────────────────────────────────────────

PROJECT_DIR="/var/www/minecraft"
REPO_URL="https://github.com/Rubentub/Proyectofinal.git"

# Colores para mensajes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

ok()   { echo -e "${GREEN}[OK]${NC} $1"; }
info() { echo -e "${YELLOW}[INFO]${NC} $1"; }
err()  { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# Comprobar que se ejecuta como root
if [ "$EUID" -ne 0 ]; then
  err "Ejecuta el script como root:  sudo bash install.sh"
fi

echo ""
echo "============================================"
echo "   INSTALACIÓN DEL PROYECTO MINECRAFT WEB  "
echo "============================================"
echo ""

# ─── PASO 1: Actualizar el sistema ────────────────────────────
info "Paso 1/9 - Actualizando el sistema..."
apt-get update -qq && apt-get upgrade -y -qq
ok "Sistema actualizado"

# ─── PASO 2: Instalar Nginx ────────────────────────────────────
info "Paso 2/9 - Instalando Nginx..."
apt-get install -y -qq nginx
systemctl enable nginx
systemctl start nginx
ok "Nginx instalado y arrancado"

# ─── PASO 3: Instalar PHP ──────────────────────────────────────
info "Paso 3/9 - Instalando PHP y extensiones..."

# Añadir repositorio oficial de PHP (ondrej/php) si no está ya
if ! grep -rq "ondrej/php" /etc/apt/sources.list.d/ 2>/dev/null; then
  info "Añadiendo repositorio oficial de PHP..."
  apt-get install -y -qq software-properties-common
  add-apt-repository -y ppa:ondrej/php
  apt-get update -qq
fi

apt-get install -y -qq \
  php8.2 \
  php8.2-fpm \
  php8.2-mysql \
  php8.2-curl \
  php8.2-mbstring \
  php8.2-xml \
  php8.2-zip
systemctl enable php8.2-fpm
systemctl start php8.2-fpm
ok "PHP 8.2 instalado"

# ─── PASO 4: Instalar MySQL ────────────────────────────────────
info "Paso 4/9 - Instalando MySQL..."
apt-get install -y -qq mysql-server
systemctl enable mysql
systemctl start mysql

# Configurar MySQL automáticamente
mysql -e "ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '${DB_ROOT_PASS}';" 2>/dev/null || true
mysql -u root -p"${DB_ROOT_PASS}" -e "CREATE DATABASE IF NOT EXISTS ${DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u root -p"${DB_ROOT_PASS}" -e "CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASS}';"
mysql -u root -p"${DB_ROOT_PASS}" -e "GRANT ALL PRIVILEGES ON ${DB_NAME}.* TO '${DB_USER}'@'localhost';"
mysql -u root -p"${DB_ROOT_PASS}" -e "FLUSH PRIVILEGES;"
ok "MySQL instalado y base de datos '${DB_NAME}' creada"

# ─── PASO 5: Instalar Git y clonar el repositorio ─────────────
info "Paso 5/9 - Descargando el proyecto desde GitHub..."
apt-get install -y -qq git

if [ -d "$PROJECT_DIR" ]; then
  info "La carpeta ya existe, actualizando el código..."
  cd "$PROJECT_DIR" && git pull
else
  git clone "$REPO_URL" "$PROJECT_DIR"
fi
ok "Proyecto descargado en ${PROJECT_DIR}"

# ─── PASO 5b: Importar la base de datos ───────────────────────
info "Paso 5b/9 - Importando la base de datos..."

SQL_FILE="${PROJECT_DIR}/database/gsbase.sql"

if [ -f "$SQL_FILE" ]; then
  mysql -u root -p"${DB_ROOT_PASS}" "${DB_NAME}" < "$SQL_FILE"
  ok "Base de datos importada correctamente (tablas: usuarios, servidores, incidencias, respuestas)"
else
  err "No se encontró el archivo SQL en ${SQL_FILE}. Asegúrate de que está subido a GitHub en la carpeta database/"
fi

# ─── PASO 6: Configurar conexion.php para local ───────────────
info "Paso 6/9 - Configurando conexión a la base de datos..."

cat > "${PROJECT_DIR}/conexion.php" <<PHPEOF
<?php
\$host = "localhost";
\$usuario = "${DB_USER}";
\$contraseña = "${DB_PASS}";
\$base_datos = "${DB_NAME}";

\$conn = new mysqli(\$host, \$usuario, \$contraseña, \$base_datos);

if (\$conn->connect_error) {
    die(json_encode(["status" => "error", "msg" => "Error de conexión: " . \$conn->connect_error]));
}
?>
PHPEOF

ok "conexion.php configurado para localhost"

# ─── PASO 6b: Corregir rutas de CSS, JS e imagen ─────────────
info "Paso 6b/9 - Corrigiendo rutas de CSS, JS y fondo..."

# El index.html busca /css/style.css y /script/script.js
# pero los archivos están en la raíz → creamos carpetas con enlaces simbólicos
mkdir -p "${PROJECT_DIR}/css"
mkdir -p "${PROJECT_DIR}/script"
ln -sf "${PROJECT_DIR}/style.css" "${PROJECT_DIR}/css/style.css"
ln -sf "${PROJECT_DIR}/script.js" "${PROJECT_DIR}/script/script.js"

ok "Rutas corregidas: CSS, JS y fondo apuntan a los archivos reales"

# ─── PASO 7: Configurar Nginx ──────────────────────────────────
info "Paso 7/9 - Configurando Nginx..."

cat > /etc/nginx/sites-available/minecraft <<NGINXEOF
server {
    listen 80;
    server_name localhost;

    root ${PROJECT_DIR};
    index index.html index.php;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location ~ \.php\$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/run/php/php8.2-fpm.sock;
        fastcgi_param SCRIPT_FILENAME \$document_root\$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\.ht {
        deny all;
    }
}
NGINXEOF

# Activar el sitio y desactivar el default
ln -sf /etc/nginx/sites-available/minecraft /etc/nginx/sites-enabled/minecraft
rm -f /etc/nginx/sites-enabled/default

# Permisos correctos
chown -R www-data:www-data "$PROJECT_DIR"
chmod -R 755 "$PROJECT_DIR"

# Reiniciar servicios
nginx -t && systemctl reload nginx
systemctl restart php8.2-fpm
ok "Nginx configurado y reiniciado"

# ─── PASO 8: Instalar Docker ───────────────────────────────────
info "Paso 8/10 - Instalando Docker..."

apt-get install -y -qq ca-certificates curl gnupg lsb-release

# Añadir clave GPG oficial de Docker
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg

# Añadir repositorio de Docker
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

apt-get update -qq
apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

systemctl enable docker
systemctl start docker

ok "Docker instalado y arrancado"

# ─── PASO 9: Instalar Ansible ──────────────────────────────────
info "Paso 9/10 - Instalando Ansible..."

apt-get install -y -qq software-properties-common
add-apt-repository -y ppa:ansible/ansible
apt-get update -qq
apt-get install -y -qq ansible

ok "Ansible instalado"

# ─── PASO 10: Instalar TLauncher ──────────────────────────────
info "Paso 10/10 - Instalando TLauncher..."

# Instalar Java (necesario para ejecutar TLauncher)
apt-get install -y -qq openjdk-17-jre

# Descargar TLauncher
TLAUNCHER_DIR="/opt/tlauncher"
mkdir -p "$TLAUNCHER_DIR"
curl -fsSL "https://dl2.tlauncher.org/f.php?f=files%2FTLauncher-2.895.jar" \
  -o "$TLAUNCHER_DIR/TLauncher.jar"

# Crear script de arranque
cat > /usr/local/bin/tlauncher <<'TLEOF'
#!/bin/bash
java -jar /opt/tlauncher/TLauncher.jar
TLEOF
chmod +x /usr/local/bin/tlauncher

# Crear acceso directo en el escritorio
cat > /usr/share/applications/tlauncher.desktop <<'DESKEOF'
[Desktop Entry]
Name=TLauncher
Comment=Minecraft Launcher
Exec=java -jar /opt/tlauncher/TLauncher.jar
Icon=application-x-java
Terminal=false
Type=Application
Categories=Game;
DESKEOF

ok "TLauncher instalado - ejecuta 'tlauncher' en terminal o búscalo en aplicaciones"

# ─── RESUMEN FINAL ────────────────────────────────────────────
echo ""
echo "============================================"
echo -e "${GREEN}  ✅ INSTALACIÓN COMPLETADA CON ÉXITO${NC}"
echo "============================================"
echo ""
echo "  🌐 Accede a la web:   http://localhost"
echo "  📁 Proyecto en:       ${PROJECT_DIR}"
echo "  🗄️  Base de datos:     ${DB_NAME}"
echo "  👤 Usuario BD:        ${DB_USER}"
echo "  🐳 Docker:            $(docker --version)"
echo "  📦 Ansible:           $(ansible --version | head -1)"
echo "  🎮 TLauncher:         tlauncher (o busca en aplicaciones)"
echo ""
echo "  ⚠️  Recuerda cambiar las contraseñas"
echo "     antes de usarlo en producción."
echo ""
