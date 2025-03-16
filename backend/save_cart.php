<?php
include 'db.php'; // Database connection file

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type");

$data = json_decode(file_get_contents("php://input"), true);
$user_id = $data["user_id"];
$cart = $data["cart"];

if (!$user_id || !$cart) {
    echo json_encode(["error" => "Invalid data"]);
    exit;
}

foreach ($cart as $item) {
    $product_id = $item["id"];
    $quantity = $item["quantity"];

    $stmt = $conn->prepare("INSERT INTO carts (user_id, product_id, quantity) 
                            VALUES (?, ?, ?) 
                            ON DUPLICATE KEY UPDATE quantity = ?");
    $stmt->bind_param("iiii", $user_id, $product_id, $quantity, $quantity);
    $stmt->execute();
}

echo json_encode(["message" => "Cart saved successfully"]);
?>
