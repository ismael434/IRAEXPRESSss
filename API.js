const API = {
    async _requete(url, options = {}) {
        const reponse = await fetch(url, {
            credentials: 'same-origin', // envoie le cookie de session PHP
            headers: { 'Content-Type': 'application/json' },
            ...options,
        });
        const donnees = await reponse.json().catch(() => ({ ok: false, erreur: 'Réponse invalide du serveur.' }));
        if (!reponse.ok || !donnees.ok) {
            throw new Error(donnees.erreur || 'Une erreur est survenue.');
        }
        return donnees;
    },

    get(url) {
        return this._requete(url, { method: 'GET' });
    },

    post(url, corps = {}) {
        return this._requete(url, { method: 'POST', body: JSON.stringify(corps) });
    },

    // Upload de fichier : nécessite FormData, donc pas de Content-Type JSON ici
    async upload(url, formData) {
        const reponse = await fetch(url, { method: 'POST', credentials: 'same-origin', body: formData });
        const donnees = await reponse.json().catch(() => ({ ok: false, erreur: 'Réponse invalide du serveur.' }));
        if (!reponse.ok || !donnees.ok) {
            throw new Error(donnees.erreur || "Erreur lors de l'envoi du fichier.");
        }
        return donnees;
    },

    // --- Endpoints publics ---
    categories: () => API.get('/api/categories.php'),
    produits: (slug) => API.get('/api/produits.php?slug=' + encodeURIComponent(slug)),
    session: () => API.get('/api/session.php'),
    login: (telephone, mot_de_passe) => API.post('/api/login.php', { telephone, mot_de_passe }),
    logout: () => API.post('/api/logout.php'),
    register: (donnees) => API.post('/api/register.php', donnees),
    commander: (donnees) => API.post('/api/commander.php', donnees),

    // --- Endpoints commerçant ---
    merchant: {
        stats: () => API.get('/api/merchant.php?action=stats'),
        produits: () => API.get('/api/merchant.php?action=produits'),
        ajouterProduit: (d) => API.post('/api/merchant.php?action=produit_ajouter', d),
        modifierProduit: (d) => API.post('/api/merchant.php?action=produit_modifier', d),
        supprimerProduit: (id) => API.post('/api/merchant.php?action=produit_supprimer', { id }),
        commandes: () => API.get('/api/merchant.php?action=commandes'),
        commandeStatut: (id, statut) => API.post('/api/merchant.php?action=commande_statut', { id, statut }),
        ventes: () => API.get('/api/merchant.php?action=ventes'),
    },

    // --- Endpoints livreur ---
    delivery: {
        stats: () => API.get('/api/delivery.php?action=stats'),
        disponibilite: (disponible) => API.post('/api/delivery.php?action=disponibilite', { disponible }),
        disponibles: () => API.get('/api/delivery.php?action=disponibles'),
        mesCommandes: () => API.get('/api/delivery.php?action=mes_commandes'),
        prendre: (id) => API.post('/api/delivery.php?action=prendre', { id }),
        statut: (id, statut) => API.post('/api/delivery.php?action=statut', { id, statut }),
    },
};