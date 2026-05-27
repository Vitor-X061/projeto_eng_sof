document.addEventListener('DOMContentLoaded', () => {

    /* =========================================
       1. VARIÁVEIS DE SESSÃO E NAVEGAÇÃO
       ========================================= */
    const telas = document.querySelectorAll('.tela');

    let perfilAtual = "";
    let grupoAtualId = null;
    let usuarioAtualNome = "";

    function mudarTela(idTelaDestino) {
        telas.forEach(tela => tela.classList.remove('ativa'));
        document.getElementById(idTelaDestino).classList.add('ativa');

        if (idTelaDestino === 'tela-professor') renderizarProfessor();
        if (idTelaDestino === 'tela-aluno') renderizarAluno();
        if (idTelaDestino === 'tela-login') document.title = "HubClass";
    }

    document.getElementById('btn-login-prof').addEventListener('click', () => {
        perfilAtual = "professor";
        usuarioAtualNome = "Professor(a)";
        mudarTela('tela-professor');
    });

    document.getElementById('btn-login-aluno').addEventListener('click', () => {
        perfilAtual = "aluno";
        mudarTela('tela-aluno');
    });

    document.getElementById('btn-sair-prof').addEventListener('click', () => mudarTela('tela-login'));
    document.getElementById('btn-sair-aluno').addEventListener('click', () => mudarTela('tela-login'));

    document.getElementById('btn-voltar-painel-aluno').addEventListener('click', () => {
        document.title = "HubClass";
        if (perfilAtual === "professor") {
            mudarTela('tela-professor');
        } else {
            mudarTela('tela-aluno');
        }
    });

    document.getElementById('btn-resetar-dados').addEventListener('click', () => {
        const confirmacao = confirm("Tem certeza que deseja apagar todos os grupos e mensagens? Isso não pode ser desfeito.");
        if (confirmacao) {
            localStorage.removeItem('bancoDeGruposAcademico');
            alert("Sistema resetado com sucesso!");
            window.location.reload();
        }
    });

    /* =========================================
       2. MENU DE ANEXO (CORREÇÃO: evento faltando)
       ========================================= */
    const btnAnexo = document.getElementById('btn-anexo');
    const menuAnexo = document.getElementById('menu-anexo');

    btnAnexo.addEventListener('click', (e) => {
        e.stopPropagation();
        const aberto = menuAnexo.style.display === 'block';
        menuAnexo.style.display = aberto ? 'none' : 'block';
    });

    // Fecha o menu ao clicar em qualquer lugar fora dele
    document.addEventListener('click', () => {
        menuAnexo.style.display = 'none';
    });

    document.querySelectorAll('.btn-opcao-anexo').forEach(btn => {
        btn.addEventListener('click', () => {
            alert("Funcionalidade de anexo em desenvolvimento.");
            menuAnexo.style.display = 'none';
        });
    });

    /* =========================================
       3. BANCO DE DADOS (LOCALSTORAGE)
       ========================================= */
    function obterGrupos() {
        const dados = localStorage.getItem('bancoDeGruposAcademico');
        return dados ? JSON.parse(dados) : [];
    }

    function salvarGrupos(grupos) {
        localStorage.setItem('bancoDeGruposAcademico', JSON.stringify(grupos));
    }

    /* =========================================
       4. LÓGICA DO PROFESSOR
       ========================================= */
    document.getElementById('btn-criar-grupo').addEventListener('click', criarGrupo);

    // Permite criar grupo pressionando Enter no campo de tema
    document.getElementById('nome-tema').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') criarGrupo();
    });

    function criarGrupo() {
        const inputTema = document.getElementById('nome-tema');
        const temaTrabalho = inputTema.value.trim();

        if (temaTrabalho === "") {
            alert("Por favor, digite o tema do trabalho.");
            return;
        }

        const grupos = obterGrupos();

        // CORREÇÃO: verifica duplicatas antes de criar
        const temaDuplicado = grupos.some(g => g.tema.toLowerCase() === temaTrabalho.toLowerCase());
        if (temaDuplicado) {
            alert(`Já existe um grupo com o tema "${temaTrabalho}". Escolha um nome diferente.`);
            return;
        }

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
    }

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

            const div = document.createElement('div');
            div.className = 'card-grupo';
            div.innerHTML = `
                <h4 class="card-grupo-tema">Tema: ${grupo.tema}</h4>
                <p class="card-grupo-label"><strong>Alunos no grupo:</strong></p>
                <ul class="card-grupo-alunos">${listaAlunosHTML}</ul>
                <div class="card-grupo-acoes">
                    <button class="btn-acessar-prof btn-acao-verde" data-id="${grupo.id}">Acessar Chat</button>
                    <button class="btn-excluir-grupo btn-acao-vermelho" data-id="${grupo.id}">Excluir Grupo</button>
                </div>
            `;
            divGrupos.appendChild(div);
        });

        // Evento: professor entra no chat
        document.querySelectorAll('.btn-acessar-prof').forEach(botao => {
            botao.addEventListener('click', (e) => {
                grupoAtualId = parseInt(e.target.getAttribute('data-id'));
                mudarTela('tela-grupo-interna');
                renderizarChat();
            });
        });

        // MELHORIA: professor pode excluir grupo individual
        document.querySelectorAll('.btn-excluir-grupo').forEach(botao => {
            botao.addEventListener('click', (e) => {
                const id = parseInt(e.target.getAttribute('data-id'));
                const grupo = obterGrupos().find(g => g.id === id);
                const confirmacao = confirm(`Excluir o grupo "${grupo.tema}"? Esta ação não pode ser desfeita.`);
                if (confirmacao) {
                    const gruposAtualizados = obterGrupos().filter(g => g.id !== id);
                    salvarGrupos(gruposAtualizados);
                    renderizarProfessor();
                }
            });
        });
    }

    /* =========================================
       5. LÓGICA DO ALUNO (Escolher Grupo)
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
            const div = document.createElement('div');
            div.className = 'card-grupo';
            div.innerHTML = `
                <h4 class="card-grupo-tema">${grupo.tema}</h4>
                <p class="card-grupo-contagem">${grupo.alunos.length} aluno(s) participando</p>
                <button class="btn-entrar" data-id="${grupo.id}">Entrar neste Grupo</button>
            `;
            divGrupos.appendChild(div);
        });

        document.querySelectorAll('.btn-entrar').forEach(botao => {
            botao.addEventListener('click', (e) => {
                const idDoGrupo = parseInt(e.target.getAttribute('data-id'));
                entrarNoGrupo(idDoGrupo);
            });
        });
    }

    function entrarNoGrupo(idGrupo) {
        const inputNome = document.getElementById('nome-aluno');
        const nomeDoAluno = inputNome.value.trim();

        if (nomeDoAluno === "") {
            alert("Digite o seu nome antes de entrar num grupo!");
            return;
        }

        // CORREÇÃO: valida comprimento mínimo e máximo do nome
        if (nomeDoAluno.length < 3) {
            alert("Por favor, digite seu nome completo (mínimo 3 caracteres).");
            return;
        }
        if (nomeDoAluno.length > 60) {
            alert("Nome muito longo. Use no máximo 60 caracteres.");
            return;
        }

        let grupos = obterGrupos();
        grupos = grupos.map(grupo => {
            if (grupo.id === idGrupo && !grupo.alunos.includes(nomeDoAluno)) {
                grupo.alunos.push(nomeDoAluno);
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
       6. LÓGICA DO CHAT (Área Interna)
       ========================================= */
    function formatarHorario(timestamp) {
        if (!timestamp) return "";
        const data = new Date(timestamp);
        const h = String(data.getHours()).padStart(2, '0');
        const m = String(data.getMinutes()).padStart(2, '0');
        return `${h}:${m}`;
    }

    function renderizarChat() {
        const grupos = obterGrupos();
        const grupo = grupos.find(g => g.id === grupoAtualId);
        if (!grupo) return;

        // MELHORIA: atualiza o título da aba do navegador
        document.title = `${grupo.tema} — HubClass`;
        document.getElementById('titulo-grupo-interno').innerText = "Grupo: " + grupo.tema;

        const chatContainer = document.getElementById('chat-container');

        if (!grupo.mensagens || grupo.mensagens.length === 0) {
            chatContainer.innerHTML = "<p class='chat-vazio'>Nenhuma mensagem ainda.</p>";
            return;
        }

        // CORREÇÃO: monta todo o HTML de uma vez antes de inserir no DOM
        let htmlMensagens = "";
        grupo.mensagens.forEach(msg => {
            const isMinhaMensagem = (msg.autor === usuarioAtualNome);
            const isProfessor = (msg.autor === "Professor(a)");
            const horario = formatarHorario(msg.timestamp);
            const iconeAutor = isProfessor ? "👨‍🏫 " : "";

            let classeBolha = "bolha-outro";
            if (isMinhaMensagem) classeBolha = "bolha-minha";
            else if (isProfessor) classeBolha = "bolha-professor";

            htmlMensagens += `
                <div class="bolha-wrapper ${isMinhaMensagem ? 'wrapper-direita' : 'wrapper-esquerda'}">
                    <div class="bolha ${classeBolha}">
                        <strong class="bolha-autor ${isProfessor ? 'autor-professor' : ''}">${iconeAutor}${msg.autor}</strong>
                        <span class="bolha-texto">${msg.texto}</span>
                        ${horario ? `<span class="bolha-horario">${horario}</span>` : ''}
                    </div>
                </div>
            `;
        });

        chatContainer.innerHTML = htmlMensagens;
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    function enviarMensagem() {
        const inputMsg = document.getElementById('input-mensagem');
        const textoDaMensagem = inputMsg.value.trim();
        if (textoDaMensagem === "") return;

        let grupos = obterGrupos();
        const index = grupos.findIndex(g => g.id === grupoAtualId);
        if (index === -1) return;

        if (!grupos[index].mensagens) grupos[index].mensagens = [];

        grupos[index].mensagens.push({
            autor: usuarioAtualNome,
            texto: textoDaMensagem,
            timestamp: Date.now() // MELHORIA: salva o horário da mensagem
        });

        salvarGrupos(grupos);
        inputMsg.value = "";
        renderizarChat();
    }

    document.getElementById('btn-enviar-mensagem').addEventListener('click', enviarMensagem);

    // CORREÇÃO: enviar mensagem com Enter
    document.getElementById('input-mensagem').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') enviarMensagem();
    });
});