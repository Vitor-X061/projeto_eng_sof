document.addEventListener('DOMContentLoaded', () => {

    /* =========================================
       1. VARIÁVEIS DE SESSÃO E NAVEGAÇÃO
       ========================================= */
    const telas = document.querySelectorAll('.tela');
    
    // Variáveis para controlar quem está logado e onde
    let perfilAtual = ""; // Vai guardar se é 'professor' ou 'aluno'
    let grupoAtualId = null;
    let usuarioAtualNome = "";

    function mudarTela(idTelaDestino) {
        telas.forEach(tela => tela.classList.remove('ativa'));
        document.getElementById(idTelaDestino).classList.add('ativa');

        if (idTelaDestino === 'tela-professor') renderizarProfessor();
        if (idTelaDestino === 'tela-aluno') renderizarAluno();
    }

    // Cliques de Login
    document.getElementById('btn-login-prof').addEventListener('click', () => {
        perfilAtual = "professor";
        usuarioAtualNome = "Professor(a)"; // Nome automático no chat
        mudarTela('tela-professor');
    });

    document.getElementById('btn-login-aluno').addEventListener('click', () => {
        perfilAtual = "aluno";
        mudarTela('tela-aluno');
    });

    // Cliques de Sair
    document.getElementById('btn-sair-prof').addEventListener('click', () => mudarTela('tela-login'));
    document.getElementById('btn-sair-aluno').addEventListener('click', () => mudarTela('tela-login'));
    
    // Clique de Voltar da tela do Chat (agora é inteligente)
    document.getElementById('btn-voltar-painel-aluno').addEventListener('click', () => {
        // Se for professor, volta pro painel dele. Se for aluno, volta pro do aluno.
        if (perfilAtual === "professor") {
            mudarTela('tela-professor');
        } else {
            mudarTela('tela-aluno');
        }
    });

    // Ação do botão de Resetar Dados
    document.getElementById('btn-resetar-dados').addEventListener('click', () => {
        // Pede uma confirmação para você não clicar sem querer e perder tudo
        const confirmacao = confirm("Tem certeza que deseja apagar todos os grupos e mensagens? Isso não pode ser desfeito.");
        
        if (confirmacao) {
            // Remove o banco de dados específico do nosso protótipo
            localStorage.removeItem('bancoDeGruposAcademico');
            alert("Sistema resetado com sucesso!");
            // Recarrega a página para limpar a tela
            window.location.reload();
        }
    });

    /* =========================================
       2. BANCO DE DADOS (LOCALSTORAGE)
       ========================================= */
    function obterGrupos() {
        const dados = localStorage.getItem('bancoDeGruposAcademico');
        return dados ? JSON.parse(dados) : [];
    }

    function salvarGrupos(grupos) {
        localStorage.setItem('bancoDeGruposAcademico', JSON.stringify(grupos));
    }

    /* =========================================
       3. LÓGICA DO PROFESSOR
       ========================================= */
    document.getElementById('btn-criar-grupo').addEventListener('click', () => {
        const inputTema = document.getElementById('nome-tema');
        const temaTrabalho = inputTema.value.trim();

        if (temaTrabalho === "") {
            alert("Por favor, digite o tema do trabalho.");
            return;
        }

        const grupos = obterGrupos();
        
        const novoGrupo = {
            id: Date.now(),
            tema: temaTrabalho,
            alunos: [],
            mensagens: [] 
        };

        grupos.push(novoGrupo);
        salvarGrupos(grupos);
        
        inputTema.value = "";
        renderizarProfessor();
    });

    function renderizarProfessor() {
        const divGrupos = document.getElementById('lista-grupos-professor');
        const grupos = obterGrupos();
        divGrupos.innerHTML = ""; 

        if (grupos.length === 0) {
            divGrupos.innerHTML = "<p>Nenhum grupo criado ainda.</p>";
            return;
        }

        grupos.forEach(grupo => {
            let listaAlunosHTML = grupo.alunos.length > 0 
                ? grupo.alunos.map(aluno => `<li>${aluno}</li>`).join('') 
                : "<li>Nenhum aluno entrou ainda.</li>";

            divGrupos.innerHTML += `
                <div style="background: #f8f9fa; border: 1px solid #ddd; padding: 15px; margin-bottom: 10px; border-radius: 6px;">
                    <h4 style="color: #1a73e8; margin-bottom: 10px; margin-top: 0;">Tema: ${grupo.tema}</h4>
                    <p style="margin-bottom: 5px; font-size: 14px; text-align: left;"><strong>Alunos no grupo:</strong></p>
                    <ul style="padding-left: 20px; font-size: 14px; text-align: left; margin-bottom: 15px;">
                        ${listaAlunosHTML}
                    </ul>
                    <button class="btn-acessar-prof" data-id="${grupo.id}" style="margin: 0; padding: 8px; background-color: #28a745;">Acessar Chat do Grupo</button>
                </div>
            `;
        });

        // Evento para o professor entrar no chat
        document.querySelectorAll('.btn-acessar-prof').forEach(botao => {
            botao.addEventListener('click', (evento) => {
                const idDoGrupo = parseInt(evento.target.getAttribute('data-id'));
                grupoAtualId = idDoGrupo;
                mudarTela('tela-grupo-interna');
                renderizarChat();
            });
        });
    }

    /* =========================================
       4. LÓGICA DO ALUNO (Escolher Grupo)
       ========================================= */
    function renderizarAluno() {
        const divGrupos = document.getElementById('lista-grupos-aluno');
        const grupos = obterGrupos();
        divGrupos.innerHTML = "";

        if (grupos.length === 0) {
            divGrupos.innerHTML = "<p>O professor ainda não criou nenhum grupo.</p>";
            return;
        }

        grupos.forEach(grupo => {
            divGrupos.innerHTML += `
                <div style="background: #f8f9fa; border: 1px solid #ddd; padding: 15px; margin-bottom: 10px; border-radius: 6px; text-align: center;">
                    <h4 style="margin-top: 0; margin-bottom: 10px; color: #333;">${grupo.tema}</h4>
                    <p style="font-size: 13px; color: #666; margin-bottom: 10px;">${grupo.alunos.length} aluno(s) participando</p>
                    <button class="btn-entrar" data-id="${grupo.id}" style="margin: 0; padding: 8px;">Entrar neste Grupo</button>
                </div>
            `;
        });

        document.querySelectorAll('.btn-entrar').forEach(botao => {
            botao.addEventListener('click', (evento) => {
                const idDoGrupo = parseInt(evento.target.getAttribute('data-id'));
                entrarNoGrupo(idDoGrupo);
            });
        });
    }

    function entrarNoGrupo(idGrupo) {
        const inputNome = document.getElementById('nome-aluno');
        const nomeDoAluno = inputNome.value.trim();

        if (nomeDoAluno === "") {
            alert("Tem de digitar o seu nome antes de entrar num grupo!");
            return;
        }

        let grupos = obterGrupos();

        grupos = grupos.map(grupo => {
            if (grupo.id === idGrupo) {
                if (!grupo.alunos.includes(nomeDoAluno)) {
                    grupo.alunos.push(nomeDoAluno);
                }
            }
            return grupo;
        });

        salvarGrupos(grupos);
        
        usuarioAtualNome = nomeDoAluno;
        grupoAtualId = idGrupo;
        
        mudarTela('tela-grupo-interna');
        renderizarChat(); 
    }

    /* =========================================
       5. LÓGICA DO CHAT (Área Interna)
       ========================================= */
    function renderizarChat() {
        const grupos = obterGrupos();
        const grupo = grupos.find(g => g.id === grupoAtualId);
        
        document.getElementById('titulo-grupo-interno').innerText = "Grupo: " + grupo.tema;
        
        const chatContainer = document.getElementById('chat-container');
        chatContainer.innerHTML = ""; 

        if (!grupo.mensagens || grupo.mensagens.length === 0) {
            chatContainer.innerHTML = "<p style='text-align:center; color:#999; font-size: 14px; margin-top: 50px;'>Nenhuma mensagem ainda.</p>";
        } else {
            grupo.mensagens.forEach(msg => {
                const isMinhaMensagem = (msg.autor === usuarioAtualNome);
                const isProfessor = (msg.autor === "Professor(a)"); // Identifica se a mensagem é do professor

                const alinhamento = isMinhaMensagem ? "align-self: flex-end;" : "align-self: flex-start;";
                
                // Cores diferentes: Verde para mim, Azul clarinho para o professor, Branco para outros alunos
                let corFundo = "#ffffff";
                if (isMinhaMensagem) corFundo = "#dcf8c6"; // Minha mensagem
                else if (isProfessor) corFundo = "#cce5ff"; // Mensagem do professor para os alunos
                
                // Coloca uma tag 👨‍🏫 se for o professor
                const iconeAutor = isProfessor ? "👨‍🏫 " : "";

                chatContainer.innerHTML += `
                    <div style="${alinhamento} background-color: ${corFundo}; padding: 8px 12px; border-radius: 8px; border: 1px solid #ddd; max-width: 80%; text-align: left;">
                        <strong style="font-size: 11px; color: ${isProfessor ? '#004085' : '#666'}; display: block; margin-bottom: 2px;">
                            ${iconeAutor}${msg.autor}
                        </strong>
                        <span style="font-size: 14px; color: #333;">${msg.texto}</span>
                    </div>
                `;
            });
        }
        
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    document.getElementById('btn-enviar-mensagem').addEventListener('click', () => {
        const inputMsg = document.getElementById('input-mensagem');
        const textoDaMensagem = inputMsg.value.trim();

        if (textoDaMensagem === "") return;

        let grupos = obterGrupos();
        const index = grupos.findIndex(g => g.id === grupoAtualId);

        if (!grupos[index].mensagens) {
            grupos[index].mensagens = [];
        }

        grupos[index].mensagens.push({
            autor: usuarioAtualNome,
            texto: textoDaMensagem
        });

        salvarGrupos(grupos); 
        inputMsg.value = ""; 
        renderizarChat(); 
    });
});