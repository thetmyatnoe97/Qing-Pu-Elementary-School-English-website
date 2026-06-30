<?php
require_once __DIR__ . '/auth.php';
require_login();

$CATEGORIES = [
    'event'        => ['label' => 'Event',        'badge' => 'badge-orange'],
    'award'        => ['label' => 'Award',         'badge' => 'badge-green'],
    'announcement' => ['label' => 'Announcement',  'badge' => 'badge-gray'],
    'fieldtrip'    => ['label' => 'Field trip',    'badge' => 'badge-purple'],
    'bilingual'    => ['label' => 'Bilingual',     'badge' => 'badge-navy'],
];

$articles = [];
if (file_exists(NEWS_JSON_PATH)) {
    $articles = json_decode(file_get_contents(NEWS_JSON_PATH), true) ?: [];
}

$editingId = $_GET['id'] ?? null;
$article   = null;
if ($editingId !== null) {
    foreach ($articles as $a) {
        if ((string)$a['id'] === (string)$editingId) { $article = $a; break; }
    }
}

$isNew = $article === null;

// Defaults for a new article / pre-filled values for an existing one
$title         = $article['title'] ?? '';
$subtitle      = $article['subtitle'] ?? '';
$categoryKey   = $article['categoryKey'] ?? 'event';
$date          = $article['date'] ?? date('Y-m-d');
$readTime      = $article['readTime'] ?? '3 min read';
$emoji         = $article['emoji'] ?? '📰';
$excerpt       = $article['excerpt'] ?? '';
$tagsStr       = isset($article['tags']) ? implode(', ', $article['tags']) : '';
$paragraphsStr = isset($article['paragraphs']) ? implode("\n\n", $article['paragraphs']) : '';
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="noindex, nofollow">
  <title><?= $isNew ? 'Add article' : 'Edit article' ?> — News Admin</title>
  <link rel="stylesheet" href="../css/style.css">
  <link rel="stylesheet" href="admin.css">
</head>
<body class="admin-body">

  <header class="admin-header">
    <div class="admin-header__inner">
      <strong>📰 News admin</strong>
      <nav>
        <a href="../news.html" target="_blank" rel="noopener">View live site →</a>
        <a href="logout.php">Log out</a>
      </nav>
    </div>
  </header>

  <main class="admin-main">
    <div class="admin-toolbar">
      <h1><?= $isNew ? 'Add new article' : 'Edit article' ?></h1>
      <a href="dashboard.php">← Back to list</a>
    </div>

    <form method="post" action="save.php" class="admin-form">
      <input type="hidden" name="csrf_token" value="<?= htmlspecialchars($_SESSION['csrf_token'], ENT_QUOTES, 'UTF-8') ?>">
      <?php if (!$isNew): ?>
        <input type="hidden" name="id" value="<?= htmlspecialchars((string)$article['id'], ENT_QUOTES, 'UTF-8') ?>">
      <?php endif; ?>

      <label for="title">Title</label>
      <input type="text" id="title" name="title" value="<?= htmlspecialchars($title, ENT_QUOTES, 'UTF-8') ?>" required>

      <label for="subtitle">Subtitle</label>
      <input type="text" id="subtitle" name="subtitle" value="<?= htmlspecialchars($subtitle, ENT_QUOTES, 'UTF-8') ?>">

      <div class="admin-form__row">
        <div>
          <label for="categoryKey">Category</label>
          <select id="categoryKey" name="categoryKey">
            <?php foreach ($CATEGORIES as $key => $info): ?>
              <option value="<?= htmlspecialchars($key, ENT_QUOTES, 'UTF-8') ?>" <?= $categoryKey === $key ? 'selected' : '' ?>>
                <?= htmlspecialchars($info['label'], ENT_QUOTES, 'UTF-8') ?>
              </option>
            <?php endforeach; ?>
          </select>
        </div>
        <div>
          <label for="date">Date</label>
          <input type="date" id="date" name="date" value="<?= htmlspecialchars($date, ENT_QUOTES, 'UTF-8') ?>" required>
        </div>
      </div>

      <div class="admin-form__row">
        <div>
          <label for="readTime">Read time</label>
          <input type="text" id="readTime" name="readTime" value="<?= htmlspecialchars($readTime, ENT_QUOTES, 'UTF-8') ?>" placeholder="e.g. 3 min read">
        </div>
        <div>
          <label for="emoji">Emoji icon</label>
          <input type="text" id="emoji" name="emoji" value="<?= htmlspecialchars($emoji, ENT_QUOTES, 'UTF-8') ?>" maxlength="4" placeholder="📰">
        </div>
      </div>

      <label for="excerpt">Excerpt (short summary shown on the news listing card)</label>
      <textarea id="excerpt" name="excerpt" rows="3" required><?= htmlspecialchars($excerpt, ENT_QUOTES, 'UTF-8') ?></textarea>

      <label for="tags">Tags (comma-separated)</label>
      <input type="text" id="tags" name="tags" value="<?= htmlspecialchars($tagsStr, ENT_QUOTES, 'UTF-8') ?>" placeholder="e.g. Grade 5, Science, Field trip">

      <label for="paragraphs">Full article — separate paragraphs with a blank line</label>
      <textarea id="paragraphs" name="paragraphs" rows="12" required><?= htmlspecialchars($paragraphsStr, ENT_QUOTES, 'UTF-8') ?></textarea>

      <button type="submit" class="btn btn-primary" style="margin-top:var(--sp-4);">Save article</button>
    </form>
  </main>

</body>
</html>