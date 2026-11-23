CREATE DATABASE IF NOT EXISTS forno_ebraza;
USE forno_ebraza;

-- 1. Clientes e administradores
CREATE TABLE IF NOT EXISTS usuarios (
 id INT AUTO_INCREMENT PRIMARY KEY,
 nome VARCHAR(100) NOT NULL,
 email VARCHAR(150) NOT NULL UNIQUE,
 senha VARCHAR(255) NOT NULL,
 endereco VARCHAR(255) NOT NULL,
 is_admin TINYINT(1) NOT NULL DEFAULT 0
);

-- 2. Pizzas e bebidas
CREATE TABLE IF NOT EXISTS cardapio (
 id INT AUTO_INCREMENT PRIMARY KEY,
 nome VARCHAR(100) NOT NULL,
 descricao TEXT,
 categoria VARCHAR(20) NOT NULL,
 preco DECIMAL(10,2) NOT NULL,
 ativo TINYINT(1) NOT NULL DEFAULT 1
);

-- 3. Pedidos realizados
CREATE TABLE IF NOT EXISTS pedidos (
 id INT AUTO_INCREMENT PRIMARY KEY,
 usuario_id INT NOT NULL,
 status VARCHAR(40) NOT NULL DEFAULT 'Pedido Recebido',
 tipo_entrega VARCHAR(20) NOT NULL,
 taxa_entrega DECIMAL(10,2) NOT NULL DEFAULT 0,
 valor_total DECIMAL(10,2) NOT NULL,
 forma_pagamento VARCHAR(20) NOT NULL,
 motivo_cancelamento TEXT,
 FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- 4. Produtos que pertencem a cada pedido
CREATE TABLE IF NOT EXISTS itens_pedido (
 id INT AUTO_INCREMENT PRIMARY KEY,
 pedido_id INT NOT NULL,
 item_id INT NOT NULL,
 quantidade INT NOT NULL DEFAULT 1,
 observacao TEXT,
 FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE,
 FOREIGN KEY (item_id) REFERENCES cardapio(id)
);

-- Produtos iniciais (só serão incluídos se o cardápio estiver vazio)
INSERT INTO cardapio (nome,descricao,categoria,preco)
SELECT * FROM (SELECT 'Calabresa','Molho de tomate, muçarela, calabresa e cebola.','Pizza',42.00 UNION ALL
SELECT 'Quatro Queijos','Muçarela, provolone, parmesão e gorgonzola.','Pizza',48.00 UNION ALL
SELECT 'Marguerita','Muçarela, tomate e manjericão.','Pizza',44.00 UNION ALL
SELECT 'Portuguesa','Presunto, ovo, cebola, ervilha e muçarela.','Pizza',46.00 UNION ALL
SELECT 'Frango com Catupiry','Frango desfiado e requeijão cremoso.','Pizza',47.00 UNION ALL
SELECT 'Brigadeiro','Chocolate e granulado.','Pizza',45.00 UNION ALL
SELECT 'Refrigerante lata','Lata 350 ml.','Bebida',6.00 UNION ALL
SELECT 'Suco natural','Suco de fruta 300 ml.','Bebida',8.00 UNION ALL
SELECT 'Água mineral','Garrafa 500 ml.','Bebida',4.00) AS produtos
WHERE NOT EXISTS (SELECT 1 FROM cardapio);
