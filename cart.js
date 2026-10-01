const CLE_PANIER = 'ira_express_panier';

function lirePanier() {
    try {
        return JSON.parse(localStorage.getItem(CLE_PANIER)) || [];
    } catch (e) {
        return [];
    }
}

function ecrirePanier(panier) {
    localStorage.setItem(CLE_PANIER, JSON.stringify(panier));
    mettreAJourCompteurPanier();
}

function ajouterAuPanier(produitId, nom, prix, boutiqueId) {
    const panier = lirePanier();
    const existant = panier.find(p => p.id === produitId);
    if (existant) {
        existant.quantite += 1;
    } else {
        panier.push({ id: produitId, nom, prix, boutiqueId, quantite: 1 });
    }
    ecrirePanier(panier);
    afficherToast(`${nom} ajouté au panier`);
}

function retirerDuPanier(produitId) {
    ecrirePanier(lirePanier().filter(p => p.id !== produitId));
    if (document.getElementById('liste-panier')) afficherPanier();
}

function changerQuantite(produitId, delta) {
    const panier = lirePanier();
    const item = panier.find(p => p.id === produitId);
    if (!item) return;
    item.quantite += delta;
    if (item.quantite <= 0) {
        retirerDuPanier(produitId);
        return;
    }
    ecrirePanier(panier);
    afficherPanier();
}

function mettreAJourCompteurPanier() {
    const compteur = document.getElementById('compteur-panier');
    if (!compteur) return;
    const total = lirePanier().reduce((n, p) => n + p.quantite, 0);
    compteur.textContent = total;
    compteur.style.display = total > 0 ? 'inline-flex' : 'none';
}

function afficherPanier() {
    const conteneur = document.getElementById('liste-panier');
    const totalEl = document.getElementById('total-panier');
    if (!conteneur) return;

    const panier = lirePanier();
    if (panier.length === 0) {
        conteneur.innerHTML = '<p style="color:var(--texte-att)">Votre panier est vide pour le moment.</p>';
        if (totalEl) totalEl.textContent = formaterPrix(0);
        return;
    }

    let total = 0;
    conteneur.innerHTML = panier.map(item => {
        total += item.prix * item.quantite;
        return `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:14px 0;border-bottom:1px solid rgba(255,255,255,0.06)">
                <div>
                    <strong>${item.nom}</strong>
                    <div style="color:var(--texte-att);font-size:0.85rem">${formaterPrix(item.prix)} l'unité</div>
                </div>
                <div style="display:flex;align-items:center;gap:10px">
                    <button type="button" class="btn btn-secondaire btn-petit" onclick="changerQuantite(${item.id}, -1)">−</button>
                    <span>${item.quantite}</span>
                    <button type="button" class="btn btn-secondaire btn-petit" onclick="changerQuantite(${item.id}, 1)">+</button>
                    <button type="button" class="btn btn-danger btn-petit" onclick="retirerDuPanier(${item.id})">Retirer</button>
                </div>
            </div>`;
    }).join('');

    if (totalEl) totalEl.textContent = formaterPrix(total);
}

function afficherToast(message) {
    let toast = document.getElementById('ira-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'ira-toast';
        toast.style.cssText = `
            position:fixed;bottom:24px;left:50%;transform:translateX(-50%) translateY(20px);
            background:#121B2E;border:1px solid rgba(45,217,232,0.4);color:#E7ECF6;
            padding:12px 22px;border-radius:999px;font-size:0.9rem;z-index:999;
            opacity:0;transition:opacity .2s ease, transform .2s ease;`;
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    requestAnimationFrame(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(-50%) translateY(0)';
    });
    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(-50%) translateY(20px)';
    }, 2200);
}