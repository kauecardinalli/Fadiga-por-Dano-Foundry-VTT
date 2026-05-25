// -----------------------------------------------------------------------
// 1. REGISTRO DAS CONFIGURAÇÕES NO MENU DO FOUNDRY
// -----------------------------------------------------------------------
Hooks.once("init", () => {
    console.log("Fadiga por Dano | Inicializando módulo e registrando configurações...");

    // Chave geral Liga/Desliga
    game.settings.register("fadiga-por-dano", "moduloAtivo", {
        name: "Ativar Punição de Fadiga",
        hint: "Ativa ou desativa as regras deste módulo para todo o mundo.",
        scope: "world", // 'world' significa que só o Mestre pode alterar e afeta todos
        config: true,   // 'true' faz aparecer no menu de opções visualmente
        type: Boolean,
        default: true
    });

    // Porcentagem para o Nível 1
    game.settings.register("fadiga-por-dano", "limiteNivel1", {
        name: "Fadiga Nível 1 (%)",
        hint: "Abaixo desta porcentagem de HP, o personagem ganha Nível 1 de Fadiga.",
        scope: "world",
        config: true,
        type: Number,
        default: 80
    });

    // Porcentagem para o Nível 2
    game.settings.register("fadiga-por-dano", "limiteNivel2", {
        name: "Fadiga Nível 2 (%)",
        hint: "Abaixo desta porcentagem de HP, o personagem ganha Nível 2 de Fadiga.",
        scope: "world",
        config: true,
        type: Number,
        default: 64
    });

    // Porcentagem para o Nível 3
    game.settings.register("fadiga-por-dano", "limiteNivel3", {
        name: "Fadiga Nível 3 (%)",
        hint: "Abaixo desta porcentagem de HP, o personagem ganha Nível 3 de Fadiga.",
        scope: "world",
        config: true,
        type: Number,
        default: 30
    });

    // Porcentagem para o Nível 4
    game.settings.register("fadiga-por-dano", "limiteNivel4", {
        name: "Fadiga Nível 4 (%)",
        hint: "Abaixo desta porcentagem de HP, o personagem ganha Nível 4 de Fadiga.",
        scope: "world",
        config: true,
        type: Number,
        default: 19
    });

    // Porcentagem para o Nível 5
    game.settings.register("fadiga-por-dano", "limiteNivel5", {
        name: "Fadiga Nível 5 (%)",
        hint: "Abaixo desta porcentagem de HP, o personagem ganha Nível 5 de Fadiga.",
        scope: "world",
        config: true,
        type: Number,
        default: 9
    });
});

// -----------------------------------------------------------------------
// 2. LÓGICA DE DANO E APLICAÇÃO DE FADIGA
// -----------------------------------------------------------------------
Hooks.on("updateActor", async (actor, changes, options, userId) => {
    // Verifica se o módulo está ligado no painel do mestre
    if (!game.settings.get("fadiga-por-dano", "moduloAtivo")) return;

    if (game.user.id !== userId) return;

    const novoHP = changes?.system?.attributes?.hp?.value;
    if (novoHP === undefined) return;

    if (actor.type !== "character") return;

    const maxHP = actor.system.attributes.hp.max;
    if (maxHP === 0) return;

    const hpAtual = novoHP;
    const fadigaAtual = actor.system.attributes.exhaustion || 0;
    const porcentagem = Math.round((hpAtual / maxHP) * 100);

    // Busca os valores atuais definidos pelo Mestre no painel de configurações
    const lim1 = game.settings.get("fadiga-por-dano", "limiteNivel1");
    const lim2 = game.settings.get("fadiga-por-dano", "limiteNivel2");
    const lim3 = game.settings.get("fadiga-por-dano", "limiteNivel3");
    const lim4 = game.settings.get("fadiga-por-dano", "limiteNivel4");
    const lim5 = game.settings.get("fadiga-por-dano", "limiteNivel5");

    let fadigaAlvo = 0;

    // A tabela de regras agora obedece aos limites flexíveis
    if (porcentagem <= lim5) {
        fadigaAlvo = 5;
    } else if (porcentagem <= lim4) {
        fadigaAlvo = 4;
    } else if (porcentagem <= lim3) {
        fadigaAlvo = 3;
    } else if (porcentagem <= lim2) {
        fadigaAlvo = 2;
    } else if (porcentagem <= lim1) {
        fadigaAlvo = 1;
    }

    const novaFadiga = Math.max(fadigaAtual, fadigaAlvo);

    if (novaFadiga > fadigaAtual) {
        await actor.update({ "system.attributes.exhaustion": novaFadiga });
        
        ui.notifications.warn(`Alerta de Ferimento: ${actor.name} recebeu o Nível ${novaFadiga} de Fadiga!`);

        let efeitoTexto = "";
        switch (novaFadiga) {
            case 1: efeitoTexto = "<strong>Nível 1:</strong> Desvantagem em todos os testes de Habilidade."; break;
            case 2: efeitoTexto = "<strong>Nível 2:</strong> Deslocamento reduzido pela metade."; break;
            case 3: efeitoTexto = "<strong>Nível 3:</strong> Desvantagem nas jogadas de Ataque e testes de Resistência."; break;
            case 4: efeitoTexto = "<strong>Nível 4:</strong> Pontos de Vida (HP) máximos reduzidos pela metade."; break;
            case 5: efeitoTexto = "<strong>Nível 5:</strong> Deslocamento reduzido a zero (personagem fica prostrado)."; break;
        }

        const donosDoActor = game.users.filter(u => actor.testUserPermission(u, "OWNER")).map(u => u.id);
        const mestres = game.users.filter(u => u.isGM).map(u => u.id);
        const alvosSussurro = [...new Set([...donosDoActor, ...mestres])];

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

        await ChatMessage.create({
            content: conteudoChat,
            whisper: alvosSussurro,
            speaker: ChatMessage.getSpeaker({ actor: actor })
        });
    }
});
