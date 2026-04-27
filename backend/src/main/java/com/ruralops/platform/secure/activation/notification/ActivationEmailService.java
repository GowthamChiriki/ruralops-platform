//package com.ruralops.platform.secure.activation.notification;
//
//import org.springframework.beans.factory.annotation.Value;
//import org.springframework.http.*;
//import org.springframework.stereotype.Service;
//import org.springframework.web.client.RestTemplate;
//
//import java.util.HashMap;
//import java.util.List;
//import java.util.Map;
//
///**
// * Sends activation emails using Resend API (stable version).
// */
//@Service
//public class ActivationEmailService {
//
//    @Value("${resend.api.key}")
//    private String apiKey;
//
//    private final RestTemplate restTemplate = new RestTemplate();
//
//    // Works in free/test mode
//    private static final String FROM_EMAIL = "onboarding@resend.dev";
//
//    public void sendActivationEmail(
//            String toEmail,
//            String displayName,
//            String accountType,
//            String accountId,
//            String activationKey
//    ) {
//
//        if (toEmail == null || toEmail.isBlank()) {
//            throw new IllegalStateException("Recipient email is missing");
//        }
//
//        String html = buildEmailBody(
//                displayName,
//                accountType,
//                accountId,
//                activationKey
//        );
//
//        // ✅ SAFE JSON (no manual string building)
//        Map<String, Object> payload = new HashMap<>();
//        payload.put("from", FROM_EMAIL);
//        payload.put("to", List.of(toEmail));
//        payload.put("subject", "RuralOps | Account Activation Required");
//        payload.put("html", html);
//
//        HttpHeaders headers = new HttpHeaders();
//        headers.set("Authorization", "Bearer " + apiKey);
//        headers.setContentType(MediaType.APPLICATION_JSON);
//
//        HttpEntity<Map<String, Object>> request = new HttpEntity<>(payload, headers);
//
//        try {
//            ResponseEntity<String> response = restTemplate.postForEntity(
//                    "https://api.resend.com/emails",
//                    request,
//                    String.class
//            );
//
//            // 🔍 DEBUG (keep until fully working)
//            System.out.println("=== EMAIL DEBUG ===");
//            System.out.println("TO: " + toEmail);
//            System.out.println("STATUS: " + response.getStatusCode());
//            System.out.println("BODY: " + response.getBody());
//
//            if (!response.getStatusCode().is2xxSuccessful()) {
//                throw new RuntimeException("Email failed: " + response.getBody());
//            }
//
//        } catch (Exception e) {
//            e.printStackTrace(); // 🔥 this will show exact issue in Railway logs
//            throw new RuntimeException("Email sending failed", e);
//        }
//    }
//
//    /* =======================
//       Email Content
//       ======================= */
//
//    private String buildEmailBody(
//            String displayName,
//            String accountType,
//            String accountId,
//            String activationKey
//    ) {
//        return """
//        <div style="font-family:Arial,sans-serif;line-height:1.6;">
//            <p>%s,</p>
//
//            <p>Your RuralOps account has been successfully provisioned and is pending activation.</p>
//
//            <p><strong>Account Type:</strong> %s<br>
//               <strong>Account ID:</strong> %s</p>
//
//            <hr>
//
//            <p><strong>Activation Key:</strong></p>
//            <h2 style="letter-spacing:2px;">%s</h2>
//
//            <p>
//            • Valid for 10 minutes<br>
//            • One-time use only<br>
//            • Max 3 requests per 24 hours
//            </p>
//
//            <p>If you did not request this, ignore this email.</p>
//
//            <hr>
//
//            <p style="font-size:12px;color:gray;">
//            RuralOps — Digital Rural Governance Platform<br>
//            Do not reply to this email.
//            </p>
//        </div>
//        """.formatted(
//                safeDisplayName(displayName),
//                accountType,
//                accountId,
//                activationKey
//        );
//    }
//
//    private String safeDisplayName(String displayName) {
//        if (displayName == null || displayName.isBlank()) {
//            return "Dear User";
//        }
//        return "Dear " + displayName;
//    }
//}