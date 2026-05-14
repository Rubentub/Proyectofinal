<?php
$host = "192.168.15.123";
$usuario = "gsuser";
$contraseña = "1234Gs@";
$base_datos = "gsbase";

$conn = new mysqli($host, $usuario, $contraseña, $base_datos);

if ($conn->connect_error) {
    die(json_encode(["status" => "error", "msg" => "Error de conexión: " . $conn->connect_error]));
}
?>