<?php
header("Content-Type: application/json");

include("conexion.php");

$data = json_decode(file_get_contents("php://input"), true);

if (!$data) {
    echo json_encode([
        "status" => "error",
        "msg" => "No se recibieron datos"
    ]);
    exit;
}

$correo = $data["email"] ?? "";
$pass   = $data["pass"] ?? "";

$sql = "SELECT * FROM usuarios WHERE correo = ? OR nombre = ?";

$stmt = $conn->prepare($sql);
$stmt->bind_param("ss", $correo, $correo);
$stmt->execute();

$result = $stmt->get_result();

if ($result->num_rows === 1) {

    $user = $result->fetch_assoc();

    if (password_verify($pass, $user['contraseña'])) {

        echo json_encode([
            "status" => "ok",
            "user" => $user['nombre']
        ]);

    } else {

        echo json_encode([
            "status" => "error",
            "msg" => "Contraseña incorrecta"
        ]);

    }

} else {

    echo json_encode([
        "status" => "error",
        "msg" => "Usuario no encontrado"
    ]);

}

$stmt->close();
$conn->close();
?>
