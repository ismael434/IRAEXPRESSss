async function initDashboardLivreur(utilisateur) {
    document.getElementById('titre-bonjour').textContent = `Bonjour, ${utilisateur.nom}`;

    async function rafraichirStats() {
        const d = await API.delivery.stats();
        document.getElementById('stat-attribuees').textContent = d.nb_attribuees;
        document.getElementById('stat-livrees').textContent = d.nb_livrees;
        document.getElementById('stat-disponibles').textContent = d.nb_disponibles;

        const bouton = document.getElementById('btn-disponibilite');
        if (d.disponible) {
            bouton.textContent = '🟢 Disponible — passer indisponible';
            bouton.className = 'btn btn-secondaire';
            bouton.dataset.cible = '0';
        } else {
            bouton.textContent = '⚪ Indisponible — passer disponible';
            bouton.className = 'btn btn-principal';
            bouton.dataset.cible = '1';
        }
    }

    document.getElementById('btn-disponibilite').addEventListener('click', async function () {
        await API.delivery.disponibilite(this.dataset.cible === '1');
        rafraichirStats();
    });

    rafraichirStats();
}

async function initCommandesLivreur() {
    async function rafraichir() {
        try {
            const { commandes: disponibles } = await API.delivery.disponibles();
            const corpsDispo = document.getElementById('corps-disponibles');
            corpsDispo.innerHTML = disponibles.length === 0
                ? '<tr><td colspan="5" style="color:var(--texte-att)">Aucune commande disponible pour le moment.</td></tr>'
                : disponibles.map(cmd => `
                    <tr>
                        <td>#${cmd.id}</td>
                        <td>${cmd.nom_boutique}</td>
                        <td>${cmd.quartier_livraison || ''}</td>
                        <td>${formaterPrix(cmd.montant_total)}</td>
                        <td><button class="btn btn-principal btn-petit" onclick="prendreCommande(${cmd.id})">Prendre en charge</button></td>
                    </tr>`).join('');

            const { commandes: mesCommandes } = await API.delivery.mesCommandes();
            const corpsMes = document.getElementById('corps-mes-commandes');
            corpsMes.innerHTML = mesCommandes.length === 0
                ? '<tr><td colspan="6" style="color:var(--texte-att)">Aucune commande attribuée pour le moment.</td></tr>'
                : mesCommandes.map(cmd => {
                    let action = '<span style="color:var(--texte-att);font-size:0.85rem">—</span>';
                    if (cmd.statut === 'attribuee') {
                        action = `<button class="btn btn-secondaire btn-petit" onclick="changerStatutLivraison(${cmd.id},'en_livraison')">Départ en livraison</button>`;
                    } else if (cmd.statut === 'en_livraison') {
                        action = `<button class="btn btn-principal btn-petit" onclick="changerStatutLivraison(${cmd.id},'livree')">Marquer livrée</button>`;
                    }
                    return `
                        <tr>
                            <td>#${cmd.id}</td>
                            <td>${cmd.nom_client}</td>
                            <td>${cmd.adresse_livraison} (${cmd.quartier_livraison || ''})</td>
                            <td>${cmd.telephone_contact}</td>
                            <td><span class="badge badge-${cmd.statut === 'livree' ? 'livree' : 'cours'}">${cmd.statut_libelle}</span></td>
                            <td>${action}</td>
                        </tr>`;
                }).join('');
        } catch (e) {
            document.getElementById('corps-mes-commandes').innerHTML = `<tr><td colspan="6" class="message-erreur">${e.message}</td></tr>`;
        }
    }

    window.prendreCommande = async (id) => { await API.delivery.prendre(id); rafraichir(); };
    window.changerStatutLivraison = async (id, statut) => { await API.delivery.statut(id, statut); rafraichir(); };

    rafraichir();
}

document.addEventListener('DOMContentLoaded', async () => {
    const utilisateur = await exigerRoleCote('livreur');
    if (!utilisateur) return;

    if (document.getElementById('btn-disponibilite')) initDashboardLivreur(utilisateur);
    if (document.getElementById('corps-disponibles')) initCommandesLivreur();
});