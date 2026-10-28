# HubClass — protótipo acadêmico

O HubClass é uma aplicação web em HTML, CSS e JavaScript para organizar **turmas**, **trabalhos** e **equipes** de estudantes.

## Como executar

Abra `index.html` em um navegador moderno. Não é necessário instalar dependências. Os arquivos `dados.js` e `script.js` devem permanecer na mesma pasta.

## Fluxo atual

- Professor: cria turmas e trabalhos, define o modo de formação das equipes (professor ou alunos), quantidade mínima e máxima de integrantes, cria equipes e gerencia participantes matriculados.
- Aluno: informa o nome, entra em uma turma, consulta trabalhos e participa de equipes disponíveis quando o trabalho permite. Cada aluno só pode participar de uma equipe por trabalho.
- Equipes: exibem os participantes e um chat de texto local.

## Limitações desta etapa

**Esta é apenas uma demonstração local.** Não existem contas, autenticação real, backend, banco de dados centralizado ou comunicação entre dispositivos. Todos os dados permanecem no `localStorage` do navegador. Evite usar dados reais de alunos em ambientes compartilhados.

A navegação “professor”/“aluno” **não representa controle de acesso**: qualquer pessoa que usa esse mesmo navegador pode escolher ambos os perfis.

O recurso de envio de anexos e a entrega formal de trabalhos ainda não estão implementados. Os limites mínimos de equipe são informativos no protótipo; o máximo é validado para entradas.

Os dados da versão anterior, em `bancoDeGruposAcademico`, são **copiados** para uma turma de importação na primeira execução, se não existir ainda o formato novo `hubclassDadosV2`. A chave antiga não é apagada. Para validar a migração sem risco, faça uma cópia dos dados locais antes de testar.

## Testes manuais sugeridos

1. Entre como professor e crie uma turma e um trabalho com formação livre.
2. Crie uma equipe; entre como aluno, escolha a turma e entre nessa equipe.
3. Crie um segundo trabalho e confirme que o aluno pode pertencer a uma equipe diferente nele.
4. Teste o limite máximo de integrantes e a proibição de entrar em duas equipes do mesmo trabalho.
5. Crie um trabalho em que o professor define equipes, entre como aluno e confirme que a entrada direta não está habilitada.
6. Como professor, adicione alunos matriculados a uma equipe e abra o chat de equipe.
7. Recarregue a página para verificar a persistência local.
8. Teste as telas em um dispositivo móvel e com navegação por teclado.

## Estrutura

- `index.html`: telas e formulários.
- `style.css`: identidade visual e layout responsivo.
- `dados.js`: persistência local e migração dos dados antigos.
- `script.js`: navegação, regras básicas e interações.

O próximo passo planejado é implementar autenticação, regras de acesso no servidor e dados sincronizados, **fora do escopo desta versão**.
