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

**Paso 5: Instalar Docker**
Instala Docker Engine y Docker Compose, necesarios para crear y gestionar los contenedores de Minecraft. Cada servidor de Minecraft que un usuario crea desde la web se ejecuta en un contenedor Docker independiente usando la imagen itzg/minecraft-server, lo que permite que varios servidores funcionen al mismo tiempo en la misma máquina sin interferir entre ellos.

**Paso 6: Instalar Ansible**
Instala Ansible, la herramienta de automatización que gestiona el ciclo de vida de los servidores Minecraft. Cuando un usuario crea un servidor desde la web, Ansible ejecuta automáticamente un playbook que levanta el contenedor Docker correspondiente con la versión y configuración elegida. Esto permite que todo ocurra de forma automática sin que el usuario tenga que hacer nada técnico.

**Paso 7: Instalar TLauncher y Java 17**
Instala Java 17, que es el entorno necesario para poder ejecutar Minecraft, y descarga TLauncher, un launcher gratuito que permite jugar a Minecraft sin necesidad de cuenta de pago. Al terminar la instalación, el script crea automáticamente un acceso directo en el menú de aplicaciones del escritorio para que puedas abrirlo fácilmente cuando quieras conectarte a tu servidor.

**Último paso: Acceder a la página web**
Una vez que el script haya terminado, abre el navegador y escribe la IP de tu máquina así:
http://tu_ip
