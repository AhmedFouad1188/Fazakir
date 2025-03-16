<?php
$conn = new mysqli("localhost", "root", "123456", "shopdb");

if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}
?>
