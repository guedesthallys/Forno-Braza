// JavaScript simples: controla as telas e conversa com o PHP quando precisa salvar ou consultar dados.
const API = 'api.php?acao=';
let produtos = [];
let taxaAtual = 7;

async function chamarAPI(acao, dados = null) {
    const opcoes = dados === null ? {} : { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dados) };
    const resposta = await fetch(API + acao, opcoes);
    const resultado = await resposta.json();
    if (!resposta.ok || !resultado.ok) throw new Error(resultado.mensagem || 'Ocorreu um erro.');
    return resultado;
}
function mensagem(id, texto) { const campo = document.getElementById(id); if (campo) campo.textContent = texto; }
function dinheiro(valor) { return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }
function escapar(texto) { return String(texto ?? '').replace(/[&<>"']/g, letra => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[letra])); }

async function atualizarMenu() {
    try {
        const [menu, taxa] = await Promise.all([chamarAPI('menu'), chamarAPI('taxa')]);
        produtos = menu.itens; taxaAtual = Number(taxa.taxa);
        preencherSabores(); preencherBebidas();
    } catch (erro) { console.log(erro.message); }
}
async function atualizarUsuario() {
    try {
        const r = await chamarAPI('eu');
        const usuario = r.usuario;
        const linkAdmin = document.getElementById('linkAdmin');
        if (linkAdmin) linkAdmin.hidden = !(usuario && Number(usuario.is_admin) === 1);
        const linkConta = document.querySelector('a[href="login.html"]');
        if (linkConta && usuario) { linkConta.textContent = 'Minha Conta'; linkConta.href = 'conta.html'; }
        if (usuario && document.getElementById('contaNome')) {
            document.getElementById('contaNome').value = usuario.nome;
            document.getElementById('contaEmail').value = usuario.email;
            document.getElementById('contaEndereco').value = usuario.endereco;
        }
    } catch (erro) { console.log(erro.message); }
}

// Login e cadastro
const formLogin = document.getElementById('formLogin');
if (formLogin) formLogin.addEventListener('submit', async e => {
    e.preventDefault();
    try { await chamarAPI('login', { email: loginEmail.value, senha: loginSenha.value }); location.href = 'index.html'; }
    catch (erro) { mensagem('loginMsg', erro.message); }
});
const formCadastro = document.getElementById('formCadastro');
if (formCadastro) formCadastro.addEventListener('submit', async e => {
    e.preventDefault();
    try { await chamarAPI('cadastro', { nome: cadNome.value, email: cadEmail.value, senha: cadSenha.value, endereco: cadEndereco.value }); location.href = 'conta.html'; }
    catch (erro) { mensagem('cadMsg', erro.message); }
});

// Montagem do pedido
function preencherSabores() {
    const pizzas = produtos.filter(p => p.categoria === 'Pizza');
    ['sabor1','sabor2'].forEach(id => { const campo = document.getElementById(id); if (!campo) return; const primeira = id === 'sabor2' ? '<option value="">Não quero</option>' : '<option value="">Escolha um sabor</option>'; campo.innerHTML = primeira + pizzas.map(p => `<option value="${p.id}">${escapar(p.nome)} — ${dinheiro(p.preco)}</option>`).join(''); });
}
function preencherBebidas() {
    const area = document.getElementById('listaBebidas'); if (!area) return;
    area.innerHTML = produtos.filter(p => p.categoria === 'Bebida').map(p => `<div class="prato-card"><div class="prato-texto"><h3>${escapar(p.nome)}</h3><p>${escapar(p.descricao)}</p><strong>${dinheiro(p.preco)}</strong><div class="campo"><label>Quantidade</label><input type="number" min="0" value="0" id="bebida-${p.id}"></div></div></div>`).join('');
}
const tipoEntrega = document.getElementById('tipoEntrega');
function mostrarTaxa() { const area = document.getElementById('resumoTaxa'); if (area) area.textContent = `Taxa de entrega: ${tipoEntrega.value === 'Entrega' ? dinheiro(taxaAtual) : 'Grátis'}`; }
if (tipoEntrega) tipoEntrega.addEventListener('change', mostrarTaxa);
const confirmar = document.getElementById('confirmarPedido');
if (confirmar) confirmar.addEventListener('click', async () => {
    try {
        const saborUm = document.getElementById('sabor1').value, saborDois = document.getElementById('sabor2').value;
        if (!saborUm) throw new Error('Escolha pelo menos um sabor de pizza.');
        const itens = [{ item_id: Number(saborUm), quantidade: 1, observacao: `Pizza de ${fatias.value} fatias. ${observacao.value}` }];
        if (saborDois) { if (saborDois === saborUm) throw new Error('Escolha sabores diferentes.'); itens.push({ item_id: Number(saborDois), quantidade: 1, observacao: `Segundo sabor da pizza de ${fatias.value} fatias. ${observacao.value}` }); }
        produtos.filter(p => p.categoria === 'Bebida').forEach(p => { const qtd = Number(document.getElementById('bebida-' + p.id)?.value || 0); if (qtd > 0) itens.push({ item_id: Number(p.id), quantidade: qtd, observacao: '' }); });
        const r = await chamarAPI('criar-pedido', { itens, pizza_dois_sabores: Boolean(saborDois), tipo_entrega: tipoEntrega.value, forma_pagamento: pagamento.value });
        mensagem('pedidoMsg', `Pedido #${r.pedido_id} confirmado! Total: ${dinheiro(r.total)}. Você pode acompanhar em Meus Pedidos.`);
        setTimeout(() => location.href = 'meus-pedidos.html', 1600);
    } catch (erro) { mensagem('pedidoMsg', erro.message); if (erro.message.includes('login')) setTimeout(() => location.href='login.html',1200); }
});

// Consulta e acompanhamento de pedidos
function blocoPedido(p, admin = false) {
    const itens = p.itens.map(i => `<li>${i.quantidade}x ${escapar(i.nome)} ${i.observacao ? '— ' + escapar(i.observacao) : ''}</li>`).join('');
    return `<article class="pedido-caixa"><h3>Pedido #${p.id} — ${escapar(p.status)}</h3>${admin ? `<p>Cliente: ${escapar(p.cliente)}</p>` : ''}<p>${escapar(p.tipo_entrega)} | Pagamento: ${escapar(p.forma_pagamento)}</p><ul>${itens}</ul><p>Taxa: ${dinheiro(p.taxa_entrega)} | Total: <strong>${dinheiro(p.valor_total)}</strong></p>${p.motivo_cancelamento ? `<p class="aviso-cancelado">Motivo: ${escapar(p.motivo_cancelamento)}</p>` : ''}${admin ? `<div class="linha-campos"><select id="status-${p.id}"><option>Pedido Recebido</option><option>Em Preparo</option><option>Pronto</option><option>Saiu para Entrega</option><option>Finalizado</option><option>Cancelado</option></select><input id="motivo-${p.id}" placeholder="Motivo se cancelar"><button onclick="alterarPedido(${p.id})">Atualizar status</button></div>` : ''}</article>`;
}
async function carregarPedidos(admin = false) {
    const area = document.getElementById(admin ? 'listaTodosPedidos' : 'listaMeusPedidos'); if (!area) return;
    try { const r = await chamarAPI(admin ? 'todos-pedidos' : 'meus-pedidos'); area.innerHTML = r.pedidos.length ? r.pedidos.map(p => blocoPedido(p, admin)).join('') : '<p>Nenhum pedido encontrado.</p>'; }
    catch (erro) { area.innerHTML = `<p>${escapar(erro.message)} <a href="login.html">Entrar</a></p>`; }
}
async function alterarPedido(id) { try { const status = document.getElementById('status-' + id).value; await chamarAPI('atualizar-status', { id, status, motivo: document.getElementById('motivo-' + id).value }); carregarPedidos(true); } catch (erro) { alert(erro.message); } }

// Minha conta
const formConta = document.getElementById('formConta');
if (formConta) formConta.addEventListener('submit', async e => { e.preventDefault(); try { await chamarAPI('editar-conta', { nome: contaNome.value, email: contaEmail.value, endereco: contaEndereco.value }); mensagem('contaMsg','Dados atualizados.'); } catch (erro) { mensagem('contaMsg',erro.message); } });
const excluir = document.getElementById('excluirConta');
if (excluir) excluir.addEventListener('click', async () => { if (!confirm('Tem certeza que deseja excluir sua conta?')) return; try { await chamarAPI('excluir-conta',{}); location.href='index.html'; } catch (erro) { mensagem('contaMsg',erro.message); } });
const sair = document.getElementById('sairConta');
if (sair) sair.addEventListener('click', async () => { await chamarAPI('sair',{}); location.href='index.html'; });

// Painel do administrador: produtos, taxa e novos administradores.
async function carregarProdutosAdmin() {
    const area = document.getElementById('listaProdutosAdmin'); if (!area) return;
    try { const r = await chamarAPI('menu'); area.innerHTML = '<h3>Produtos cadastrados</h3>' + r.itens.map(p => `<p>${escapar(p.nome)} — ${dinheiro(p.preco)} <button onclick="editarProduto(${p.id})">Editar</button> <button onclick="removerProduto(${p.id})">Excluir</button></p>`).join(''); produtos = r.itens; }
    catch (erro) { area.textContent = erro.message; }
}
async function editarProduto(id) { const p = produtos.find(x => Number(x.id) === Number(id)); if (!p) { await carregarProdutosAdmin(); return editarProduto(id); } produtoId.value=p.id; produtoNome.value=p.nome; produtoDescricao.value=p.descricao; produtoCategoria.value=p.categoria; produtoPreco.value=p.preco; document.getElementById('formProduto').scrollIntoView({behavior:'smooth'}); }
async function removerProduto(id) { if (!confirm('Excluir este produto do cardápio?')) return; try { await chamarAPI('excluir-produto',{id}); await carregarProdutosAdmin(); } catch(erro) { alert(erro.message); } }
const formProduto = document.getElementById('formProduto');
if (formProduto) formProduto.addEventListener('submit', async e => { e.preventDefault(); try { await chamarAPI('salvar-produto',{id:produtoId.value,nome:produtoNome.value,descricao:produtoDescricao.value,categoria:produtoCategoria.value,preco:produtoPreco.value}); mensagem('produtoMsg','Produto salvo com sucesso.'); formProduto.reset(); produtoId.value=''; await carregarProdutosAdmin(); } catch(erro) { mensagem('produtoMsg',erro.message); } });
const limparProduto = document.getElementById('limparProduto'); if(limparProduto) limparProduto.addEventListener('click',()=>{formProduto.reset();produtoId.value='';});
const formTaxa = document.getElementById('formTaxa');
if (formTaxa) { chamarAPI('taxa').then(r=>document.getElementById('taxaEntrega').value=r.taxa).catch(()=>{}); formTaxa.addEventListener('submit',async e=>{e.preventDefault();try{await chamarAPI('salvar-taxa',{taxa:document.getElementById('taxaEntrega').value});mensagem('taxaMsg','Taxa atualizada.');}catch(erro){mensagem('taxaMsg',erro.message);}}); }
const formAdmin = document.getElementById('formAdmin');
if(formAdmin) formAdmin.addEventListener('submit',async e=>{e.preventDefault();try{await chamarAPI('novo-admin',{nome:adminNome.value,email:adminEmail.value,senha:adminSenha.value});mensagem('adminMsg','Administrador cadastrado.');formAdmin.reset();}catch(erro){mensagem('adminMsg',erro.message);}});

// Inicialização de cada página.
(async function iniciar(){ await atualizarUsuario(); await atualizarMenu(); mostrarTaxa(); carregarPedidos(false); carregarPedidos(true); carregarProdutosAdmin(); })();
