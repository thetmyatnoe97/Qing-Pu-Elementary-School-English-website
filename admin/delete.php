<?php
require_once __DIR__ . '/auth.php';
require_login();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: dashboard.php');
    exit();
}

check_csrf();

$id = $_POST['id'] ?? null;
if ($id === null) {
    header('Location: dashboard.php');
    exit();
}

$articles = [];
if (file_exists(NEWS_JSON_PATH)) {
    $articles = json_decode(file_get_contents(NEWS_JSON_PATH), true) ?: [];
}

$articles = array_values(array_filter($articles, fn($a) => (string)($a['id'] ?? '') !== (string)$id));

$json = json_encode($articles, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
$fp = fopen(NEWS_JSON_PATH, 'c');
if ($fp && flock($fp, LOCK_EX)) {
    ftruncate($fp, 0);
    fwrite($fp, $json);
    fflush($fp);
    flock($fp, LOCK_UN);
    fclose($fp);
} else {
    http_response_code(500);
    exit('Could not delete — check that news.json is writable by the web server (file permissions).');
}

header('Location: dashboard.php?deleted=1');
exit();