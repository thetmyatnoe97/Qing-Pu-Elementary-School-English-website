<?php
require_once __DIR__ . '/auth.php';
require_login();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: dashboard.php');
    exit();
}

check_csrf();

$CATEGORIES = [
    'event'        => ['label' => 'Event',        'badge' => 'badge-orange'],
    'award'        => ['label' => 'Award',         'badge' => 'badge-green'],
    'announcement' => ['label' => 'Announcement',  'badge' => 'badge-gray'],
    'fieldtrip'    => ['label' => 'Field trip',    'badge' => 'badge-purple'],
    'bilingual'    => ['label' => 'Bilingual',     'badge' => 'badge-navy'],
];

function clean_field(string $v): string {
    return trim($v);
}

$id            = $_POST['id'] ?? null;
$title         = clean_field($_POST['title'] ?? '');
$subtitle      = clean_field($_POST['subtitle'] ?? '');
$categoryKey   = $_POST['categoryKey'] ?? 'event';
$date          = clean_field($_POST['date'] ?? '');
$readTime      = clean_field($_POST['readTime'] ?? '');
$emoji         = clean_field($_POST['emoji'] ?? '📰');
$excerpt       = clean_field($_POST['excerpt'] ?? '');
$tagsRaw       = clean_field($_POST['tags'] ?? '');
$paragraphsRaw = $_POST['paragraphs'] ?? '';

// ── Basic required-field validation ──
if ($title === '' || $date === '' || $excerpt === '' || trim($paragraphsRaw) === '') {
    http_response_code(422);
    exit('Title, date, excerpt, and article body are all required. Please go back and fill them in.');
}

if (!isset($CATEGORIES[$categoryKey])) {
    $categoryKey = 'event';
}

$tags = $tagsRaw === '' ? [] : array_map('trim', explode(',', $tagsRaw));

// Split the article body into paragraphs on blank lines
$paragraphs = preg_split('/\r?\n\r?\n+/', trim($paragraphsRaw));
$paragraphs = array_values(array_filter(array_map('trim', $paragraphs), fn($p) => $p !== ''));

$dateObj     = DateTime::createFromFormat('Y-m-d', $date);
$dateDisplay = $dateObj ? $dateObj->format('F j, Y') : $date;

// ── Load existing data ──
$articles = [];
if (file_exists(NEWS_JSON_PATH)) {
    $articles = json_decode(file_get_contents(NEWS_JSON_PATH), true) ?: [];
}

$newArticle = [
    'title'         => $title,
    'subtitle'      => $subtitle,
    'category'      => $CATEGORIES[$categoryKey]['label'],
    'categoryKey'   => $categoryKey,
    'categoryBadge' => $CATEGORIES[$categoryKey]['badge'],
    'date'          => $date,
    'dateDisplay'   => $dateDisplay,
    'readTime'      => $readTime !== '' ? $readTime : '3 min read',
    'emoji'         => $emoji !== '' ? $emoji : '📰',
    'excerpt'       => $excerpt,
    'tags'          => $tags,
    'paragraphs'    => $paragraphs,
];

if ($id !== null && $id !== '') {
    // ── Update existing article, keeping its original id ──
    $found = false;
    foreach ($articles as &$a) {
        if ((string)$a['id'] === (string)$id) {
            $newArticle['id'] = $a['id'];
            $a = $newArticle;
            $found = true;
            break;
        }
    }
    unset($a);
    if (!$found) {
        http_response_code(404);
        exit('Article not found — it may have been deleted already.');
    }
} else {
    // ── Create new article — next id = max existing id + 1 ──
    $maxId = 0;
    foreach ($articles as $a) {
        if (isset($a['id']) && (int)$a['id'] > $maxId) $maxId = (int)$a['id'];
    }
    $newArticle['id'] = $maxId + 1;
    $articles[] = $newArticle;
}

// ── Save back to disk with a locked write to avoid corruption ──
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
    exit('Could not save — check that news.json is writable by the web server (file permissions).');
}

header('Location: dashboard.php?saved=1');
exit();