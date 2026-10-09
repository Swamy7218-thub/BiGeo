<?php
// Contact form handler for Hostinger shared hosting.
// The static site POSTs here; this emails the message to the team.

header('Content-Type: application/json; charset=utf-8');

$TO   = 'admin@acquahtlabs.in';
$FROM = 'website@acquahtlabs.in'; // must be an address on this domain, or Hostinger may drop the mail

function reply($code, $ok, $msg = '') {
    http_response_code($code);
    echo json_encode(['ok' => $ok, 'message' => $msg]);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    reply(405, false, 'POST only');
}

// Honeypot: real visitors never see this field.
if (!empty($_POST['website'])) {
    reply(200, true);
}

function field($key, $max) {
    $v = isset($_POST[$key]) ? trim((string) $_POST[$key]) : '';
    return mb_substr($v, 0, $max);
}
// Header values must never carry line breaks (stops header injection).
function one_line($v) {
    return trim(preg_replace('/[\r\n]+/', ' ', $v));
}

$name    = one_line(field('name', 100));
$email   = one_line(field('email', 150));
$org     = one_line(field('org', 150));
$topic   = one_line(field('topic', 50));
$message = field('message', 5000);

if ($name === '' || $message === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    reply(400, false, 'Please fill in your name, a valid email and a message.');
}

// Simple rate limit: one message per IP every 60 seconds.
$ip    = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
$stamp = sys_get_temp_dir() . '/acquaht_contact_' . md5($ip);
if (file_exists($stamp) && time() - filemtime($stamp) < 60) {
    reply(429, false, 'Please wait a minute before sending another message.');
}
@touch($stamp);

$subject = 'Website enquiry: ' . ($topic !== '' ? $topic : 'General') . ' from ' . $name;
$body = "Name: $name\n"
      . "Email: $email\n"
      . "Organisation: " . ($org !== '' ? $org : '-') . "\n"
      . "Topic: " . ($topic !== '' ? $topic : '-') . "\n"
      . "IP: $ip\n\n"
      . $message . "\n";

$headers = [
    'From: AcquaHT Website <' . $FROM . '>',
    'Reply-To: ' . $email,
    'Content-Type: text/plain; charset=UTF-8',
];

$sent = mail($TO, '=?UTF-8?B?' . base64_encode($subject) . '?=', $body, implode("\r\n", $headers), '-f' . $FROM);

if (!$sent) {
    reply(500, false, 'Mail could not be sent.');
}
reply(200, true);
