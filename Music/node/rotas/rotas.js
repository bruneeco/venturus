import fs from 'fs';

export default function rotas(req, res) {
    res.setHeader('Content-Type', 'application/json');

    // Rota POST para criação de usuário
    if (req.method === 'POST' && req.url === '/usuarios') {
        const corpo = [];

        req.on('data', (parte) => {
            corpo.push(parte);
        });

        req.on('end', () => {
            try {
                const usuario = JSON.parse(Buffer.concat(corpo).toString());
                const { nome, email, senha, nascimento, nick } = usuario;

                // Verificação de campos obrigatórios
                if (!nome || !email || !senha || !nascimento || !nick) {
                    res.statusCode = 400;
                    res.end(JSON.stringify({ erro: "Todos os campos são obrigatórios" }));
                    return;
                }

                // Verificação da idade mínima de 16 anos
                const idade = calcularIdade(nascimento);
                if (idade < 16) {
                    res.statusCode = 400;
                    res.end(JSON.stringify({ erro: "A idade deve ser maior que 16 anos" }));
                    return;
                }

                // Carregar e verificar se o email ou nick já estão em uso
                const usuarios = carregarUsuarios();
                if (usuarios.some(u => u.email === email)) {
                    res.statusCode = 400;
                    res.end(JSON.stringify({ erro: "Email já está em uso" }));
                    return;
                }
                if (usuarios.some(u => u.nick === nick)) {
                    res.statusCode = 400;
                    res.end(JSON.stringify({ erro: "Nick já está em uso" }));
                    return;
                }

                // Criação do novo usuário
                const novoUsuario = {
                    id: gerarIdUnico(),
                    nome,
                    email,
                    nick,
                    imagem: "https://example.com/imagem-padrao.jpg",
                    nascimento
                };

                usuarios.push(novoUsuario);
                salvarUsuarios(usuarios);

                // Retorno de sucesso
                res.statusCode = 201;
                res.end(JSON.stringify(novoUsuario));
            } catch (erro) {
                console.error('Erro ao processar a requisição', erro);
                res.statusCode = 500;
                res.end(JSON.stringify({ erro: "Erro ao criar usuário" }));
            }
        });

        return;
    }

    // Rota 404 para quando nenhuma das rotas é atendida
    res.statusCode = 404;
    res.end(JSON.stringify({
        erro: {
            mensagem: 'Rota não encontrada',
            url: req.url
        }
    }));
}

// Função auxiliar para calcular a idade com base na data de nascimento
function calcularIdade(dataNascimento) {
    const nascimento = new Date(dataNascimento);
    const hoje = new Date();
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const mes = hoje.getMonth() - nascimento.getMonth();

    if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
        idade--;
    }

    return idade;
}

// Função para gerar IDs únicos
function gerarIdUnico() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Função para carregar usuários do arquivo (simula um banco de dados)
function carregarUsuarios() {
    try {
        return JSON.parse(fs.readFileSync('usuarios.json', 'utf-8') || '[]');
    } catch (erro) {
        console.error('Erro ao carregar usuários:', erro);
        return [];
    }
}

// Função para salvar usuários no arquivo (simula um banco de dados)
function salvarUsuarios(usuarios) {
    fs.writeFileSync('usuarios.json', JSON.stringify(usuarios, null, 2), 'utf-8');
}
