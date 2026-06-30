<?php
require_once __DIR__ . '/auth.php';
require_login();

$articles = [];
if (file_exists(NEWS_JSON_PATH)) {
    $json = file_get_contents(NEWS_JSON_PATH);
    $articles = json_decode($json, true) ?: [];
}

// Newest first
usort($articles, fn($a, $b) => strcmp($b['date'] ?? '', $a['date'] ?? ''));

$saved   = isset($_GET['saved']);
$deleted = isset($_GET['deleted']);
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="noindex, nofollow">
  <title>News Admin — Qing Pu Elementary School</title>
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

    <?php if ($saved): ?>
      <p class="admin-banner admin-banner--success">✓ Article saved.</p>
    <?php endif; ?>
    <?php if ($deleted): ?>
      <p class="admin-banner admin-banner--success">✓ Article deleted.</p>
    <?php endif; ?>

    <div class="admin-toolbar">
      <h1>Articles (<?= count($articles) ?>)</h1>
      <a href="edit.php" class="btn btn-primary">+ Add new article</a>
    </div>

    <table class="admin-table">
      <thead>
        <tr>
          <th>Title</th>
          <th>Category</th>
          <th>Date</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <?php if (empty($articles)): ?>
          <tr><td colspan="4" class="admin-table__empty">No articles yet — add your first one above.</td></tr>
        <?php endif; ?>
        <?php foreach ($articles as $a): ?>
          <tr>
            <td><?= htmlspecialchars($a['title'] ?? '', ENT_QUOTES, 'UTF-8') ?></td>
            <td><span class="badge <?= htmlspecialchars($a['categoryBadge'] ?? '', ENT_QUOTES, 'UTF-8') ?>"><?= htmlspecialchars($a['category'] ?? '', ENT_QUOTES, 'UTF-8') ?></span></td>
            <td><?= htmlspecialchars($a['dateDisplay'] ?? $a['date'] ?? '', ENT_QUOTES, 'UTF-8') ?></td>
            <td class="admin-table__actions">
              <a href="edit.php?id=<?= urlencode((string)$a['id']) ?>">Edit</a>
              <form method="post" action="delete.php" onsubmit="return confirm('Delete this article? This cannot be undone.');" style="display:inline;">
                <input type="hidden" name="csrf_token" value="<?= htmlspecialchars($_SESSION['csrf_token'], ENT_QUOTES, 'UTF-8') ?>">
                <input type="hidden" name="id" value="<?= htmlspecialchars((string)$a['id'], ENT_QUOTES, 'UTF-8') ?>">
                <button type="submit" class="admin-link-btn admin-link-btn--danger">Delete</button>
              </form>
            </td>
          </tr>
        <?php endforeach; ?>
      </tbody>
    </table>

  </main>

</body>
</html>