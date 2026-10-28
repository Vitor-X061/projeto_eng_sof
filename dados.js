// Armazenamento local do protótipo. Sem backend e sem sincronização entre dispositivos.
(function () {
  'use strict';

  const CHAVE = 'hubclassDadosV2';
  const CHAVE_ANTIGA = 'bancoDeGruposAcademico';

  function gerarId() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    return 'hc-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2);
  }

  function criarEstrutura() {
    return { versao: 2, turmas: [] };
  }

  function migrarDadosAntigos() {
    const antigo = localStorage.getItem(CHAVE_ANTIGA);
    if (!antigo) return criarEstrutura();

    const grupos = JSON.parse(antigo);
    if (!Array.isArray(grupos) || grupos.length === 0) return criarEstrutura();

    // Dados antigos são copiados; a chave anterior não é apagada.
    const alunos = Array.from(new Set(grupos.flatMap(function (grupo) {
      return Array.isArray(grupo.alunos) ? grupo.alunos.filter(x => typeof x === 'string') : [];
    })));
    const turma = {
      id: gerarId(),
      nome: 'Turma importada (versão anterior)',
      alunos: alunos,
      trabalhos: grupos.map(function (grupo) {
        const membros = Array.isArray(grupo.alunos) ? grupo.alunos.filter(x => typeof x === 'string') : [];
        const msgs = Array.isArray(grupo.mensagens) ? grupo.mensagens : [];
        return {
          id: gerarId(),
          titulo: String(grupo.tema || 'Trabalho importado'),
          descricao: 'Importado do protótipo original.',
          prazo: '',
          formacao: 'professor',
          minimo: 1,
          maximo: Math.max(5, membros.length),
          permitirCriacao: false,
          equipes: [{
            id: gerarId(),
            nome: 'Equipe original',
            membros: membros,
            mensagens: msgs.map(function (msg) {
              return {
                id: gerarId(),
                autor: String(msg.autor || 'Desconhecido'),
                texto: String(msg.texto || ''),
                timestamp: Number(msg.timestamp) || Date.now()
              };
            })
          }]
        };
      })
    };
    return { versao: 2, turmas: [turma] };
  }

  function carregar() {
    const dadosSalvos = localStorage.getItem(CHAVE);
    if (dadosSalvos) {
      const dados = JSON.parse(dadosSalvos);
      if (!dados || !Array.isArray(dados.turmas)) {
        throw new Error('Os dados do HubClass estão em formato inesperado.');
      }
      return dados;
    }
    const dados = migrarDadosAntigos();
    salvar(dados);
    return dados;
  }

  function salvar(dados) {
    localStorage.setItem(CHAVE, JSON.stringify(dados));
  }

  window.HubClassDados = Object.freeze({ carregar, salvar, gerarId });
}());
