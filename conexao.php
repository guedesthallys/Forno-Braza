<?php
$host = 'localhost'; $banco = 'forno_ebraza'; $usuario = 'root'; $senha = '';
try {
    $pdo = new PDO("mysql:host=$host;dbname=$banco;charset=utf8mb4", $usuario, $senha);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch (PDOException $erro) {
    http_response_code(500); die('Erro ao conectar ao banco. Importe banco.sql e confira conexao.php.');
}
if (session_status() === PHP_SESSION_NONE) session_start();
