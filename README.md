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
- Os pasaremos un correo con el script de despliegue, una vez os llegue al correo nuestro mensaje, tendreis que 
