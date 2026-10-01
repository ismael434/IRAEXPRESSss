async function chargerProduits() {
    const params = new URLSearchParams(window.location.search);
    const slug = params.get('slug') || '';
    const grille = document.getElementById('grille-produits');

    try {
        const { categorie, produits } = await API.produits(slug);

        document.getElementById('titre-page').textContent = categorie.nom + ' — IRA EXPRESS';
        document.getElementById('nom-categorie').textContent = categorie.nom;
        document.getElementById('nb-produits').textContent =
            `${produits.length} produit(s) disponible(s) auprès des commerçants d'Agadez.`;

        if (produits.length === 0) {
            grille.innerHTML = '<p style="color:var(--texte-att)">Aucun produit disponible dans cette catégorie pour le moment. Revenez bientôt.</p>';
            return;
        }

        grille.innerHTML = produits.map(p => `
            <div class="carte-produit">
                <img src="${p.photo ? '/uploads/produits/' + p.photo : 'https://placehold.co/400x300/121B2E/8C97AE?text=IRA+EXPRESS'}" alt="${p.nom}">
                <div class="carte-produit-corps">
                    <h3>${p.nom}</h3>
                    <p style="color:var(--texte-att);font-size:0.85rem;margin-bottom:8px">Vendu par ${p.nom_boutique}</p>
                    <div class="prix">${formaterPrix(p.prix)}</div>
                    <div class="carte-produit-actions">
                        <button type="button" class="btn btn-principal btn-petit btn-pleine-largeur"
                            onclick="ajouterAuPanier(${p.id}, '${p.nom.replace(/'/g, "\\'")}', ${p.prix}, ${p.boutique_id})">
                            Ajouter au panier
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (e) {
        document.getElementById('nom-categorie').textContent = 'Catégorie introuvable';
        grille.innerHTML = `<p class="message-erreur">${e.message}</p>`;
    }
}

document.addEventListener('DOMContentLoaded', chargerProduits);