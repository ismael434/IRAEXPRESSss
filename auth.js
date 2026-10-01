function afficherErreurAuth(message) {
    document.getElementById('zone-message').innerHTML = `<p class="message-erreur">${message}</p>`;
}

function redirigerSelonRole(role) {
    if (role === 'commercant') window.location.href = '/merchant/dashboard.html';
    else if (role === 'livreur') window.location.href = '/delivery/dashboard.html';
    else window.location.href = '/index.html';
}

document.addEventListener('DOMContentLoaded', () => {

    // --- Connexion ---
    document.getElementById('form-login')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const { utilisateur } = await API.login(
                document.getElementById('telephone').value,
                document.getElementById('mot_de_passe').value
            );
            redirigerSelonRole(utilisateur.role);
        } catch (err) {
            afficherErreurAuth(err.message);
        }
    });

    // --- Inscription client ---
    document.getElementById('form-register-client')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const mdp = document.getElementById('mot_de_passe').value;
        if (mdp !== document.getElementById('confirmation').value) {
            afficherErreurAuth('Les mots de passe ne correspondent pas.');
            return;
        }
        try {
            await API.register({
                role: 'client',
                nom: document.getElementById('nom').value,
                telephone: document.getElementById('telephone').value,
                quartier: document.getElementById('quartier').value,
                mot_de_passe: mdp,
            });
            window.location.href = '/index.html';
        } catch (err) {
            afficherErreurAuth(err.message);
        }
    });

    // --- Inscription commerçant ---
    document.getElementById('form-register-commercant')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const mdp = document.getElementById('mot_de_passe').value;
        if (mdp !== document.getElementById('confirmation').value) {
            afficherErreurAuth('Les mots de passe ne correspondent pas.');
            return;
        }
        try {
            await API.register({
                role: 'commercant',
                nom: document.getElementById('nom').value,
                telephone: document.getElementById('telephone').value,
                quartier: document.getElementById('quartier').value,
                nom_boutique: document.getElementById('nom_boutique').value,
                description: document.getElementById('description').value,
                mot_de_passe: mdp,
            });
            window.location.href = '/merchant/dashboard.html';
        } catch (err) {
            afficherErreurAuth(err.message);
        }
    });

    // --- Inscription livreur ---
    document.getElementById('form-register-livreur')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const mdp = document.getElementById('mot_de_passe').value;
        if (mdp !== document.getElementById('confirmation').value) {
            afficherErreurAuth('Les mots de passe ne correspondent pas.');
            return;
        }
        try {
            await API.register({
                role: 'livreur',
                nom: document.getElementById('nom').value,
                telephone: document.getElementById('telephone').value,
                quartier: document.getElementById('quartier').value,
                type_vehicule: document.getElementById('type_vehicule').value,
                mot_de_passe: mdp,
            });
            window.location.href = '/delivery/dashboard.html';
        } catch (err) {
            afficherErreurAuth(err.message);
        }
    });
});