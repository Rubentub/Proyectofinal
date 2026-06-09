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
