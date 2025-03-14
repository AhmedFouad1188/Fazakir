<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header("HTTP/1.1 200 OK");
    exit();
}

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require 'vendor/autoload.php';

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    // ✅ Read the JSON input from the request
    $json = file_get_contents("php://input");
    $data = json_decode($json, true); // Convert JSON string to PHP array

    if (!$data) {
        echo json_encode(["error" => "Invalid JSON data"]);
        exit();
    }

    // ✅ Validate that required fields exist
    if (
        isset($data['firstname'], $data['lastname'], $data['country'], 
              $data['countrycode'], $data['mobile'], $data['email'])
    ) {
        $firstname = htmlspecialchars($data['firstname']);
        $lastname = htmlspecialchars($data['lastname']);
        $country = htmlspecialchars($data['country']);
        $countrycode = htmlspecialchars($data['countrycode']);
        $mobile = htmlspecialchars($data['mobile']);
        $email = htmlspecialchars($data['email']);

        $full_mobile_number = $countrycode . $mobile;

        // ✅ Database connection
        $conn = new mysqli('localhost', 'root', '', 'fazakir');

        if ($conn->connect_error) {
            echo json_encode(["error" => "Database connection failed: " . $conn->connect_error]);
            exit();
        }

        // ✅ Insert data into the database
        $stmt = $conn->prepare("INSERT INTO data (firstname, lastname, country, mobile, email) VALUES (?, ?, ?, ?, ?)");

        if (!$stmt) {
            echo json_encode(["error" => "Prepare failed: " . $conn->error]);
            exit();
        }

        $stmt->bind_param("sssss", $firstname, $lastname, $country, $full_mobile_number, $email);

        if ($stmt->execute()) {
            echo json_encode(["message" => "Data stored successfully"]);
        } else {
            echo json_encode(["error" => "Error inserting data: " . $stmt->error]);
        }

        $stmt->close();
        $conn->close();

        // ✅ Send confirmation email
        $mail = new PHPMailer(true);
        try {
            $mail->isSMTP();
            $mail->Host = 'smtp.hostinger.com';
            $mail->SMTPAuth = true;
            $mail->Username = 'requests@saracr8.com';
            $mail->Password = 'Sararequest@1';
            $mail->SMTPSecure = 'tls';
            $mail->Port = 587;

            $mail->setFrom('requests@saracr8.com', 'Sara Cr8');
            $mail->addAddress($email);

            // ✅ Fix Arabic Encoding
            $mail->CharSet = "UTF-8";  // Ensure UTF-8 encoding
            $mail->Encoding = "base64"; // Helps with proper rendering in email clients

            $mail->isHTML(true);
            $mail->Subject = "مرحبا بك فى فذكر - كانفاس ينبض بالإيمان";
            $mail->Body = "
                <html>
                    <body>
                        <header><h1>مرحبا بك فى فذكر - كانفاس ينبض بالإيمان</h1></header>
                        <p>اهلا $firstname $lastname</p>
                        <p>لقد تم إنشاء حسابك بنجاح</p>
                        <footer>Fazakir.com - 2025</footer>
                    </body>
                </html>";

            $mail->send();
            echo json_encode(["message" => "Email has been sent"]);
        } catch (Exception $e) {
            echo json_encode(["error" => "Email Error: " . $mail->ErrorInfo]);
        }
    } else {
        echo json_encode(["error" => "Missing required fields"]);
    }
} else {
    echo json_encode(["error" => "Invalid request method"]);
}
?>
