package com.ruralops.platform.secure.activation.notification;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

/**
 * Service responsible for sending account activation emails via Resend API.
 *
 * Uses HTTP instead of SMTP (required for cloud platforms like Railway).
 */
@Service
public class ActivationEmailService {

    @Value("${resend.api.key}")
    private String apiKey;

    private final RestTemplate restTemplate = new RestTemplate();

    /**
     * Resend default sender (works immediately).
     * Later you can replace with your own domain email.
     */
    private static final String FROM_EMAIL = "onboarding@resend.dev";

    /**
     * Sends activation email using Resend API.
     */
    public void sendActivationEmail(
            String toEmail,
            String displayName,
            String accountType,
            String accountId,
            String activationKey
    ) {

        if (toEmail == null || toEmail.isBlank()) {
            throw new IllegalStateException("Recipient email is missing");
        }
        if (activationKey == null || activationKey.isBlank()) {
            throw new IllegalStateException("Activation key is missing");
        }

        String htmlBody = buildEmailBody(
                displayName,
                accountType,
                accountId,
                activationKey
        );

        String requestBody = """
        {
          "from": "%s",
          "to": ["%s"],
          "subject": "RuralOps | Account Activation Required",
          "html": "%s"
        }
        """.formatted(
                FROM_EMAIL,
                toEmail,
                escapeJson(htmlBody)
        );

        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + apiKey);
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<String> request = new HttpEntity<>(requestBody, headers);

        ResponseEntity<String> response = restTemplate.postForEntity(
                "https://api.resend.com/emails",
                request,
                String.class
        );

        if (!response.getStatusCode().is2xxSuccessful()) {
            throw new IllegalStateException("Failed to send email: " + response.getBody());
        }
    }

    /* =======================
       Email Content (HTML)
       ======================= */

    private String buildEmailBody(
            String displayName,
            String accountType,
            String accountId,
            String activationKey
    ) {
        return """
        <div style="font-family:Arial,sans-serif;line-height:1.6;">
            <p>%s,</p>

            <p>Your RuralOps account has been successfully provisioned and is pending activation.</p>

            <p><strong>Account Type:</strong> %s<br>
               <strong>Account ID:</strong> %s</p>

            <hr>

            <p><strong>Activation Key:</strong></p>
            <h2 style="letter-spacing:2px;">%s</h2>

            <p>
            • Valid for 10 minutes<br>
            • One-time use only<br>
            • Max 3 requests per 24 hours
            </p>

            <p>If you did not request this, ignore this email.</p>

            <hr>

            <p style="font-size:12px;color:gray;">
            RuralOps — Digital Rural Governance Platform<br>
            Do not reply to this email.
            </p>
        </div>
        """.formatted(
                safeDisplayName(displayName),
                accountType,
                accountId,
                activationKey
        );
    }

    /* =======================
       Helpers
       ======================= */

    private String safeDisplayName(String displayName) {
        if (displayName == null || displayName.isBlank()) {
            return "Dear User";
        }
        return "Dear " + displayName;
    }

    /**
     * Escapes JSON-breaking characters.
     */
    private String escapeJson(String text) {
        return text
                .replace("\"", "\\\"")
                .replace("\n", "")
                .replace("\r", "");
    }
}