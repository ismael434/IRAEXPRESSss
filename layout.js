async function chargerPartiel(url, idCible) {
    const cible = document.getElementById(idCible);
    if (!cible) return;
    const reponse = await fetch(url);
    cible.outerHTML = await reponse.text();
}

async function initMiseEnPage() {
    if (document.getElementById('entete-inclusion')) {
        await chargerPartiel('/partials/header.html', 'entete-inclusion');
    }
    if (document.getElementById('pied-inclusion')) {
        await chargerPartiel('/partials/footer.html', 'pied-inclusion');
        const anneeEl = document.getElementById('footer-annee-texte');
        if (anneeEl) {
            anneeEl.textContent = `© ${new Date().getFullYear()} IRA EXPRESS — Agadez. Votre partenaire de tous les jours.`;
        }
    }
    if (document.getElementById('barre-laterale-inclusion')) {
        const type = document.body.dataset.sidebar; // "merchant" ou "delivery"
        const fichier = type === 'delivery' ? 'sidebar_delivery.html' : 'sidebar_merchant.html';
        await chargerPartiel('/partials/' + fichier, 'barre-laterale-inclusion');

        // Marque le lien actif selon la page en cours (data-page sur <body>)
        const pageActive = document.body.dataset.page;
        document.querySelectorAll('.lien-nav[data-page]').forEach(lien => {
            if (lien.dataset.page === pageActive) lien.classList.add('actif');
        });

        const lienDeco = document.getElementById('lien-deconnexion');
        if (lienDeco) {
            lienDeco.addEventListener('click', async (e) => {
                e.preventDefault();
                await API.logout();
                window.location.href = '/index.html';
            });
        }
    }

    await mettreAJourZoneConnexion();
}

async function mettreAJourZoneConnexion() {
    const zone = document.getElementById('zone-actions-entete');
    if (!zone) return;

    try {
        const { connecte, utilisateur } = await API.session();
        const compteurPanier = `<span id="compteur-panier" style="display:none;background:var(--cyan);color:#08131f;border-radius:999px;padding:1px 8px;font-size:0.75rem;margin-left:4px;">0</span>`;

        if (connecte) {
            let lienEspace = '';
            if (utilisateur.role === 'commercant') {
                lienEspace = `<a href="/merchant/dashboard.html" class="btn btn-secondaire btn-petit">Mon espace</a>`;
            } else if (utilisateur.role === 'livreur') {
                lienEspace = `<a href="/delivery/dashboard.html" class="btn btn-secondaire btn-petit">Mon espace</a>`;
            } else {
                lienEspace = `<a href="/panier.html" class="btn btn-secondaire btn-petit">Panier ${compteurPanier}</a>`;
            }
            zone.innerHTML = lienEspace + `<a href="#" id="lien-deconnexion-entete" class="btn btn-principal btn-petit">Déconnexion</a>`;

            document.getElementById('lien-deconnexion-entete')?.addEventListener('click', async (e) => {
                e.preventDefault();
                await API.logout();
                window.location.href = '/index.html';
            });
        } else {
            zone.innerHTML = `
                <a href="/panier.html" class="btn btn-secondaire btn-petit">Panier ${compteurPanier}</a>
                <a href="/auth/login.html" class="btn btn-principal btn-petit">Connexion</a>
            `;
        }

        if (typeof mettreAJourCompteurPanier === 'function') mettreAJourCompteurPanier();
    } catch (e) {
        // Si la session ne peut pas être vérifiée, on affiche l'état "non connecté" par défaut
        zone.innerHTML = `<a href="/auth/login.html" class="btn btn-principal btn-petit">Connexion</a>`;
    }
}

/** Redirige vers la connexion si l'utilisateur n'a pas le bon rôle. Renvoie l'utilisateur si ok. */
async function exigerRoleCote(role) {
    try {
        const { connecte, utilisateur } = await API.session();
        if (!connecte || utilisateur.role !== role) {
            window.location.href = '/auth/login.html';
            return null;
        }
        return utilisateur;
    } catch (e) {
        window.location.href = '/auth/login.html';
        return null;
    }
}

function formaterPrix(valeur) {
    return new Intl.NumberFormat('fr-FR').format(valeur) + ' FCFA';
}

function formaterDate(dateStr) {
    const d = new Date(dateStr.replace(' ', 'T'));
    return d.toLocaleDateString('fr-FR') + ' à ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

document.addEventListener('DOMContentLoaded', initMiseEnPage);