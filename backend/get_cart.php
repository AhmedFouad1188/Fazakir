<?php
include 'db.php';

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET");
header("Access-Control-Allow-Headers: Content-Type");

$user_id = $_GET["user_id"];
if (!$user_id) {
    echo json_encode(["error" => "User ID is required"]);
    exit;
}

$sql = "SELECT products.id, products.name, products.price, products.image_url, carts.quantity 
        FROM carts
        JOIN products ON carts.product_id = products.id
        WHERE carts.user_id = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $user_id);
$stmt->execute();
$result = $stmt->get_result();
$cart = $result->fetch_all(MYSQLI_ASSOC);

echo json_encode($cart);
?>
