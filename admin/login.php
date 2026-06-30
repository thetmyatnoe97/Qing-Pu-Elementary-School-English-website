<?php
require_once __DIR__ . '/config.php';
session_start();

if (empty($_SESSION['csrf_token'])) {
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
}

$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $token = $_POST['csrf_token'] ?? '';
    if (!hash_equals($_SESSION['csrf_token'], $token)) {
        $error = 'Your session expired — please try again.';
    } else {
        $password = $_POST['password'] ?? '';
        if (password_verify($password, ADMIN_PASSWORD_HASH)) {
            // Regenerate the session ID on login to prevent session fixation
            session_regenerate_id(true);
            $_SESSION['admin_logged_in'] = true;
            header('Location: dashboard.php');
            exit();
        } else {
            $error = 'Incorrect password.';
        }
    }
}

// If already logged in, skip straight to the dashboard
if (!empty($_SESSION['admin_logged_in'])) {
    header('Location: dashboard.php');
    exit();
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="noindex, nofollow">
  <title>Staff Login — Qing Pu Elementary School</title>
  <link rel="stylesheet" href="../css/style.css">
  <link rel="stylesheet" href="admin.css">
</head>
<body class="admin-body">
  <div class="admin-login">
    <div class="admin-login__card">
      <div class="admin-login__logo" aria-hidden="true">✈️</div>
      <h1>Staff Login</h1>
      <p class="admin-login__sub">Qing Pu Elementary School — News admin</p>

      <?php if ($error): ?>
        <p class="admin-error"><?= htmlspecialchars($error, ENT_QUOTES, 'UTF-8') ?></p>
      <?php endif; ?>

      <form method="post" action="login.php" class="admin-login__form">
        <input type="hidden" name="csrf_token" value="<?= htmlspecialchars($_SESSION['csrf_token'], ENT_QUOTES, 'UTF-8') ?>">
        <label for="password">Password</label>
        <input type="password" id="password" name="password" required autofocus>
        <button type="submit" class="btn btn-primary" style="width:100%;justify-content:center;margin-top:var(--sp-4);">Log in</button>
      </form>

      <a href="../index.html" class="admin-login__back">← Back to website</a>
    </div>
  </div>
</body>
</html>