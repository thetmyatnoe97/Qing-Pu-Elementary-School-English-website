<?php
/* ============================================================
   Qing Pu Elementary School — English Website
   contact.php  |  Contact form mailer

   SETUP FOR THE IT ENGINEER:
   1. Set $to below to the real school email address
   2. Upload this file to the same folder as contact.html
   3. Make sure the server has PHP mail() enabled, OR
      replace the mail() call with PHPMailer/SMTP if needed
   ============================================================ */

/* ── Configuration ── */
$to      = 'cpps@ms.tyc.edu.tw';           // ← change to real address
$from    = 'no-reply@cpps.tyc.edu.tw';     // ← change to school domain
$subject_prefix = '[Qing Pu Website Enquiry]';

/* ── Only accept POST requests ── */
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit('Method not allowed.');
}

/* ── Honeypot spam check ── */
if (!empty($_POST['website'])) {
    // Bot filled in the hidden field — silently exit with 200 so bots don't retry
    http_response_code(200);
    exit();
}

/* ── Helper: sanitise a string field ── */
function clean(string $value): string {
    return htmlspecialchars(strip_tags(trim($value)), ENT_QUOTES, 'UTF-8');
}

/* ── Collect and sanitise fields ── */
$first_name     = clean($_POST['first_name']    ?? '');
$last_name      = clean($_POST['last_name']     ?? '');
$email_raw      = trim($_POST['email']          ?? '');
$phone          = clean($_POST['phone']         ?? '');
$subject_choice = clean($_POST['subject']       ?? '');
$message        = clean($_POST['message']       ?? '');
$reply_language = clean($_POST['reply_language'] ?? 'english');

/* ── Server-side validation ── */
$errors = [];

if (empty($first_name)) $errors[] = 'First name is required.';
if (empty($last_name))  $errors[] = 'Last name is required.';

// Validate and sanitise email properly
$email = filter_var($email_raw, FILTER_VALIDATE_EMAIL);
if (!$email) $errors[] = 'A valid email address is required.';

if (empty($subject_choice)) $errors[] = 'Subject is required.';
if (empty($message))        $errors[] = 'Message is required.';
if (mb_strlen($message) > 1000) $errors[] = 'Message must be under 1000 characters.';

/* ── If validation fails, return 422 with JSON error list ── */
if (!empty($errors)) {
    http_response_code(422);
    header('Content-Type: application/json');
    echo json_encode(['errors' => $errors]);
    exit();
}

/* ── Build the email ── */
$name        = "$first_name $last_name";
$email_subject = "$subject_prefix $subject_choice";

// Map subject code to human-readable label
$subject_labels = [
    'enrollment' => 'Enrolment enquiry',
    'bilingual'  => 'Bilingual programme information',
    'visit'      => 'Arrange a school visit',
    'media'      => 'Media / research request',
    'general'    => 'General enquiry',
    'other'      => 'Other',
];
$subject_label = $subject_labels[$subject_choice] ?? $subject_choice;

// Plain-text email body
$body = <<<TEXT
New enquiry from the Qing Pu Elementary School English website
================================================================

Name:             $name
Email:            $email
Phone:            {$phone}
Subject:          $subject_label
Preferred reply:  $reply_language

Message:
--------
$message

================================================================
Sent: {$_SERVER['REQUEST_TIME']}
IP:   {$_SERVER['REMOTE_ADDR']}
TEXT;

/* ── Email headers ── */
$headers  = "From: Qing Pu Website <$from>\r\n";
$headers .= "Reply-To: $name <$email>\r\n";
$headers .= "X-Mailer: PHP/" . phpversion() . "\r\n";
$headers .= "Content-Type: text/plain; charset=UTF-8\r\n";

/* ── Send ── */
$sent = mail($to, $email_subject, $body, $headers);

/* ── Also send a confirmation copy to the sender ── */
if ($sent) {
    $confirm_subject = 'We received your message — Qing Pu Elementary School';
    $confirm_body = <<<TEXT
Dear $first_name,

Thank you for contacting Qing Pu Elementary School.

We have received your message and will reply within two school days.
If you need to reach us urgently, please call the main office:

    Phone: (03) 453-1626
    Hours: Monday – Friday, 07:30 – 17:00

Your message:
"$message"

---
Qing Pu Elementary School
No. 122, Sec. 2, Qingpu Road, Qingpu Village, Zhongli District, Taoyuan City 320016
cpps@ms.tyc.edu.tw · (03) 453-1626
TEXT;

    $confirm_headers  = "From: Qing Pu Elementary School <$from>\r\n";
    $confirm_headers .= "X-Mailer: PHP/" . phpversion() . "\r\n";
    $confirm_headers .= "Content-Type: text/plain; charset=UTF-8\r\n";

    mail($email, $confirm_subject, $confirm_body, $confirm_headers);
}

/* ── Respond to the AJAX request ── */
if ($sent) {
    http_response_code(200);
    header('Content-Type: application/json');
    echo json_encode(['success' => true]);
} else {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'error' => 'mail() failed — check server mail configuration.']);
}