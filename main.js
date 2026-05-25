Hooks.on("updateActor", async (actor, changes, options, userId) => {
    // 1. Apenas o usuário que disparou a alteração (ou o Mestre) processa o código
    if (game.user.id !== userId) return;

    // 2. Verifica se houve alteração nos Pontos de Vida (HP)
    const novoHP = changes?.system?.attributes?.hp?.value;
    if (novoHP === undefined) return;

    // 3. Aplica apenas aos personagens dos jogadores (ignora monstros/NPCs)
    if (actor.type !== "character") return;

    const maxHP = actor.system.attributes.hp.max;
    if (maxHP === 0) return;

    const hpAtual = novoHP;
    const fadigaAtual = actor.system.attributes.exhaustion || 0;

    // 4. Calcula a porcentagem de vida restante
    const porcentagem = Math.round((hpAtual / maxHP) * 100);

    let fadigaAlvo = 0;

    // 5. Tabela de regras de exaustão
    if (porcentagem <= 9) {
        fadigaAlvo = 5;
    } else if (porcentagem <= 19) {
        fadigaAlvo = 4;
    } else if (porcentagem <= 30) {
        fadigaAlvo = 3;
    } else if (porcentagem <= 64) {
        fadigaAlvo = 2;
    } else if (porcentagem <= 80) {
        fadigaAlvo = 1;
    }

    // A cura não remove a fadiga, mantém-se o maior valor
    const novaFadiga = Math.max(fadigaAtual, fadigaAlvo);

    // 6. Se a fadiga tiver que aumentar, atualizamos e enviamos o aviso
    if (novaFadiga > fadigaAtual) {
        await actor.update({ "system.attributes.exhaustion": novaFadiga });
        
        // Alerta flutuante na tela (UI)
        ui.notifications.warn(`Alerta de Ferimento: ${actor.name} recebeu o Nível ${novaFadiga} de Fadiga!`);

        // 7. Define o texto do efeito baseado no nível atingido
        let efeitoTexto = "";
        switch (novaFadiga) {
            case 1:
                efeitoTexto = "<strong>Nível 1:</strong> Desvantagem em todos os testes de Habilidade.";
                break;
            case 2:
                efeitoTexto = "<strong>Nível 2:</strong> Deslocamento reduzido pela metade.";
                break;
            case 3:
                efeitoTexto = "<strong>Nível 3:</strong> Desvantagem nas jogadas de Ataque e testes de Resistência.";
                break;
            case 4:
                efeitoTexto = "<strong>Nível 4:</strong> Pontos de Vida (HP) máximos reduzidos pela metade.";
                break;
            case 5:
                efeitoTexto = "<strong>Nível 5:</strong> Deslocamento reduzido a zero (personagem fica prostrado).";
                break;
        }

        // 8. Identifica quem são os donos da ficha (jogadores) e os Mestres (GMs)
        const donos DoActor = game.users.filter(u => actor.testUserPermission(u, "OWNER")).map(u => u.id);
        const mestres = game.users.filter(u => u.isGM).map(u => u.id);
        
        // Junta todos em uma lista única de alvos para o sussurro (evitando duplicatas)
        const alvosSussurro = [...new Set([...donosDoActor, ...mestres])];

        // 9. Monta o visual da mensagem de chat usando os estilos nativos do D&D 5e
        const conteudoChat = `
            <div class="dnd5e chat-card item-card">
                <header class="card-header flexrow">
                    <img src="${actor.img}" title="${actor.name}" width="36" height="36" style="border: none; border-radius: 4px;"/>
                    <h3 class="item-name" style="color: #8a1f1f;">Fadiga por Ferimento Grave!</h3>
                </header>
                <div class="card-content" style="margin-top: 8px; font-size: 13px;">
                    <p>O nível de exaustão de <strong>${actor.name}</strong> subiu para <strong>${novaFadiga}</strong> devido aos danos sofridos.</p>
                    <hr>
                    <p style="background: rgba(138, 31, 31, 0.1); padding: 6px; border-radius: 4px; border-left: 3px solid #8a1f1f;">
                        ${efeitoTexto}
                    </p>
                    <span style="font-size: 10px; color: #666; display: block; margin-top: 5px; font-style: italic;">
                        *Nota: Esta fadiga só poderá ser reduzida através de um Descanso Longo. Curas normais não anulam o efeito.
                    </span>
                </div>
            </div>
        `;

        // 10. Cria e envia a mensagem de chat oculta
        await ChatMessage.create({
            content: conteudoChat,
            whisper: alvosSussurro,
            speaker: ChatMessage.getSpeaker({ actor: actor })
        });
    }
});
