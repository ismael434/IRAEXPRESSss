<?php
require_once __DIR__ . '/_config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonError('Méthode non autorisée.', 405);
}

$donnees = corpsJson();

$role = in_array($donnees['role'] ?? '', ['client', 'commercant', 'livreur']) ? $donnees['role'] : 'client';
$nom = nettoyer($donnees['nom'] ?? '');
$telephone = nettoyer($donnees['telephone'] ?? '');
$quartier = nettoyer($donnees['quartier'] ?? '');
$motDePasse = $donnees['mot_de_passe'] ?? '';

if (empty($nom) || empty($telephone) || empty($motDePasse)) {
    jsonError('Merci de remplir tous les champs obligatoires.');
}
if (strlen($motDePasse) < 6) {
    jsonError('Le mot de passe doit contenir au moins 6 caractères.');
}

$stmt = $pdo->prepare("SELECT id FROM utilisateurs WHERE telephone = ?");
$stmt->execute([$telephone]);
if ($stmt->fetch()) {
    jsonError('Ce numéro de téléphone est déjà utilisé.');
}

$hash = password_hash($motDePasse, PASSWORD_DEFAULT);
$statutInitial = $role === 'livreur' ? 'en_attente' : 'actif';

try {
    $pdo->beginTransaction();

    $stmt = $pdo->prepare("INSERT INTO utilisateurs (nom, telephone, mot_de_passe, role, quartier, statut) VALUES (?, ?, ?, ?, ?, ?)");
    $stmt->execute([$nom, $telephone, $hash, $role, $quartier, $statutInitial]);
    $utilisateurId = $pdo->lastInsertId();

    if ($role === 'commercant') {
        $nomBoutique = nettoyer($donnees['nom_boutique'] ?? '');
        $description = nettoyer($donnees['description'] ?? '');
        if (empty($nomBoutique)) {
            $pdo->rollBack();
            jsonError('Le nom de la boutique est obligatoire.');
        }
        $stmt = $pdo->prepare("INSERT INTO boutiques (utilisateur_id, nom_boutique, description, quartier) VALUES (?, ?, ?, ?)");
        $stmt->execute([$utilisateurId, $nomBoutique, $description, $quartier]);
    }

    if ($role === 'livreur') {
        $typeVehicule = in_array($donnees['type_vehicule'] ?? '', ['moto', 'velo', 'voiture', 'a_pied']) ? $donnees['type_vehicule'] : 'moto';
        $stmt = $pdo->prepare("INSERT INTO livreurs (utilisateur_id, type_vehicule) VALUES (?, ?)");
        $stmt->execute([$utilisateurId, $typeVehicule]);
    }

    $pdo->commit();
} catch (Exception $e) {
    $pdo->rollBack();
    jsonError('Erreur lors de la création du compte.', 500);
}

$_SESSION['user_id'] = $utilisateurId;
$_SESSION['role'] = $role;
$_SESSION['nom'] = $nom;

jsonSuccess(['utilisateur' => ['id' => $utilisateurId, 'nom' => $nom, 'role' => $role]], 201);
