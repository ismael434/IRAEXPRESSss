const ICONES_CATEGORIES = {
    'gaz-domestique': '🟢',
    'denrees-alimentaires': '🍚',
    'materiaux-construction': '🧱',
    'livraison-colis': '📦',
};

async function chargerCategories() {
    const grille = document.getElementById('grille-categories');
    try {
        const { categories } = await API.categories();
        grille.innerHTML = categories.map(cat => `
            <a href="/categorie.html?slug=${encodeURIComponent(cat.slug)}" class="carte-categorie">
                <div class="icone-categorie">${ICONES_CATEGORIES[cat.slug] || '🛒'}</div>
                <h3>${cat.nom}</h3>
                <p>${cat.slug === 'livraison-colis' ? "Envoyez un colis n'importe où à Agadez" : 'Commandez auprès des commerçants locaux'}</p>
            </a>
        `).join('');
    } catch (e) {
        grille.innerHTML = `<p class="message-erreur">Impossible de charger les catégories : ${e.message}</p>`;
    }
}

document.addEventListener('DOMContentLoaded', chargerCategories);