async function initPagePanier() {
    afficherPanier();

    const { connecte } = await API.session();
    document.getElementById('zone-non-connecte').style.display = connecte ? 'none' : 'block';
    document.getElementById('form-commande').style.display = connecte ? 'block' : 'none';

    if (!connecte) return;

    document.getElementById('form-commande').addEventListener('submit', async (e) => {
        e.preventDefault();
        const panier = lirePanier();
        const zoneMessage = document.getElementById('zone-message');

        if (panier.length === 0) {
            zoneMessage.innerHTML = '<p class="message-erreur">Votre panier est vide.</p>';
            return;
        }

        try {
            await API.commander({
                panier,
                quartier: document.getElementById('quartier').value,
                adresse: document.getElementById('adresse').value,
                telephone: document.getElementById('telephone').value,
                mode_paiement: document.getElementById('mode_paiement').value,
            });
            localStorage.removeItem(CLE_PANIER);
            window.location.href = '/confirmation.html';
        } catch (err) {
            zoneMessage.innerHTML = `<p class="message-erreur">${err.message}</p>`;
        }
    });
}

document.addEventListener('DOMContentLoaded', initPagePanier);