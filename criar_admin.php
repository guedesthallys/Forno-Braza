<?php
// Execute este arquivo uma única vez pelo navegador e depois apague-o.
require_once 'conexao.php';
$email='fornoebraza@gmail.com';
$s=$pdo->prepare('SELECT id FROM usuarios WHERE email=?');$s->execute([$email]);
if(!$s->fetch()){$s=$pdo->prepare('INSERT INTO usuarios(nome,email,senha,endereco,is_admin) VALUES(?,?,?,?,1)');$s->execute(['Administrador',$email,password_hash('1234',PASSWORD_DEFAULT),'Pizzaria']);$mensagem='Administrador criado com sucesso.';}else{$mensagem='A conta de administrador já existe.';}
?>
<!DOCTYPE html>
<html lang="pt-BR">
    <meta charset="UTF-8">
    <title>Configuração</title>
    <body>
        <h2><?= htmlspecialchars($mensagem) ?></h2>
        <p>Login: fornoebraza@gmail.com | Senha: 1234</p>
        <p>Por segurança, apague criar_admin.php agora.</p>
        <a href="index.html">Ir para o site</a>
    </body>
    </html>
