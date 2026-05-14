<?php
error_reporting(E_ALL);
ini_set('display_errors', 0);
header("Content-Type: application/json");

include("conexion.php");

// Recibir datos JSON desde fetch()
$data = json_decode(file_get_contents("php://input"), true);

if (!$data) {
    echo json_encode(["status" => "error", "msg" => "No se recibieron datos"]);
    exit;
}

$nombre = $data["user"] ?? "";
$correo = $data["email"] ?? "";
$pass   = $data["pass"] ?? "";

// VALIDACIONES BÁSICAS
if (strlen($nombre) < 3 || strlen($pass) < 6 || !filter_var($correo, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(["status" => "error", "msg" => "Datos inválidos"]);
    exit;
}

// OJO: la columna REAL es `contraseña` con Ñ
$sql = "INSERT INTO usuarios (nombre, correo, `contraseña`)
        VALUES (?, ?, ?)";

$stmt = $conn->prepare($sql);
$stmt->bind_param("sss", $nombre, $correo, $pass);

if ($stmt->execute()) {
    echo json_encode(["status" => "ok"]);
} else {
    echo json_encode(["status" => "error", "msg" => $stmt->error]);
}

$stmt->close();
$conn->close();
?>