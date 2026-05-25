Hooks.on("updateActor", async (actor, changes, options, userId) => {
    // 1. Apenas o usuário que sofreu o dano (ou o Mestre) processa o código, evitando duplicação
    if (game.user.id !== userId) return;

    // 2. Verifica se houve alteração nos Pontos de Vida (HP)
    const novoHP = changes?.system?.attributes?.hp?.value;
    if (novoHP === undefined) return;

    // 3. Aplica apenas aos personagens dos jogadores (ignora monstros/NPCs)
    if (actor.type !== "character") return;

    const maxHP = actor.system.attributes.hp.max;
    if (maxHP === 0) return; // Evita erros de divisão por zero caso o HP máximo seja 0

    const hpAtual = novoHP;
    const fadigaAtual = actor.system.attributes.exhaustion || 0;

    // 4. Calcula a porcentagem exata de vida restante (arredondando para o inteiro mais próximo)
    const porcentagem = Math.round((hpAtual / maxHP) * 100);

    let fadigaAlvo = 0;

    // 5. Tabela de regras de exaustão baseada nas suas métricas
    if (porcentagem <= 9) { // 9% a 0%
        fadigaAlvo = 5;
    } else if (porcentagem <= 19) { // 19% a 10%
        fadigaAlvo = 4;
    } else if (porcentagem <= 30) { // 30% a 20%
        fadigaAlvo = 3;
    } else if (porcentagem <= 64) { // 64% a 31% (Cobri a lacuna dos 44-31 aqui para manter o Nível 2)
        fadigaAlvo = 2;
    } else if (porcentagem <= 80) { // 80% a 65%
        fadigaAlvo = 1;
    }

    // 6. A regra principal: A fadiga NÃO diminui com cura. 
    // Pegamos sempre o maior valor entre a fadiga que ele já tem e a que o dano causou.
    const novaFadiga = Math.max(fadigaAtual, fadigaAlvo);

    // 7. Se a fadiga tiver que aumentar, nós atualizamos a ficha
    if (novaFadiga > fadigaAtual) {
        await actor.update({ "system.attributes.exhaustion": novaFadiga });
        
        // Dispara um aviso na tela para todo mundo ver o estrago
        ui.notifications.warn(`Alerta de Ferimento: ${actor.name} recebeu o Nível ${novaFadiga} de Fadiga devido à perda de sangue!`);
    }
});