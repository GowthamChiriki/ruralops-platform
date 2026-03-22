package com.ruralops.platform.common.web;

import com.ruralops.platform.common.exception.*;
import com.ruralops.platform.auth.exception.AuthenticationException;
import org.springframework.dao.DataIntegrityViolationException;

import io.jsonwebtoken.JwtException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Centralized HTTP exception mapping.
 * Converts domain exceptions into safe API responses.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log =
            LoggerFactory.getLogger(GlobalExceptionHandler.class);

    /* =====================================================
       AUTHENTICATION ERRORS
       ===================================================== */

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<?> handleAuthentication(AuthenticationException ex) {

        return ResponseEntity
                .status(HttpStatus.UNAUTHORIZED)
                .body(Map.of(
                        "error", "AUTHENTICATION_FAILED",
                        "message", ex.getMessage()
                ));
    }

    /* =====================================================
       VALIDATION ERRORS (@Valid)
       ===================================================== */

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<?> handleValidation(MethodArgumentNotValidException ex) {

        String message = ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .findFirst()
                .map(err -> err.getField() + " " + err.getDefaultMessage())
                .orElse("Validation error");

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(Map.of(
                        "error", "VALIDATION_ERROR",
                        "message", message
                ));
    }

    /* =====================================================
       RESOURCE ERRORS
       ===================================================== */

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<?> handleNotFound(ResourceNotFoundException ex) {

        return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(Map.of(
                        "error", "NOT_FOUND",
                        "message", ex.getMessage()
                ));
    }

    /* =====================================================
       INVALID REQUEST
       ===================================================== */

    @ExceptionHandler(InvalidRequestException.class)
    public ResponseEntity<?> handleInvalidRequest(InvalidRequestException ex) {

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(Map.of(
                        "error", "INVALID_REQUEST",
                        "message", ex.getMessage()
                ));
    }

    /* =====================================================
       GOVERNANCE RULE VIOLATIONS
       ===================================================== */

    @ExceptionHandler(GovernanceViolationException.class)
    public ResponseEntity<?> handleGovernanceViolation(GovernanceViolationException ex) {

        return ResponseEntity
                .status(HttpStatus.CONFLICT)
                .body(Map.of(
                        "error", "GOVERNANCE_VIOLATION",
                        "message", ex.getMessage()
                ));
    }

    /* =====================================================
       DOMAIN RULE VIOLATIONS
       ===================================================== */

    @ExceptionHandler(DomainException.class)
    public ResponseEntity<?> handleDomainException(DomainException ex) {

        return ResponseEntity
                .status(HttpStatus.UNPROCESSABLE_CONTENT)
                .body(Map.of(
                        "error", "DOMAIN_ERROR",
                        "message", ex.getMessage()
                ));
    }

    /* =====================================================
       FILE STORAGE ERRORS
       ===================================================== */

    @ExceptionHandler(FileStorageException.class)
    public ResponseEntity<?> handleFileStorage(FileStorageException ex) {

        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of(
                        "error", "FILE_STORAGE_ERROR",
                        "message", ex.getMessage()
                ));
    }

    /* =====================================================
       JWT TOKEN ERRORS
       ===================================================== */

    @ExceptionHandler(JwtException.class)
    public ResponseEntity<?> handleJwtException(JwtException ex) {

        log.warn("JWT error", ex);

        return ResponseEntity
                .status(HttpStatus.UNAUTHORIZED)
                .body(Map.of(
                        "error", "INVALID_TOKEN",
                        "message", "JWT token is invalid or expired"
                ));
    }

    /* =====================================================
   DATABASE CONSTRAINT VIOLATIONS
   ===================================================== */

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<?> handleDataIntegrityViolation(DataIntegrityViolationException ex) {

        String message = ex.getMostSpecificCause().getMessage();

        // Area already has worker
        if (message != null && message.contains("area_id")) {
            return ResponseEntity
                    .status(HttpStatus.CONFLICT)
                    .body(Map.of(
                            "field", "areaId",
                            "message", "This area already has a worker assigned"
                    ));
        }

        // Duplicate email
        if (message != null && message.contains("email")) {
            return ResponseEntity
                    .status(HttpStatus.CONFLICT)
                    .body(Map.of(
                            "field", "email",
                            "message", "A worker with this email already exists"
                    ));
        }

        // Duplicate phone
        if (message != null && message.contains("phone")) {
            return ResponseEntity
                    .status(HttpStatus.CONFLICT)
                    .body(Map.of(
                            "field", "phoneNumber",
                            "message", "A worker with this phone number already exists"
                    ));
        }

        return ResponseEntity
                .status(HttpStatus.CONFLICT)
                .body(Map.of(
                        "error", "DUPLICATE_RECORD",
                        "message", "A record with these details already exists"
                ));
    }

    /* =====================================================
       FALLBACK — UNEXPECTED SERVER ERRORS
       ===================================================== */

    @ExceptionHandler(Exception.class)
    public ResponseEntity<?> handleUnexpected(Exception ex) {

        log.error("Unexpected server error", ex);

        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of(
                        "error", "INTERNAL_ERROR",
                        "message", "An unexpected error occurred"
                ));
    }


}