# Acompanhantes e acesso por senha

## O que será alterado
- Adicionar ao RSVP a quantidade de acompanhantes, de 0 a 10.
- Mostrar um campo de nome para cada acompanhante informado.
- Salvar a quantidade e os nomes junto da confirmação principal.
- Exibir, em “Minha área”, o convidado principal, seus acompanhantes, telefone e total de pessoas.
- Substituir o login por e-mail e senha por um único campo de senha.

## Segurança
- A senha ficará guardada apenas no ambiente protegido do site, nunca no navegador ou no código público.
- O acesso liberado será mantido em uma sessão segura por sete dias.
- A lista continuará inacessível para visitantes e só será carregada após validar a senha.

## Detalhes técnicos
- Adicionar `companion_names` à tabela existente de confirmações; `party_size` continuará registrando o total do grupo.
- Validar no servidor a quantidade, os nomes e o tamanho dos campos.
- Remover o fluxo administrativo baseado em conta e usar uma função protegida por senha e sessão criptografada.
- Atualizar o formulário e a lista administrativa para os novos dados e validar o resultado no celular.
