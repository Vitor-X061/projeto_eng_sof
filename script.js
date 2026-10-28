document.addEventListener('DOMContentLoaded', () => {
  'use strict';
  const storage = window.HubClassDados;
  let dados;
  try { dados = storage.carregar(); }
  catch (err) {
    alert('Não foi possível carregar os dados locais. Confira o armazenamento do navegador. Nenhum dado foi apagado.');
    console.error(err);
    return;
  }

  const $ = id => document.getElementById(id);
  let perfil = '';
  let aluno = '';
  let turmaId = null;
  let trabalhoId = null;
  let equipeId = null;
  let telaAnteriorTrabalho = 'tela-professor';

  const normal = valor => String(valor || '').trim().toLocaleLowerCase('pt-BR');
  const turmaAtual = () => dados.turmas.find(x => x.id === turmaId);
  const trabalhoAtual = () => turmaAtual()?.trabalhos.find(x => x.id === trabalhoId);
  const equipeAtual = () => trabalhoAtual()?.equipes.find(x => x.id === equipeId);

  function salvar() {
    try { storage.salvar(dados); return true; }
    catch (err) { console.error(err); alert('Não foi possível salvar. Verifique o espaço disponível no navegador.'); return false; }
  }

  function el(tag, texto, classe) {
    const n = document.createElement(tag);
    if (texto !== undefined && texto !== null) n.textContent = String(texto);
    if (classe) n.className = classe;
    return n;
  }
  function botao(texto, acao, classe = 'btn-pequeno') {
    const b = el('button', texto, classe);
    b.type = 'button';
    b.addEventListener('click', acao);
    return b;
  }
  function vazio(destino, texto) { destino.replaceChildren(el('p', texto, 'estado-inline')); }
  function tela(id) {
    document.querySelectorAll('.tela').forEach(x => x.classList.toggle('ativa', x.id === id));
    document.title = id === 'tela-login' ? 'HubClass' : 'HubClass — ' + (trabalhoAtual()?.titulo || turmaAtual()?.nome || 'Painel');
    if (id === 'tela-professor') renderProfessor();
    if (id === 'tela-aluno') renderAluno();
    if (id === 'tela-turma-aluno') renderTurmaAluno();
    if (id === 'tela-trabalho') renderTrabalho();
    if (id === 'tela-chat') renderChat();
  }
  function atualizar(fn) { fn(); if (salvar()) return true; return false; }
  function mesmaPessoa(a, b) { return normal(a) === normal(b); }
  function alunoNaEquipe(trabalho, nome) {
    return trabalho.equipes.find(e => e.membros.some(m => mesmaPessoa(m, nome)));
  }
  function equipeDoAluno(trabalho) { return alunoNaEquipe(trabalho, aluno); }
  function validacaoNome(nome, minimo = 3) {
    if (nome.length < minimo || nome.length > 80) { alert('Informe um nome válido (' + minimo + ' a 80 caracteres).'); return false; }
    return true;
  }

  $('btn-login-prof').addEventListener('click', () => { perfil = 'professor'; aluno = ''; tela('tela-professor'); });
  $('btn-login-aluno').addEventListener('click', () => { perfil = 'aluno'; turmaId = null; trabalhoId = null; tela('tela-aluno'); });
  $('btn-sair-prof').addEventListener('click', () => tela('tela-login'));
  $('btn-sair-aluno').addEventListener('click', () => tela('tela-login'));
  $('btn-voltar-turmas').addEventListener('click', () => tela('tela-aluno'));
  $('btn-voltar-trabalho').addEventListener('click', () => tela(telaAnteriorTrabalho));
  $('btn-voltar-equipes').addEventListener('click', () => tela('tela-trabalho'));

  $('form-turma').addEventListener('submit', ev => {
    ev.preventDefault();
    if (perfil !== 'professor') return;
    const nome = $('nome-turma').value.trim();
    if (!validacaoNome(nome) || dados.turmas.some(t => normal(t.nome) === normal(nome))) {
      if (nome.length >= 3 && dados.turmas.some(t => normal(t.nome) === normal(nome))) alert('Essa turma já existe.');
      return;
    }
    const t = { id: storage.gerarId(), nome, alunos: [], trabalhos: [] };
    dados.turmas.push(t); turmaId = t.id;
    salvar(); $('form-turma').reset(); renderProfessor();
  });

  function renderProfessor() {
    const lista = $('lista-turmas-prof');
    lista.replaceChildren();
    $('badge-turmas').textContent = dados.turmas.length + (dados.turmas.length === 1 ? ' turma' : ' turmas');
    if (!turmaAtual() && dados.turmas.length) turmaId = dados.turmas[0].id;
    dados.turmas.forEach(t => {
      lista.appendChild(botao(t.nome + ' · ' + t.alunos.length + ' aluno(s)', () => { turmaId = t.id; renderProfessor(); }, 'item-turma' + (t.id === turmaId ? ' selecionado' : '')));
    });
    const t = turmaAtual();
    $('prof-sem-turma').hidden = !!t;
    $('prof-com-turma').hidden = !t;
    if (!t) return;
    $('titulo-turma-prof').textContent = t.nome;
    $('resumo-turma-prof').textContent = t.alunos.length + ' aluno(s) · ' + t.trabalhos.length + ' trabalho(s)';
    const grid = $('lista-trabalhos-prof');
    grid.replaceChildren();
    if (!t.trabalhos.length) { vazio(grid, 'Nenhum trabalho cadastrado nesta turma.'); return; }
    t.trabalhos.forEach(tr => {
      const card = el('article', undefined, 'card-grupo');
      card.append(el('h4', tr.titulo, 'card-grupo-tema'), el('p', tr.equipes.length + ' equipe(s) · ' + (tr.formacao === 'professor' ? 'Organização pelo professor' : 'Escolha pelos alunos'), 'card-grupo-meta'));
      if (tr.prazo) card.appendChild(el('p', 'Entrega prevista: ' + tr.prazo, 'card-grupo-meta'));
      const acoes = el('div', undefined, 'card-grupo-acoes');
      acoes.append(botao('Gerenciar equipes', () => abrirTrabalho(tr.id, 'tela-professor')), botao('Excluir', () => {
        if (!confirm('Excluir o trabalho "' + tr.titulo + '" e todas suas equipes e mensagens?')) return;
        t.trabalhos = t.trabalhos.filter(x => x.id !== tr.id);
        salvar(); renderProfessor();
      }, 'btn-acao-outline btn-pequeno'));
      card.appendChild(acoes); grid.appendChild(card);
    });
  }

  $('btn-excluir-turma').addEventListener('click', () => {
    if (perfil !== 'professor') return;
    const t = turmaAtual();
    if (!t || !confirm('Excluir a turma "' + t.nome + '" e TODOS os trabalhos, equipes e mensagens associados?')) return;
    dados.turmas = dados.turmas.filter(x => x.id !== turmaId);
    turmaId = dados.turmas[0]?.id || null;
    salvar(); renderProfessor();
  });
  $('formacao-equipes').addEventListener('change', () => { $('alunos-podem-criar').disabled = $('formacao-equipes').value !== 'alunos'; });
  $('form-trabalho').addEventListener('submit', ev => {
    ev.preventDefault();
    if (perfil !== 'professor') return;
    const t = turmaAtual(); if (!t) return;
    const titulo = $('titulo-trabalho').value.trim();
    const minimo = Number($('min-equipe').value);
    const maximo = Number($('max-equipe').value);
    if (!validacaoNome(titulo) || !Number.isInteger(minimo) || !Number.isInteger(maximo) || minimo < 1 || maximo > 30 || minimo > maximo) {
      alert('Confira os limites: mínimo e máximo entre 1 e 30, com mínimo menor ou igual ao máximo.'); return;
    }
    if (t.trabalhos.some(x => normal(x.titulo) === normal(titulo))) { alert('Já existe um trabalho com esse título nesta turma.'); return; }
    t.trabalhos.push({
      id: storage.gerarId(), titulo, descricao: $('descricao-trabalho').value.trim(), prazo: $('prazo-trabalho').value,
      formacao: $('formacao-equipes').value, minimo, maximo,
      permitirCriacao: $('formacao-equipes').value === 'alunos' && $('alunos-podem-criar').checked,
      equipes: []
    });
    salvar(); $('form-trabalho').reset(); $('alunos-podem-criar').disabled = false; renderProfessor();
  });

  function nomeAluno() {
    const nome = $('nome-aluno').value.trim();
    if (nome.length < 3 || nome.length > 60) { alert('Digite seu nome completo (3 a 60 caracteres).'); return ''; }
    aluno = nome; return nome;
  }
  function renderAluno() {
    const grid = $('lista-turmas-aluno'); grid.replaceChildren();
    if (!dados.turmas.length) { vazio(grid, 'O professor ainda não criou nenhuma turma neste navegador.'); return; }
    dados.turmas.forEach(t => {
      const card = el('article', undefined, 'card-grupo');
      card.append(el('h4', t.nome, 'card-grupo-tema'), el('p', t.trabalhos.length + ' trabalho(s) disponível(is)', 'card-grupo-meta'));
      card.appendChild(botao('Acessar turma', () => {
        const nome = nomeAluno(); if (!nome) return;
        if (!t.alunos.some(a => mesmaPessoa(a, nome))) { t.alunos.push(nome); salvar(); }
        turmaId = t.id; tela('tela-turma-aluno');
      }));
      grid.appendChild(card);
    });
  }
  function renderTurmaAluno() {
    const t = turmaAtual(); if (!t) { tela('tela-aluno'); return; }
    $('titulo-turma-aluno').textContent = t.nome;
    const grid = $('lista-trabalhos-aluno'); grid.replaceChildren();
    if (!t.trabalhos.length) { vazio(grid, 'Ainda não há trabalhos nesta turma.'); return; }
    t.trabalhos.forEach(tr => {
      const card = el('article', undefined, 'card-grupo');
      card.append(el('h4', tr.titulo, 'card-grupo-tema'),
        el('p', (tr.formacao === 'professor' ? 'Equipes definidas pelo professor' : 'Equipes escolhidas pelos alunos') + ' · ' + tr.minimo + ' a ' + tr.maximo + ' alunos', 'card-grupo-meta'));
      card.appendChild(botao('Ver equipes', () => abrirTrabalho(tr.id, 'tela-turma-aluno')));
      grid.appendChild(card);
    });
  }
  function abrirTrabalho(id, origem) {
    trabalhoId = id; equipeId = null; telaAnteriorTrabalho = origem; tela('tela-trabalho');
  }
  function renderTrabalho() {
    const tr = trabalhoAtual(), t = turmaAtual();
    if (!tr || !t) { tela(perfil === 'professor' ? 'tela-professor' : 'tela-aluno'); return; }
    $('titulo-trabalho-aberto').textContent = tr.titulo;
    $('contexto-trabalho').textContent = t.nome;
    $('detalhe-trabalho-titulo').textContent = tr.titulo;
    $('detalhe-trabalho-desc').textContent = tr.descricao || 'Sem orientações adicionais.';
    $('regras-trabalho').textContent = (tr.formacao === 'professor' ? 'Professor organiza' : 'Alunos escolhem') +
      ' · ' + tr.minimo + ' a ' + tr.maximo + ' aluno(s) por equipe' + (tr.prazo ? ' · Prazo: ' + tr.prazo : '');
    const podeCriar = perfil === 'professor' || (tr.formacao === 'alunos' && tr.permitirCriacao && !equipeDoAluno(tr));
    $('form-equipe').hidden = !podeCriar;
    const grid = $('lista-equipes'); grid.replaceChildren();
    if (!tr.equipes.length) { vazio(grid, 'Nenhuma equipe criada para este trabalho.'); return; }
    tr.equipes.forEach(eq => {
      const card = el('article', undefined, 'card-grupo');
      card.append(el('h4', eq.nome, 'card-grupo-tema'), el('p', eq.membros.length + '/' + tr.maximo + ' participante(s)', 'card-grupo-meta'));
      if (eq.membros.length < tr.minimo) card.appendChild(el('p', 'Aguardando mínimo de participantes.', 'aviso-discreto'));
      const acoes = el('div', undefined, 'card-grupo-acoes');
      if (perfil === 'professor') {
        acoes.append(botao('Abrir chat', () => abrirChat(eq.id)));
        acoes.append(botao('Adicionar aluno', () => {
          const nome = prompt('Nome do aluno matriculado nesta turma:');
          if (nome === null) return;
          const pessoa = nome.trim();
          if (!pessoa || !t.alunos.some(a => mesmaPessoa(a, pessoa))) { alert('Esse aluno ainda não está matriculado nesta turma.'); return; }
          const outra = alunoNaEquipe(tr, pessoa);
          if (outra) { alert('O aluno já participa de ' + outra.nome + ' neste trabalho.'); return; }
          if (eq.membros.length >= tr.maximo) { alert('Equipe cheia.'); return; }
          eq.membros.push(t.alunos.find(a => mesmaPessoa(a, pessoa))); salvar(); renderTrabalho();
        }));
        acoes.append(botao('Remover aluno', () => {
          if (!eq.membros.length) return alert('Esta equipe não tem alunos.');
          const nome = prompt('Digite o nome exato do aluno para remover:\n' + eq.membros.join(', '));
          if (nome === null) return;
          const antes = eq.membros.length;
          eq.membros = eq.membros.filter(a => !mesmaPessoa(a, nome.trim()));
          if (eq.membros.length === antes) return alert('Aluno não encontrado nesta equipe.');
          salvar(); renderTrabalho();
        }, 'btn-acao-outline btn-pequeno'));
        acoes.append(botao('Excluir equipe', () => {
          if (!confirm('Excluir "' + eq.nome + '" e suas mensagens?')) return;
          tr.equipes = tr.equipes.filter(x => x.id !== eq.id); salvar(); renderTrabalho();
        }, 'btn-acao-outline btn-pequeno'));
      } else {
        const minha = equipeDoAluno(tr);
        if (minha?.id === eq.id) {
          acoes.append(botao('Abrir chat', () => abrirChat(eq.id)));
          if (tr.formacao === 'alunos') acoes.append(botao('Sair da equipe', () => {
            if (!confirm('Sair desta equipe?')) return;
            eq.membros = eq.membros.filter(x => !mesmaPessoa(x, aluno)); salvar(); renderTrabalho();
          }, 'btn-acao-outline btn-pequeno'));
        } else if (!minha && tr.formacao === 'alunos' && eq.membros.length < tr.maximo) {
          acoes.append(botao('Entrar na equipe', () => {
            if (equipeDoAluno(tr)) return alert('Você já participa de outra equipe neste trabalho.');
            eq.membros.push(aluno); salvar(); renderTrabalho();
          }));
        } else if (minha) acoes.appendChild(el('p', 'Você já está em outra equipe.', 'aviso-discreto'));
        else if (tr.formacao === 'professor') acoes.appendChild(el('p', 'Aguarde a atribuição do professor.', 'aviso-discreto'));
        else acoes.appendChild(el('p', 'Equipe completa.', 'aviso-discreto'));
      }
      card.appendChild(acoes); grid.appendChild(card);
    });
  }
  $('form-equipe').addEventListener('submit', ev => {
    ev.preventDefault();
    const tr = trabalhoAtual(); if (!tr) return;
    if (perfil !== 'professor' && (tr.formacao !== 'alunos' || !tr.permitirCriacao || equipeDoAluno(tr))) return;
    const nome = $('nome-equipe').value.trim();
    if (!validacaoNome(nome) || tr.equipes.some(e => normal(e.nome) === normal(nome))) {
      if (tr.equipes.some(e => normal(e.nome) === normal(nome))) alert('Já existe uma equipe com esse nome.'); return;
    }
    tr.equipes.push({ id: storage.gerarId(), nome, membros: perfil === 'aluno' ? [aluno] : [], mensagens: [] });
    salvar(); $('form-equipe').reset(); renderTrabalho();
  });
  function abrirChat(id) {
    const eq = trabalhoAtual()?.equipes.find(x => x.id === id);
    if (!eq) return;
    if (perfil === 'aluno' && !eq.membros.some(x => mesmaPessoa(x, aluno))) return alert('Você não faz parte desta equipe.');
    equipeId = id; tela('tela-chat');
  }
  function renderChat() {
    const eq = equipeAtual(); if (!eq) { tela('tela-trabalho'); return; }
    $('titulo-chat').textContent = eq.nome;
    $('badge-membros').textContent = eq.membros.length + ' alunos';
    const membros = $('lista-membros-chat'); membros.replaceChildren(el('div', 'Professor(a)', 'membro-item'));
    eq.membros.forEach(x => membros.appendChild(el('div', x, 'membro-item')));
    const chat = $('chat-container'); chat.replaceChildren();
    if (!eq.mensagens.length) { vazio(chat, 'Nenhuma mensagem. Comece a conversa.'); return; }
    eq.mensagens.forEach(msg => {
      const div = el('div', undefined, 'bolha-wrapper ' + (mesmaPessoa(msg.autor, perfil === 'professor' ? 'Professor(a)' : aluno) ? 'wrapper-direita' : 'wrapper-esquerda'));
      const bolha = el('div', undefined, 'bolha ' + (msg.autor === 'Professor(a)' ? 'bolha-professor' : 'bolha-outro'));
      bolha.append(el('strong', msg.autor, 'bolha-autor'), el('span', msg.texto, 'bolha-texto'));
      const time = new Date(msg.timestamp);
      if (!Number.isNaN(time.getTime())) bolha.appendChild(el('small', time.toLocaleTimeString('pt-BR', {hour:'2-digit',minute:'2-digit'}), 'bolha-horario'));
      div.appendChild(bolha); chat.appendChild(div);
    });
    chat.scrollTop = chat.scrollHeight;
  }
  $('form-mensagem').addEventListener('submit', ev => {
    ev.preventDefault();
    const eq = equipeAtual(); if (!eq) return;
    if (perfil === 'aluno' && !eq.membros.some(x => mesmaPessoa(x, aluno))) return;
    const texto = $('input-mensagem').value.trim(); if (!texto) return;
    eq.mensagens.push({ id: storage.gerarId(), autor: perfil === 'professor' ? 'Professor(a)' : aluno, texto, timestamp: Date.now() });
    if (salvar()) { $('form-mensagem').reset(); renderChat(); }
  });
});
