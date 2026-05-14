<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

include("conexion.php");

$data   = json_decode(file_get_contents("php://input"), true);
$accion = $data["accion"] ?? "";

// ---------------------------------------------------------
// CREAR SERVIDOR
// ---------------------------------------------------------
if ($accion === "crearServidor") {
    $nombre  = $data["nombre"]  ?? "";
    $version = $data["version"] ?? "";
    $tipo    = $data["tipo"]    ?? "";
    $usuario = $data["usuario"] ?? "";
    $puerto  = rand(25570, 25999);

    if (!$nombre) {
        echo json_encode(["status" => "error", "msg" => "Nombre vacío"]);
        exit;
    }

    $stmt = $conn->prepare("SELECT id_usuarios FROM usuarios WHERE nombre = ?");
    $stmt->bind_param("s", $usuario);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 0) {
        echo json_encode(["status" => "error", "msg" => "Usuario no encontrado"]);
        exit;
    }

    $row        = $result->fetch_assoc();
    $id_usuario = $row['id_usuarios'];
    $stmt->close();

    $stmt = $conn->prepare("INSERT INTO servidores (id_usuarios, nombre_servidor, version, tipo_version) VALUES (?, ?, ?, ?)");
    $stmt->bind_param("isss", $id_usuario, $nombre, $version, $tipo);

    if (!$stmt->execute()) {
        echo json_encode(["status" => "error", "msg" => "Error bbdd: " . $stmt->error]);
        exit;
    }
    $stmt->close();

    $cmd = "ansible-playbook /var/www/html/crear_servidor.yml --extra-vars 'nombre=$nombre version=$version tipo=$tipo puerto=$puerto' 2>&1";
    shell_exec($cmd);

    echo json_encode([
        "status"   => "ok",
        "msg"      => "Servidor creado correctamente",
        "conexion" => "192.168.15.124:$puerto",
        "puerto"   => $puerto
    ]);
    exit;
}

// ---------------------------------------------------------
// PARAR SERVIDOR
// ---------------------------------------------------------
if ($accion === "pararServidor") {
    $nombre = $data["nombre"] ?? "";

    if (!$nombre) {
        echo json_encode(["status" => "error", "msg" => "Nombre vacío"]);
        exit;
    }

    $cmd = "sudo docker stop " . escapeshellarg($nombre) . " 2>&1";
    shell_exec($cmd);

    echo json_encode(["status" => "ok", "msg" => "Servidor parado"]);
    exit;
}

// ---------------------------------------------------------
// ARRANCAR SERVIDOR
// ---------------------------------------------------------
if ($accion === "arrancarServidor") {
    $nombre = $data["nombre"] ?? "";

    if (!$nombre) {
        echo json_encode(["status" => "error", "msg" => "Nombre vacío"]);
        exit;
    }

    $cmd = "sudo docker start " . escapeshellarg($nombre) . " 2>&1";
    shell_exec($cmd);

    echo json_encode(["status" => "ok", "msg" => "Servidor arrancado"]);
    exit;
}

// ---------------------------------------------------------
// LISTAR SERVIDORES
// ---------------------------------------------------------
if ($accion === "listarServidores") {
    $usuario = $data["usuario"] ?? "";

    if (!$usuario) {
        echo json_encode(["status" => "error", "msg" => "Usuario no especificado"]);
        exit;
    }

    $stmt = $conn->prepare("
        SELECT s.nombre_servidor, s.version, s.tipo_version, s.fecha_creacion_servidor
        FROM servidores s
        INNER JOIN usuarios u ON s.id_usuarios = u.id_usuarios
        WHERE u.nombre = ?
    ");
    $stmt->bind_param("s", $usuario);
    $stmt->execute();
    $result = $stmt->get_result();

    $servidores = [];
    while ($row = $result->fetch_assoc()) {
        $nombre_srv = $row['nombre_servidor'];
        $estado_raw = shell_exec("sudo docker inspect -f '{{.State.Running}}' " . escapeshellarg($nombre_srv) . " 2>&1");
        $estado     = trim($estado_raw) === 'true' ? 'Encendido' : 'Apagado';

        $servidores[] = [
            "nombre"  => $nombre_srv,
            "version" => $row['version'],
            "tipo"    => $row['tipo_version'],
            "fecha"   => $row['fecha_creacion_servidor'],
            "estado"  => $estado
        ];
    }
    $stmt->close();
    $conn->close();

    echo json_encode(["status" => "ok", "servidores" => $servidores]);
    exit;
}

// ---------------------------------------------------------
// INSTALAR MODS
// ---------------------------------------------------------
if ($accion === "instalarMods") {
    $nombre  = $data["nombre"]  ?? "";
    $mods    = $data["mods"]    ?? [];
    $usuario = $data["usuario"] ?? "";

    if (!$nombre || empty($mods)) {
        echo json_encode(["status" => "error", "msg" => "Datos incompletos"]);
        exit;
    }

    $mods_str  = implode(",", array_map('trim', $mods));
    $num_mods  = count($mods);

    $stmt = $conn->prepare("
        UPDATE servidores s
        INNER JOIN usuarios u ON s.id_usuarios = u.id_usuarios
        SET s.nombre_mod = ?, s.num_mods = ?
        WHERE s.nombre_servidor = ? AND u.nombre = ?
    ");
    $stmt->bind_param("siss", $mods_str, $num_mods, $nombre, $usuario);

    if (!$stmt->execute()) {
        echo json_encode(["status" => "error", "msg" => "Error bbdd: " . $stmt->error]);
        exit;
    }
    $stmt->close();

    echo json_encode(["status" => "ok", "msg" => "Mods guardados correctamente"]);
    exit;
}

// ---------------------------------------------------------
// OBTENER MODS
// ---------------------------------------------------------
if ($accion === "obtenerMods") {
    $nombre  = $data["nombre"]  ?? "";
    $usuario = $data["usuario"] ?? "";

    if (!$nombre) {
        echo json_encode(["status" => "error", "msg" => "Nombre vacío"]);
        exit;
    }

    $stmt = $conn->prepare("
        SELECT s.nombre_mod, s.num_mods
        FROM servidores s
        INNER JOIN usuarios u ON s.id_usuarios = u.id_usuarios
        WHERE s.nombre_servidor = ? AND u.nombre = ?
    ");
    $stmt->bind_param("ss", $nombre, $usuario);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 0) {
        echo json_encode(["status" => "error", "msg" => "Servidor no encontrado"]);
        exit;
    }

    $row  = $result->fetch_assoc();
    $mods = $row['nombre_mod'] ? explode(",", $row['nombre_mod']) : [];
    $stmt->close();

    echo json_encode([
        "status"   => "ok",
        "mods"     => $mods,
        "num_mods" => $row['num_mods']
    ]);
    exit;
}

$conn->close();
?>