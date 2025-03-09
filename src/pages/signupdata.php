<?php
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require 'vendor/autoload.php';

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    if (isset($_POST['firstname']) && isset($_POST['lastname']) && isset($_POST['country']) && isset($_POST['countrycode']) && isset($_POST['mobile']) && isset($_POST['email'])) {
        $firstname = htmlspecialchars($_POST['firstname']);
        $lastname = htmlspecialchars($_POST['lastname']);
        $country = htmlspecialchars($_POST['country']);
        $countrycode = htmlspecialchars($_POST['countrycode']);
        $mobile = htmlspecialchars($_POST['mobile']);
        $email = htmlspecialchars($_POST['email']);

        $full_mobile_number = $countrycode . $mobile;

        // Database connection
        $conn = new mysqli('localhost', 'u677681161_fazakir', 'HzOD5qqv5R=', 'u677681161_signup');

        // Check connection
        if ($conn->connect_error) {
            die("Connection failed: " . $conn->connect_error);
        }

        // Insert data into requests table
        $stmt = $conn->prepare("INSERT INTO signupdata (firstname, lastname, country, mobile, email) VALUES (?, ?, ?, ?, ?)");
        $stmt->bind_param("sssss", $firstname, $lastname, $country, $full_mobile_number, $email);

        if ($stmt->execute()) {
            echo "Data stored successfully.<br>";
        } else {
            echo "Error: " . $stmt->error;
        }

        $mail = new PHPMailer(true);

        try {
            // Server settings
            $mail->SMTPDebug = 0;                                 // Disable verbose debug output
            $mail->isSMTP();                                      // Set mailer to use SMTP
            $mail->Host       = 'smtp.hostinger.com';                      // Specify main and backup SMTP servers
            $mail->SMTPAuth   = true;                             // Enable SMTP authentication
            $mail->Username   = 'requests@saracr8.com';         // SMTP username
            $mail->Password   = 'Sararequest@1';                  // SMTP password
            $mail->SMTPSecure = 'tls';                            // Enable TLS encryption, `ssl` also accepted
            $mail->Port       = 587;                              // TCP port to connect to

            // Recipients
            $mail->setFrom('requests@saracr8.com', 'Sara Cr8');     // Sender's email
            $mail->addAddress('$email');           // Add a recipient (replace with your email)
            
            // Content
            $mail->isHTML(true);                                  // Set email format to HTML
            $mail->Subject = "مرحبا بك فى فذكر - كانفاس ينبض بالإيمان";
            $mail->Body    = "
                <!DOCTYPE html>
                <html>
                    <head>
                        <style>
                            body {
                                text-align: center;
                                color: black;
                                font-size: 20px;
                            }
                            h1 {
                                color: #2133e5;
                                font-size: 2.5rem;
                            }
                            div {
                                border-color: #2133e5;
                                border-style: dotted;
                                padding-left: 5vw;
                                padding-top: 2vw;
                            }
                            p {
                                font-size: 1.5rem;
                                text-align: left;
                            }
                            strong {
                                color: #e52174;
                                text-decoration: underline;
                                margin-right: 1vw;
                            }
                            footer {
                                padding-top: 2vw;
                            }
                        </style>
                    </head>
                    <body>
                        <header>
                            <h1>New Request From $name</h1>
                        </header>
                        <div>
                            <p><strong>Name:</strong> $name</p>
                            <p><strong>E-mail:</strong> $email</p>
                            <p><strong>Country:</strong> $country</p>
                            <p><strong>Mobile Number:</strong> $full_mobile_number</p>
                            <p><strong>Request:</strong> $message</p>
                            <p><strong>Budget:</strong> $budget</p>
                            <p><strong>Per:</strong> $per</p>
                            <p><strong>Promo Code:</strong> $promocode</p>
                            <p><strong>Promocode Status:</strong> $emailStatusMessage</p>
                        </div>
                        <footer>Sara Cr8 - 2025 - www.saracr8.com</footer>
                    </body>
                </html>";

            $mail->send();
            echo 'Email has been sent.';
        } catch (Exception $e) {
            echo "Message could not be sent. Mailer Error: {$mail->ErrorInfo}";
        }

        $stmt->close();
        $conn->close();
    }
    }
    ?>