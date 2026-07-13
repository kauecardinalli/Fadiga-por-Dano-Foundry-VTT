// -----------------------------------------------------------------------
// 1. REGISTRO DAS CONFIGURAÇÕES NO MENU DO FOUNDRY
// -----------------------------------------------------------------------
Hooks.once("init", () => {
    console.log("Fadiga por Dano | Inicializando módulo e registrando configurações...");

    game.settings.register("fadiga-por-dano", "moduloAtivo", {
        name: "Ativar Punição de Fadiga",
        hint: "Ativa ou desativa as regras deste módulo para todo o mundo.",
        scope: "world",
        config: true,
        type: Boolean,
        default: true
    });

    game.settings.register("fadiga-por-dano", "limiteNivel1", {
        name: "Fadiga Nível 1 (%)",
        hint: "Abaixo desta porcentagem de HP, o personagem ganha Nível 1 de Fadiga.",
        scope: "world",
        config: true,
        type: Number,
        default: 80
    });

    game.settings.register("fadiga-por-dano", "limiteNivel2", {
        name: "Fadiga Nível 2 (%)",
        hint: "Abaixo desta porcentagem de HP, o personagem ganha Nível 2 de Fadiga.",
        scope: "world",
        config: true,
        type: Number,
        default: 64
    });

    game.settings.register("fadiga-por-dano", "limiteNivel3", {
        name: "Fadiga Nível 3 (%)",
        hint: "Abaixo desta porcentagem de HP, o personagem ganha Nível 3 de Fadiga.",
        scope: "world",
        config: true,
        type: Number,
        default: 30
    });

    game.settings.register("fadiga-por-dano", "limiteNivel4", {
        name: "Fadiga Nível 4 (%)",
        hint: "Abaixo desta porcentagem de HP, o personagem ganha Nível 4 de Fadiga.",
        scope: "world",
        config: true,
        type: Number,
        default: 19
    });

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
// 2. LÓGICA DE DANO E APLICAÇÃO DE FADIGA CUMULATIVA
// -----------------------------------------------------------------------
Hooks.on("updateActor", async (actor, changes, options, userId) => {
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

    const lim1 = game.settings.get("fadiga-por-dano", "limiteNivel1");
    const lim2 = game.settings.get("fadiga-por-dano", "limiteNivel2");
    const lim3 = game.settings.get("fadiga-por-dano", "limiteNivel3");
    const lim4 = game.settings.get("fadiga-por-dano", "limiteNivel4");
    const lim5 = game.settings.get("fadiga-por-dano", "limiteNivel5");

    let fadigaAlvo = 0;

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
        // Atualiza o nível mecânico na ficha
        await actor.update({ "system.attributes.exhaustion": novaFadiga });
        
        ui.notifications.warn(`Alerta de Ferimento: ${actor.name} recebeu o Nível ${novaFadiga} de Fadiga!`);

        // 1. Define todas as descrições possíveis
        const descricoesFadiga = [
            "<strong>Nível 1:</strong> Desvantagem em todos os testes de Habilidade.",
            "<strong>Nível 2:</strong> Deslocamento reduzido pela metade.",
            "<strong>Nível 3:</strong> Desvantagem nas jogadas de Ataque e testes de Resistência.",
            "<strong>Nível 4:</strong> Pontos de Vida (HP) máximos reduzidos pela metade.",
            "<strong>Nível 5:</strong> Deslocamento reduzido a zero (personagem fica prostrado)."
        ];

        // 2. Cria a lista cumulativa (pega do Nível 1 até o nível atual)
        let listaEfeitos = "<ul style='margin: 0; padding-left: 20px;'>";
        for (let i = 0; i < novaFadiga; i++) {
            listaEfeitos += `<li style='margin-bottom: 4px;'>${descricoesFadiga[i]}</li>`;
        }
        listaEfeitos += "</ul>";

        // -------------------------------------------------------------------
        // 3. INTEGRAÇÃO COM A FICHA DO JOGADOR (Criação de Item Informativo)
        // -------------------------------------------------------------------
        const nomeItemFadiga = "Condição: Ferimento Grave";
        let itemFadiga = actor.items.find(i => i.name === nomeItemFadiga);
        
        // O texto limpo e formatado que vai ficar dentro do item na ficha
        const descricaoItem = `
            <p>Seu personagem sofreu ferimentos graves. Atualmente você está com <strong>Fadiga Nível ${novaFadiga}</strong>.</p>
            <p>Você sofre as seguintes penalidades cumulativas:</p>
            ${listaEfeitos}
            <hr>
            <p><em>Nota: Esta condição só poderá ser reduzida através de um Descanso Longo. Curas mágicas ou poções restauram Pontos de Vida, mas não removem esta exaustão.</em></p>
        `;

        if (itemFadiga) {
            // Se o item já existir na ficha, apenas atualiza o texto dele
            await itemFadiga.update({ "system.description.value": descricaoItem });
        } else {
            // Se não existir, cria o item silenciosamente na aba "Características"
            await actor.createEmbeddedDocuments("Item", [{
                name: nomeItemFadiga,
                type: "feat", // Tipo "Característica" para o 5e
                img: "icons/skills/wounds/blood-drip-droplet-red.webp", // Um ícone de sangue padrão do Foundry
                system: {
                    description: { value: descricaoItem },
                    activation: { type: "none" }
                }
            }]);
        }

        // -------------------------------------------------------------------
        // 4. AVISO NO CHAT
        // -------------------------------------------------------------------
        const donosDoActor = game.users.filter(u => actor.testUserPermission(u, "OWNER")).map(u => u.id);
        const mestres = game.users.filter(u => u.isGM).map(u => u.id);
        const alvosSussurro = [...new Set([...donosDoActor, ...mestres])];

        const conteudoChat = `
            <div class="dnd5e chat-card item-card">
                <header class="card-header flexrow">
                    <h3 class="item-name" style="color: #8a1f1f; margin: 0;">Fadiga por Ferimento Grave!</h3>
                </header>
                <div class="card-content" style="margin-top: 8px; font-size: 13px;">
                    <p>O nível de exaustão de <strong>${actor.name}</strong> subiu para <strong>${novaFadiga}</strong>.</p>
                    <p>Penalidades atuais acumuladas:</p>
                    <div style="background: rgba(138, 31, 31, 0.1); padding: 8px; border-radius: 4px; border-left: 3px solid #8a1f1f;">
                        ${listaEfeitos}
                    </div>
                    <span style="font-size: 10px; color: #666; display: block; margin-top: 8px; font-style: italic;">
                        *Um resumo desta condição foi adicionado à aba de Características da sua ficha.
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
