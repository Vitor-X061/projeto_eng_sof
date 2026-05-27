document.addEventListener('DOMContentLoaded', () => {

    /* =========================================
       1. NAVEGAÇÃO
       ========================================= */
    const telas = document.querySelectorAll('.tela');
    let perfilAtual = "";
    let grupoAtualId = null;
    let usuarioAtualNome = "";

    function mudarTela(id) {
        telas.forEach(t => t.classList.remove('ativa'));
        document.getElementById(id).classList.add('ativa');
        if (id === 'tela-professor') renderizarProfessor();
        if (id === 'tela-aluno')     renderizarAluno();
        if (id === 'tela-login')     document.title = "HubClass";
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
        mudarTela(perfilAtual === "professor" ? 'tela-professor' : 'tela-aluno');
    });

    document.getElementById('btn-resetar-dados').addEventListener('click', () => {
        if (confirm("Tem certeza que deseja apagar todos os grupos e mensagens? Isso não pode ser desfeito.")) {
            localStorage.removeItem('bancoDeGruposAcademico');
            alert("Sistema resetado com sucesso!");
            window.location.reload();
        }
    });

    /* =========================================
       2. MENU DE ANEXO
       ========================================= */
    const btnAnexo  = document.getElementById('btn-anexo');
    const menuAnexo = document.getElementById('menu-anexo');

    btnAnexo.addEventListener('click', (e) => {
        e.stopPropagation();
        menuAnexo.style.display = menuAnexo.style.display === 'block' ? 'none' : 'block';
    });

    document.addEventListener('click', () => { menuAnexo.style.display = 'none'; });

    document.querySelectorAll('.btn-opcao-anexo').forEach(btn => {
        btn.addEventListener('click', () => {
            alert("Funcionalidade de anexo em desenvolvimento.");
            menuAnexo.style.display = 'none';
        });
    });

    /* =========================================
       3. BANCO DE DADOS
       ========================================= */
    function obterGrupos() {
        const dados = localStorage.getItem('bancoDeGruposAcademico');
        return dados ? JSON.parse(dados) : [];
    }

    function salvarGrupos(grupos) {
        localStorage.setItem('bancoDeGruposAcademico', JSON.stringify(grupos));
    }

    /* =========================================
       4. PROFESSOR
       ========================================= */
    document.getElementById('btn-criar-grupo').addEventListener('click', criarGrupo);
    document.getElementById('nome-tema').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') criarGrupo();
    });

    function criarGrupo() {
        const input = document.getElementById('nome-tema');
        const tema  = input.value.trim();
        if (!tema) { alert("Digite o tema do trabalho."); return; }

        const grupos = obterGrupos();
        if (grupos.some(g => g.tema.toLowerCase() === tema.toLowerCase())) {
            alert(`Já existe um grupo com o tema "${tema}".`);
            return;
        }

        grupos.push({ id: Date.now(), tema, alunos: [], mensagens: [] });
        salvarGrupos(grupos);
        input.value = "";
        renderizarProfessor();
    }

    function renderizarProfessor() {
        const grupos = obterGrupos();

        // Badge no topbar
        const badge = document.getElementById('badge-grupos-prof');
        if (badge) badge.textContent = `${grupos.length} grupo${grupos.length !== 1 ? 's' : ''}`;

        // Sidebar
        const sidebar = document.getElementById('lista-grupos-sidebar');
        sidebar.innerHTML = "";
        grupos.forEach(g => {
            const div = document.createElement('div');
            div.className = 'card-grupo-side';
            div.innerHTML = `
                <h4>${g.tema}</h4>
                <div class="meta">${g.alunos.length} aluno(s) <span class="chip-msgs">${(g.mensagens||[]).length} msgs</span></div>
            `;
            div.addEventListener('click', () => {
                grupoAtualId = g.id;
                mudarTela('tela-grupo-interna');
                renderizarChat();
            });
            sidebar.appendChild(div);
        });

        // Grid principal
        const grid = document.getElementById('lista-grupos-professor');
        grid.innerHTML = "";

        if (grupos.length === 0) {
            grid.innerHTML = "<p style='color:#999;font-size:14px;'>Nenhum grupo criado ainda.</p>";
            return;
        }

        grupos.forEach(grupo => {
            const listaAlunos = grupo.alunos.length > 0
                ? grupo.alunos.map(a => `<li>${a}</li>`).join('')
                : "<li style='color:#bbb;'>Nenhum aluno entrou ainda.</li>";

            const div = document.createElement('div');
            div.className = 'card-grupo';
            div.innerHTML = `
                <h4 class="card-grupo-tema">${grupo.tema}</h4>
                <p class="card-grupo-meta">${grupo.alunos.length} aluno(s) · <span class="chip-msgs">${(grupo.mensagens||[]).length} msgs</span></p>
                <p class="card-grupo-label"><strong>Alunos:</strong></p>
                <ul class="card-grupo-alunos">${listaAlunos}</ul>
                <div class="card-grupo-acoes">
                    <button class="btn-acao-vermelho btn-acessar-prof" data-id="${grupo.id}">Acessar Chat</button>
                    <button class="btn-acao-outline btn-excluir-grupo" data-id="${grupo.id}">Excluir</button>
                </div>
            `;
            grid.appendChild(div);
        });

        document.querySelectorAll('.btn-acessar-prof').forEach(btn => {
            btn.addEventListener('click', (e) => {
                grupoAtualId = parseInt(e.target.getAttribute('data-id'));
                mudarTela('tela-grupo-interna');
                renderizarChat();
            });
        });

        document.querySelectorAll('.btn-excluir-grupo').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.target.getAttribute('data-id'));
                const g  = obterGrupos().find(x => x.id === id);
                if (confirm(`Excluir o grupo "${g.tema}"?`)) {
                    salvarGrupos(obterGrupos().filter(x => x.id !== id));
                    renderizarProfessor();
                }
            });
        });
    }

    /* =========================================
       5. ALUNO
       ========================================= */
    function renderizarAluno() {
        const grid   = document.getElementById('lista-grupos-aluno');
        const grupos = obterGrupos();
        grid.innerHTML = "";

        if (grupos.length === 0) {
            grid.innerHTML = "<p style='color:#999;font-size:14px;'>O professor ainda não criou nenhum grupo.</p>";
            return;
        }

        grupos.forEach(grupo => {
            const div = document.createElement('div');
            div.className = 'card-grupo';
            div.innerHTML = `
                <h4 class="card-grupo-tema">${grupo.tema}</h4>
                <p class="card-grupo-contagem">${grupo.alunos.length} aluno(s) participando</p>
                <div class="card-grupo-acoes">
                    <button class="btn-acao-vermelho btn-entrar" data-id="${grupo.id}">Entrar no Grupo</button>
                </div>
            `;
            grid.appendChild(div);
        });

        document.querySelectorAll('.btn-entrar').forEach(btn => {
            btn.addEventListener('click', (e) => {
                entrarNoGrupo(parseInt(e.target.getAttribute('data-id')));
            });
        });
    }

    function entrarNoGrupo(idGrupo) {
        const nome = document.getElementById('nome-aluno').value.trim();
        if (!nome)          { alert("Digite o seu nome antes de entrar."); return; }
        if (nome.length < 3){ alert("Nome muito curto (mínimo 3 caracteres)."); return; }
        if (nome.length > 60){ alert("Nome muito longo (máximo 60 caracteres)."); return; }

        let grupos = obterGrupos();
        grupos = grupos.map(g => {
            if (g.id === idGrupo && !g.alunos.includes(nome)) g.alunos.push(nome);
            return g;
        });

        salvarGrupos(grupos);
        usuarioAtualNome = nome;
        grupoAtualId     = idGrupo;
        mudarTela('tela-grupo-interna');
        renderizarChat();
    }

    /* =========================================
       6. CHAT
       ========================================= */
    function formatarHorario(ts) {
        if (!ts) return "";
        const d = new Date(ts);
        return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
    }

    function inicialDe(nome) {
        return nome.trim().charAt(0).toUpperCase();
    }

    function renderizarChat() {
        const grupo = obterGrupos().find(g => g.id === grupoAtualId);
        if (!grupo) return;

        document.title = `${grupo.tema} — HubClass`;
        document.getElementById('titulo-grupo-interno').innerText = grupo.tema;

        // Badge de membros
        const badge = document.getElementById('badge-membros');
        if (badge) badge.textContent = `${grupo.alunos.length + 1} membro(s)`;

        // Sidebar de membros
        const listaMembros = document.getElementById('lista-membros-chat');
        if (listaMembros) {
            listaMembros.innerHTML = "";

            // Professor sempre aparece primeiro
            const divProf = document.createElement('div');
            divProf.className = 'membro-item';
            divProf.innerHTML = `<div class="avatar prof-avatar">P</div> Professor(a)`;
            listaMembros.appendChild(divProf);

            grupo.alunos.forEach(aluno => {
                const div = document.createElement('div');
                div.className = 'membro-item';
                div.innerHTML = `<div class="avatar">${inicialDe(aluno)}</div> ${aluno}`;
                listaMembros.appendChild(div);
            });
        }

        // Mensagens
        const chat = document.getElementById('chat-container');
        if (!grupo.mensagens || grupo.mensagens.length === 0) {
            chat.innerHTML = "<p class='chat-vazio'>Nenhuma mensagem ainda. Seja o primeiro a escrever!</p>";
            return;
        }

        let html = "";
        grupo.mensagens.forEach(msg => {
            const isMinha = (msg.autor === usuarioAtualNome);
            const isProf  = (msg.autor === "Professor(a)");
            const horario = formatarHorario(msg.timestamp);
            const icone   = isProf ? "👨‍🏫 " : "";

            let classeBolha  = "bolha-outro";
            let classeAutor  = "bolha-autor";
            if (isMinha) { classeBolha = "bolha-minha";     classeAutor += " autor-minha"; }
            else if (isProf) { classeBolha = "bolha-professor"; classeAutor += " autor-professor"; }

            html += `
                <div class="bolha-wrapper ${isMinha ? 'wrapper-direita' : 'wrapper-esquerda'}">
                    <div class="bolha ${classeBolha}">
                        <strong class="${classeAutor}">${icone}${msg.autor}</strong>
                        <span class="bolha-texto">${msg.texto}</span>
                        ${horario ? `<span class="bolha-horario">${horario}</span>` : ''}
                    </div>
                </div>`;
        });

        chat.innerHTML = html;
        chat.scrollTop = chat.scrollHeight;
    }

    function enviarMensagem() {
        const input = document.getElementById('input-mensagem');
        const texto = input.value.trim();
        if (!texto) return;

        let grupos = obterGrupos();
        const idx  = grupos.findIndex(g => g.id === grupoAtualId);
        if (idx === -1) return;

        if (!grupos[idx].mensagens) grupos[idx].mensagens = [];
        grupos[idx].mensagens.push({ autor: usuarioAtualNome, texto, timestamp: Date.now() });

        salvarGrupos(grupos);
        input.value = "";
        renderizarChat();
    }

    document.getElementById('btn-enviar-mensagem').addEventListener('click', enviarMensagem);
    document.getElementById('input-mensagem').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') enviarMensagem();
    });
});