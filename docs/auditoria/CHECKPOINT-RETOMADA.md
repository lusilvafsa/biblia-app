# Retomada da auditoria bíblica — 07/11/2026 (America/Sao_Paulo)

## Base e autorização
Repositório: lusilvafsa/biblia-app.
Base remota consultada: 5890d4eb47e54f3a6fd34ed6891fc1aa4510d68a (main).
O usuário transmitiu autorização do responsável pelo aplicativo para aplicar correções e melhorias identificadas, incluindo conteúdo bíblico. Diferenciar erro objetivo, variante textual, divergência denominacional e aplicação pastoral. Não apresentar uma tradição como consenso.

## Registro recuperado da sessão anterior
As informações abaixo foram lidas de um checkpoint local em uma etapa anterior desta conversa. NÃO equivalem à verificação atual dos arquivos ou do banco:
- Validação estrutural de 31.106 posições ACF com comentário.
- Revisão exegética de Gn 1 (31), Sl 46 (11), 1Jo 5 (21), Ap 20 (15), Ap 22 (21): 99 versículos; 29 alterações de explicação relatadas.
- Recuperação relatada de 257 referências que atravessavam capítulos/livros; remoção de duas chaves duplicadas preservando a definição efetiva.
- Mapeamento relatado entre ACF, BLIVRE e ARC1911 para diferenças locais de numeração.
- Quatro respostas antigas do cache Supabase relatadas como corrigidas.
- Migração Supabase 20261108002459 relatada como aplicada: remoção de TRUNCATE/REFERENCES/TRIGGER de anon/authenticated em cinco tabelas, RLS mantida em sete.
- Testes anteriores relatados: 12/12, sem homologação Android real.
- Nenhuma skill instalada: licenças não localizadas para BibleMate/Skill-Theo ou incompatibilidade operacional/custo no caso OpenLumin.
- Pendência de direitos de distribuição da tradução ACF completa, sem autorização localizada.
- Próximo lote indicado: Gn 2; conferir a revisão separada do cache Gn 2:1.
- Restavam 31.007 comentários e 137 resumos de capítulos, além de outros recursos editoriais.

## Limite de recuperação atual
A pasta original auditoria-biblia e o checkout que continha docs/auditoria foram encontrados e lidos antes, mas deixaram de estar disponíveis na inspeção seguinte do ambiente temporário. Não foram localizados no inventário recente nem na busca de arquivos persistentes. As correções não estavam na main consultada; a busca anterior de branches não identificou branch da auditoria. Não presumir perda definitiva, nem afirmar que os patches foram recuperados.
A branch audit/continuation-20261107 preserva SOMENTE este registro de retomada, baseado na main. Não contém as 29 correções antigas, relatórios integrais ou backup do banco.

## Inspeção adicional nesta conversa
Foram lidos os comentários locais de Gn 2 e Gn 3 na base remota, mas NÃO foi concluído nem salvo novo lote exegético. Não incrementar o contador de revisados por essa leitura preliminar.
Candidatos a verificar: Gn 2:23 afirma preservação parcial do jogo sonoro hebraico em homem/mulher; Gn 3:22 remete a guarda da árvore ao versículo seguinte, embora a guarda seja descrita em 3:24. Verificar fontes e texto antes de alterar.

## Fontes já abertas, a consultar somente quando necessário
- https://bible.org/sites/bible.org/resources/netbible/gen2_notes.htm
- https://bible.org/sites/bible.org/resources/netbible/gen3_notes.htm
- https://bible.usccb.org/bible/genesis/2
Notas NET têm perspectiva interpretativa própria; diferenciar dados linguísticos de posições confessionais. Não copiar comentários extensos de terceiros.

## Continuidade no PC
1. Ler AGENTS.md aplicáveis; preservar checkout e alterações locais.
2. Procurar primeiro os arquivos de auditoria em caminhos relevantes locais, branches e artefatos acessíveis. Não varrer dados pessoais alheios ao projeto.
3. Se não recuperar o lote antigo, marcar seu estado como histórico relatado e recuperação pendente. Continuar novos lotes sem fabricar patches antigos nem sobrescrever correções existentes.
4. Revisar Gn 2 em contexto; depois Gn 3 e seguintes. Registrar antes/depois, localização, hash, classificação, fontes e estado por versículo.
5. Separar validação estrutural de revisão editorial/exegética.
6. Manter relatórios e checkpoint no Git; nunca publicar credenciais, dados pessoais, dumps ou cache privado.
7. Usar somente ferramentas e modelos gratuitos já autorizados. Não habilitar consumo pago.
8. Não executar migrações Supabase relatadas como aplicadas sem conferir o histórico real e o estado atual. Não alterar produção indiscriminadamente.
