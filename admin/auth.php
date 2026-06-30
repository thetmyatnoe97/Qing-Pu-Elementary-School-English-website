<?php
/* ============================================================
   Qing Pu Elementary School — Admin panel auth guard
   Include this at the very top of every protected admin page
   (dashboard.php, edit.php, save.php, delete.php).
   ============================================================ */

require_once __DIR__ . '/config.php';

session_start();

// Simple CSRF token, generated once per session and reused on every form
if (empty($_SESSION['csrf_token'])) {
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
}

function require_login(): void {
    if (empty($_SESSION['admin_logged_in']) || $_SESSION['admin_logged_in'] !== true) {
        header('Location: login.php');
        exit();
    }
}

function check_csrf(): void {
    $token = $_POST['csrf_token'] ?? '';
    if (!hash_equals($_SESSION['csrf_token'] ?? '', $token)) {
        http_response_code(403);
        exit('Your session expired or the request was invalid — please go back and try again.');
    }
}