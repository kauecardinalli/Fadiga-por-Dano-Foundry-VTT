# 🩸 Fadiga por Perda de Vida - Foundry VTT

Um módulo automatizado para **Foundry VTT** (Sistema D&D 5e) projetado para mesas com foco em *Gritty Realism* (Realismo Cru) ou *Dark Fantasy*. Ele adiciona peso e tensão aos combates punindo os jogadores com níveis de exaustão progressivos e cumulativos conforme perdem Pontos de Vida (HP).

Curar o HP não remove a fadiga; apenas um Descanso Longo pode curar os ferimentos graves.

## ✨ Funcionalidades

* **Automação de Fadiga:** O módulo detecta a perda de HP e aplica automaticamente o nível de exaustão correspondente na ficha do personagem.
* **Alertas Privados no Chat:** Sempre que o nível de fadiga aumenta, o jogador (e o Mestre) recebem um sussurro privado no chat detalhando as penalidades mecânicas cumulativas, mantendo a tela dos outros jogadores limpa.
* **Registro na Ficha (Item de Condição):** O script cria e atualiza automaticamente uma Característica chamada "Condição: Ferimento Grave" na ficha do jogador, servindo como um lembrete acessível de todas as desvantagens que ele está sofrendo no momento.
* **Menu de Configuração do Mestre:** Permite ligar/desligar o módulo facilmente e customizar as porcentagens exatas de HP necessárias para ativar cada um dos 5 níveis de fadiga.

## 🔗 Como Instalar

Para instalar este módulo no seu mundo do Foundry VTT, siga os passos abaixo usando o nosso **Link de Manifesto**:

1. Abra o Foundry VTT na tela inicial de configuração.
2. Acesse a aba **Módulos Adicionais** (Add-on Modules).
3. Clique no botão **Instalar Módulo** (Install Module).
4. Role a janela até o final para encontrar o campo **URL de Manifesto** (Manifest URL).
5. Cole o link abaixo:
   
https://raw.githubusercontent.com/kauecardinalli/Fadiga-por-Dano-Foundry-VTT/main/module.json

_________________________________________________

📜 Regras Padrão de Punição
Por padrão, os níveis de exaustão são aplicados de forma cumulativa com base na seguinte tabela de HP restante (estes valores podem ser alterados pelo Mestre nas configurações do módulo):

80% de HP ou menos (Nível 1): Desvantagem em todos os testes de Habilidade.

64% de HP ou menos (Nível 2): Deslocamento reduzido pela metade.

30% de HP ou menos (Nível 3): Desvantagem nas jogadas de Ataque e testes de Resistência.

19% de HP ou menos (Nível 4): Pontos de Vida (HP) máximos reduzidos pela metade.

9% de HP ou menos (Nível 5): Deslocamento reduzido a zero (personagem fica prostrado).

🛠️ Compatibilidade
Foundry VTT: Versão 12 ou superior (Verificado na v13).

Sistema: Dungeons & Dragons Fifth Edition (v5.3.3+).

Desenvolvido por Kauê Cardinalli
