<?php
/* ============================================================
   Qing Pu Elementary School — Admin panel configuration

   CHANGE THIS PASSWORD before putting this online.
   To generate a new hash, run this once on your server, copy the
   output below, then delete this temporary file:

       <?php echo password_hash('your-new-password', PASSWORD_DEFAULT);

   You can run it from the command line too, if your host gives you
   SSH/terminal access:

       php -r "echo password_hash('your-new-password', PASSWORD_DEFAULT);"
   ============================================================ */

// Current placeholder password: QingpuStaff2026!  ← change this!
define('ADMIN_PASSWORD_HASH', '$2y$10$hmWcL2a/ElCaAeevDceu8u0DnwKa9ozSewZd4vl6mL0uFSdMk1aWm');

// Path to the news data file that the public site reads from too
define('NEWS_JSON_PATH', __DIR__ . '/../news.json');