<?php
require_once __DIR__ . '/_config.php';

session_unset();
session_destroy();

jsonSuccess(['message' => 'Déconnecté.']);
