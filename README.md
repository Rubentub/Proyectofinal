GameServer es una plataforma web diseñada para que cualquier usuario pueda crear y gestionar sus propios servidores de Minecraft de forma sencilla, sin necesidad de tener conocimientos técnicos avanzados. Desde la interfaz web, los usuarios pueden registrarse, elegir la versión del juego (Vanilla o Forge), seleccionar e instalar mods compatibles, y controlar el estado de su servidor (encenderlo, apagarlo o reiniciarlo) todo desde el navegador. Los visitantes no registrados también pueden acceder a la plataforma, aunque con acceso limitado a la sección de introducción.

Técnicamente, el proyecto se sustenta en tres máquinas virtuales interconectadas. La primera aloja los servidores de Minecraft, cada uno en un contenedor Docker independiente gestionado automáticamente mediante Ansible. La segunda máquina ejecuta la página web sobre Nginx, junto con el backend desarrollado en PHP y la base de datos MySQL, que almacena toda la información de usuarios y servidores. La tercera máquina se dedica exclusivamente a las copias de seguridad, que se generan automáticamente cada tres días mediante un script Bash, se transfieren por SSH y se limpian cada 30 días para evitar acumulación innecesaria de archivos. Pero nosotros hemos realizado un script de despliegue para que cuando ejecutes ese mismo script puedas acceder a nuestro proyecto y puedas navegar por la configuración, poner a tu gusto las configuraciones, cambiar la página, poder acceder a la página principal. 

Resumidamente, con este script de despliegue podrás obtener nuestro proyecto y poder tener tu propia base de datos o utilizar la que viene creada que es la nuestra. Ahora os explicaremos que hace este script realmente, que hace cada apartado y que contiene y por ulitmo a como darle permisos y como ejecutarlo

Este script lo que hace exactamente es automatizar completamente el despliegue de nuestro proyecto, este se encarga de:
- **Actualizar el sistema operativo**
- **Instalar Nginx con todos sus archivos**
- **Instalar PHP y sus extensiones**
- **Instalar MySQL donde tendrá la información de nuestra base de datos**
- **Cojera todos archivos desde el Github y los descargara**
- **Importara las tablas de la base de datos**
- **Configurara la conexión PHP-MySQL**
- **Por ultimo configurara Nginx para poder acceder a la página principal**

Primero de todo, brevemente os vamos a explicar como descargarse el script y como ejecutarlo:
- Os pasaremos un correo con el script de despliegue, una vez os llegue al correo nuestro mensaje os lo tendreis que descargar.
- Una vez os habeis descargardo este script, iremos al terminal y buscaremos el archivo con el siguiente comando:
    ```bash
  ls install.sh
  ```
- Despues de haber encontrado el script, habrá que darle permisos de ejecución con el siguiente comando:
  ```bash
  chmod +x install.sh
  ```
- Y por ultimo para poder ejecutarlo lo haremos de la siguiente manera:
  ```bash
  sudo ./install.sh
  ```

**Que hace cada apartado del script**
Ahora vamos a explicar lo que hace cada apartado del script uno a uno:
- **Paso 1: Actualizar el sistema**
En este paso lo que hace es actualizar los repositorios del sistema y los paquetes instalados.

- **Paso 2: Instalar Nginx**
Este paso se encarga del servicio web Nginx, que es el encargado de enseñar la página principal.

- **Paso 3: Instalar PHP**
Se instala la versión PHP8.2 junto a los módulos necesarios para que funcione correctamente.

- **Paso 4: Instalar y configurar MySQL**
Primero de todo se encarga de instalar MySQL, despues se encarga de crear la base de datos **gsbase** con su usuario **gsuser** y con la contraseña para poder acceder a la base de datos con el usuario (la contraseña se enviara por correo), y por ultimo le dara permisos de asginación.

- **Paso 5: Descargar el proyecto de github**
Primero de todo instala git para poder hacer un git clone y descargar el repositorio.

- **Paso 5b: Importar la base de datos**
Primero de todo, nosotros hemos metido en este script una copia de seguridad de nuestra base de datos para que se pueda importar correctamente.

- **Paso 6: Crear la conexion.php y el config.php**
El script genera automáticamente el config.php con los datos de la base de datos, el usuario y la contraseña (que esta evidentemente en un archivo diferente y no se va a subir en el repo) y crea la conexion.php con las siguientes lienas:
```bash
<?php
$config = include("config.php");

$conn = new mysqli(
    $config["host"],
    $config["user"],
    $config["password"],
    $config["db"]
);

if ($conn->connect_error) {
    die(json_encode([
        "status" => "error",
        "msg" => "Error de conexión: " . $conn->connect_error
    ]));
}
?>
```

- **Paso 6b: Corrige rutas**
Cuando llega esta parte se crean automáticamente las carpetas
```bash
css/
script/
```
Donde guardarán la información del style.css y del frontend script.js.
Por utlimo crea unos enlaces simbólicos.
```
css/style.css
script/script.js
```

- **Paso 7: Configuración de Nginx**
Se genera automáticamente el virtual host con las funciones principales.
```bash
server {
    listen 80;
    server_name localhost;
}
```
Donde estaran todos los archivos del proyecto y donde se econtrara la web será en esta ruta.
```bash
root /var/www/minecraft;
```
Php con el siguiente comando ```bash location ~ \.php$ ``` permitira ejecutar los scripts php mediante PHP-FPM.

Por seguridad las contraseñas seran hasheadas para la privacidad del usuario con los siguientes comandos:
Para registrar.php
```bash
$passwordHash = password_hash($password, PASSWORD_DEFAULT);
```
Para login.php
```bash
password_verify($passwordIntroducida, $hashGuardado)
```

- **Paso 8: Instalar Docker**
Instala Docker Engine y Docker Compose, necesarios para crear y gestionar los contenedores de Minecraft. Cada servidor de Minecraft que un usuario crea desde la web se ejecuta en un contenedor Docker independiente usando la imagen itzg/minecraft-server, lo que permite que varios servidores funcionen al mismo tiempo en la misma máquina sin interferir entre ellos.

- **Paso 9: Instalar Ansible**
Instala Ansible, la herramienta de automatización que gestiona el ciclo de vida de los servidores Minecraft. Cuando un usuario crea un servidor desde la web, Ansible ejecuta automáticamente un playbook que levanta el contenedor Docker correspondiente con la versión y configuración elegida. Esto permite que todo ocurra de forma automática sin que el usuario tenga que hacer nada técnico.

- **Paso 10: Instalar TLauncher y Java 17**
Instala Java 17, que es el entorno necesario para poder ejecutar Minecraft, y descarga TLauncher, un launcher gratuito que permite jugar a Minecraft sin necesidad de cuenta de pago. Al terminar la instalación, el script crea automáticamente un acceso directo en el menú de aplicaciones del escritorio para que puedas abrirlo fácilmente cuando quieras conectarte a tu servidor.

- **Último paso: Acceder a la página web**
Una vez que el script haya terminado, abre el navegador y escribe la IP de tu máquina así:
```bash
  http://localhost
  ```

Si falla el tema de crear servidores a partir de la web, hemos encontrado una solución a este problema. Habrá que utilizar una serie de comandos depende si quieres añadir mods o no, que ahora explicaremos en un momento.
- **Primero vamos a explicar sin mods**
Para crear un servidor a partir de Docker tendremos que añadir lo siguiente:
```bash
docker run -d \
--name xxxxx \
-p 25565:25565 \
-e EULA=TRUE \
-e TYPE=VANILLA \
-e VERSION=x.xx.x \
itzg/minecraft-server
```
Las x son los datos que tienes que poner tu a tu gusto, tanto el nombre del servidor que le quieras poner como la versión del servidor. Otra cosa muy importante es que si ya tienes un servidor creado con ```bash -p 25565:25565 ``` no podrás crear otro servidor con el mismo puerto, para crear otro servidor tendrás que cambiar el puerto de la izquierda de la siguiene manera.
```bash
-p 25566:25565
-p 25567:25565
```
Por si te interesa saber todo lo que ha pasado en tu servidor desde terminal, a partir del comando ```bash docker logs ``` podrás ver toda la información de tu servidor.
Exactamente te muestra mensajes de incio del servidor, te muestra los errores de este, te muestra algunas advtertencias de tu servidor, el progreso de descargar es decir, que versión tiene tu servidor, cuando se ha arrancado el Minecarft y por ultimo por si el servidor se crashea.

Y por ultimo para borrar cualquier servidor se utizara ```bash docker rm -f nombredelservidor```.

- **Con mods**
Primero de todo tenemos que crear la carpeta mods, si no esta creada ya desde el script, una vez se ha creado meteremos los mods que meteremos en el servidor con el siguiente comando ```bash cp mod1.jar /var/www/minecraft/mods/````.

Una vez hemos pasado los mods que queremos a la carpeta, tocará arrancar el servidor con docker run de la siguiente manera:
```bash
docker run -d \
--name xxxxxxx \
-p 25565:25565 \
-e EULA=TRUE \
-e TYPE=FORGE \
-e VERSION=x.xx.x \
-v /var/www/minecraft:/data \
itzg/minecraft-server
```
La diferencia entre sin mods y con mods es que si queremos crear un servidor sin mods no hará falta crear ninguna carpeta llamada mods, simplemente con crear el servidor a partir de docker run poniendo el nombre que prefieras y la versión que quieras ya vale. 

En cambio con mods es mucho más diferente, ya que tiene que haber una carpeta que se **mods** donde irán todos los mods que vayas a utilizar. Puedes crear una carpeta que este aislada de ```bash 
/var/www/minecraft
``` donde puedes guardar todos los mods que quieras tener para futuros servidores.
