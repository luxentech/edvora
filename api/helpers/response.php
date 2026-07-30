<?php
// =========================================================
// Elevate Backend — Standardized Response Helper
// =========================================================

function sendResponse($status = true, $statusCode = 200, $message = '', $data = null, $meta = null) {
    http_response_code($statusCode);
    echo json_encode([
        'status' => $status,
        'code'   => $statusCode,
        'message'=> $message,
        'data'   => $data,
        'meta'   => $meta
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit();
}

function sendError($message = 'حدث خطأ ما', $statusCode = 400, $data = null) {
    sendResponse(false, $statusCode, $message, $data);
}

function sendSuccess($message = 'تمت العملية بنجاح', $data = null, $statusCode = 200, $meta = null) {
    sendResponse(true, $statusCode, $message, $data, $meta);
}
