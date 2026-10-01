function classeBadge(statut) {
    if (statut === 'livree') return 'livree';
    if (statut === 'annulee') return 'annulee';
    if (['en_livraison', 'attribuee', 'en_preparation'].includes(statut)) return 'cours';
    return 'attente';
}

async function chargerCategoriesDansSelect(idSelect) {
    const select = document.getElementById(idSelect);
    if (!select) return;
    const { categories } = await API.categories();
    categories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat.id;
        option.textContent = cat.nom;
        select.appendChild(option);
    });
}

// --- Tableau de bord ---
async function initDashboard() {
    try {
        const d = await API.merchant.stats();
        document.getElementById('nom-boutique').textContent = d.boutique.nom_boutique;
        document.getElementById('message-bienvenue').textContent = 'Voici un aperçu de votre activité.';
        document.getElementById('stat-produits').textContent = d.nb_produits;
        document.getElementById('stat-attente').textContent = d.nb_commandes_attente;
        document.getElementById('stat-ventes').textContent = formaterPrix(d.total_ventes);

        const corps = document.getElementById('corps-tableau-commandes');
        if (d.dernieres_commandes.length === 0) {
            corps.innerHTML = '<tr><td colspan="6" style="color:var(--texte-att)">Aucune commande reçue pour le moment.</td></tr>';
            return;
        }
        corps.innerHTML = d.dernieres_commandes.map(cmd => `
            <tr>
                <td>#${cmd.id}</td>
                <td>${cmd.nom_client}</td>
                <td>${cmd.quartier_livraison || ''}</td>
                <td>${formaterPrix(cmd.montant_total)}</td>
                <td><span class="badge badge-${classeBadge(cmd.statut)}">${libelleStatutJs(cmd.statut)}</span></td>
                <td>${formaterDate(cmd.date_commande)}</td>
            </tr>
        `).join('');
    } catch (e) {
        document.getElementById('nom-boutique').textContent = 'Erreur';
        document.getElementById('message-bienvenue').textContent = e.message;
    }
}

function libelleStatutJs(statut) {
    const labels = {
        en_attente: 'En attente', confirmee: 'Confirmée', en_preparation: 'En préparation',
        attribuee: 'Attribuée à un livreur', en_livraison: 'En cours de livraison',
        livree: 'Livrée', annulee: 'Annulée',
    };
    return labels[statut] || statut;
}

// --- Liste des produits ---
async function initListeProduits() {
    const grille = document.getElementById('grille-produits');
    try {
        const { produits } = await API.merchant.produits();
        document.getElementById('nb-produits-texte').textContent = `${produits.length} produit(s) au total.`;

        if (produits.length === 0) {
            grille.innerHTML = '<p style="color:var(--texte-att)">Vous n\'avez ajouté aucun produit pour le moment.</p>';
            return;
        }

        grille.innerHTML = produits.map(p => `
            <div class="carte-produit">
                <img src="${p.photo ? '/uploads/produits/' + p.photo : 'https://placehold.co/400x300/121B2E/8C97AE?text=IRA+EXPRESS'}" alt="${p.nom}">
                <div class="carte-produit-corps">
                    <h3>${p.nom}</h3>
                    <p style="color:var(--texte-att);font-size:0.82rem;margin-bottom:6px">${p.nom_categorie} · Stock : ${p.stock}</p>
                    <div class="prix">${formaterPrix(p.prix)}</div>
                    <div class="carte-produit-actions">
                        <a href="/merchant/modifier_produit.html?id=${p.id}" class="btn btn-secondaire btn-petit">Modifier</a>
                        <button type="button" class="btn btn-danger btn-petit" onclick="supprimerProduit(${p.id})">Supprimer</button>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (e) {
        grille.innerHTML = `<p class="message-erreur">${e.message}</p>`;
    }
}

async function supprimerProduit(id) {
    if (!confirm('Supprimer définitivement ce produit ?')) return;
    try {
        await API.merchant.supprimerProduit(id);
        initListeProduits();
    } catch (e) {
        alert(e.message);
    }
}

// --- Ajout de produit ---
async function initAjouterProduit() {
    await chargerCategoriesDansSelect('categorie_id');

    document.getElementById('form-ajouter-produit').addEventListener('submit', async (e) => {
        e.preventDefault();
        const zoneMessage = document.getElementById('zone-message');
        try {
            let nomPhoto = null;
            const fichier = document.getElementById('photo').files[0];
            if (fichier) {
                const formData = new FormData();
                formData.append('photo', fichier);
                const resultat = await API.upload('/api/upload.php', formData);
                nomPhoto = resultat.nom_fichier;
            }

            await API.merchant.ajouterProduit({
                nom: document.getElementById('nom').value,
                categorie_id: document.getElementById('categorie_id').value,
                description: document.getElementById('description').value,
                prix: document.getElementById('prix').value,
                stock: document.getElementById('stock').value,
                photo: nomPhoto,
            });
            window.location.href = '/merchant/produits.html';
        } catch (err) {
            zoneMessage.innerHTML = `<p class="message-erreur">${err.message}</p>`;
        }
    });
}

// --- Modification de produit ---
async function initModifierProduit() {
    const params = new URLSearchParams(window.location.search);
    const produitId = params.get('id');
    if (!produitId) {
        window.location.href = '/merchant/produits.html';
        return;
    }

    await chargerCategoriesDansSelect('categorie_id');

    const { produits } = await API.merchant.produits();
    const produit = produits.find(p => String(p.id) === produitId);
    if (!produit) {
        window.location.href = '/merchant/produits.html';
        return;
    }

    document.getElementById('titre-page').textContent = `Modifier « ${produit.nom} » — IRA EXPRESS`;
    document.getElementById('titre-h1').textContent = `Modifier « ${produit.nom} »`;
    document.getElementById('produit_id').value = produit.id;
    document.getElementById('nom').value = produit.nom;
    document.getElementById('categorie_id').value = produit.categorie_id;
    document.getElementById('description').value = produit.description || '';
    document.getElementById('prix').value = produit.prix;
    document.getElementById('stock').value = produit.stock;
    document.getElementById('statut').value = produit.statut;

    document.getElementById('btn-stock-moins').addEventListener('click', () => {
        const input = document.getElementById('stock');
        input.value = Math.max(0, parseInt(input.value || 0, 10) - 1);
    });
    document.getElementById('btn-stock-plus').addEventListener('click', () => {
        const input = document.getElementById('stock');
        input.value = parseInt(input.value || 0, 10) + 1;
    });

    document.getElementById('form-modifier-produit').addEventListener('submit', async (e) => {
        e.preventDefault();
        const zoneMessage = document.getElementById('zone-message');
        try {
            let nomPhoto = null;
            const fichier = document.getElementById('photo').files[0];
            if (fichier) {
                const formData = new FormData();
                formData.append('photo', fichier);
                const resultat = await API.upload('/api/upload.php', formData);
                nomPhoto = resultat.nom_fichier;
            }

            await API.merchant.modifierProduit({
                id: produit.id,
                nom: document.getElementById('nom').value,
                categorie_id: document.getElementById('categorie_id').value,
                description: document.getElementById('description').value,
                prix: document.getElementById('prix').value,
                stock: document.getElementById('stock').value,
                statut: document.getElementById('statut').value,
                photo: nomPhoto,
            });
            window.location.href = '/merchant/produits.html';
        } catch (err) {
            zoneMessage.innerHTML = `<p class="message-erreur">${err.message}</p>`;
        }
    });
}

// --- Commandes reçues ---
async function initCommandesRecues() {
    const corps = document.getElementById('corps-tableau-commandes');
    try {
        const { commandes } = await API.merchant.commandes();
        document.getElementById('nb-commandes-texte').textContent = `${commandes.length} commande(s) au total.`;

        if (commandes.length === 0) {
            corps.innerHTML = '<tr><td colspan="8" style="color:var(--texte-att)">Aucune commande pour le moment.</td></tr>';
            return;
        }

        corps.innerHTML = commandes.map(cmd => {
            let actions = '<span style="color:var(--texte-att);font-size:0.85rem">—</span>';
            if (cmd.statut === 'en_attente') {
                actions = `
                    <div style="display:flex;gap:6px">
                        <button class="btn btn-principal btn-petit" onclick="changerStatutCommande(${cmd.id},'confirmee')">Confirmer</button>
                        <button class="btn btn-danger btn-petit" onclick="changerStatutCommande(${cmd.id},'annulee')">Annuler</button>
                    </div>`;
            } else if (cmd.statut === 'confirmee') {
                actions = `<button class="btn btn-secondaire btn-petit" onclick="changerStatutCommande(${cmd.id},'en_preparation')">Mettre en préparation</button>`;
            }
            return `
                <tr>
                    <td>#${cmd.id}</td>
                    <td>${cmd.nom_client}</td>
                    <td>${cmd.telephone_contact}</td>
                    <td>${cmd.quartier_livraison || ''}</td>
                    <td>${formaterPrix(cmd.montant_total)}</td>
                    <td><span class="badge badge-${classeBadge(cmd.statut)}">${cmd.statut_libelle}</span></td>
                    <td>${formaterDate(cmd.date_commande)}</td>
                    <td>${actions}</td>
                </tr>`;
        }).join('');
    } catch (e) {
        corps.innerHTML = `<tr><td colspan="8" class="message-erreur">${e.message}</td></tr>`;
    }
}

async function changerStatutCommande(id, statut) {
    if (statut === 'annulee' && !confirm('Annuler cette commande ?')) return;
    try {
        await API.merchant.commandeStatut(id, statut);
        initCommandesRecues();
    } catch (e) {
        alert(e.message);
    }
}

// --- Ventes ---
async function initVentes() {
    try {
        const d = await API.merchant.ventes();
        document.getElementById('stat-nb-ventes').textContent = d.ventes.length;
        document.getElementById('stat-ca').textContent = formaterPrix(d.total_ventes);
        document.getElementById('stat-top-produit').textContent = d.top_produits.length ? d.top_produits[0].nom : '—';

        const corps = document.getElementById('corps-tableau-ventes');
        if (d.ventes.length === 0) {
            corps.innerHTML = '<tr><td colspan="4" style="color:var(--texte-att)">Aucune vente livrée pour le moment.</td></tr>';
            return;
        }
        corps.innerHTML = d.ventes.map(v => `
            <tr>
                <td>#${v.id}</td>
                <td>${v.nom_client}</td>
                <td>${formaterPrix(v.montant_total)}</td>
                <td>${formaterDate(v.date_commande)}</td>
            </tr>
        `).join('');
    } catch (e) {
        document.getElementById('corps-tableau-ventes').innerHTML = `<tr><td colspan="4" class="message-erreur">${e.message}</td></tr>`;
    }
}

// --- Point d'entrée : détecte la page en cours d'après les éléments présents ---
document.addEventListener('DOMContentLoaded', async () => {
    const utilisateur = await exigerRoleCote('commercant');
    if (!utilisateur) return;

    if (document.getElementById('form-modifier-produit')) {
        initModifierProduit();
    } else if (document.getElementById('grille-produits')) {
        initListeProduits();
    } else if (document.getElementById('form-ajouter-produit')) {
        initAjouterProduit();
    } else if (document.getElementById('corps-tableau-commandes') && document.body.dataset.page === 'commandes') {
        initCommandesRecues();
    } else if (document.getElementById('corps-tableau-ventes')) {
        initVentes();
    } else if (document.body.dataset.page === 'dashboard') {
        initDashboard();
    }
});