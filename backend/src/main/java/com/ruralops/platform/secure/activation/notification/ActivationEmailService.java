package com.ruralops.platform.secure.activation.notification;

import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

/**
 * Service responsible for sending account activation emails.
 *
 * This class only handles email composition and delivery.
 * It does not perform validation, persistence, or business logic.
 */
@Service
public class ActivationEmailService {

    private final JavaMailSender mailSender;

    /**
     * Temporary sender address for development/local environments.
     *
     * Will be moved to external configuration before production use.
     */
    private static final String FROM_EMAIL = "ruralops.official@gmail.com";

    public ActivationEmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    /**
     * Sends an activation email to the specified recipient.
     *
     * Validates required inputs before dispatching the message.
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

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(FROM_EMAIL);
        message.setTo(toEmail);
        message.setSubject("RuralOps | Account Activation Required");
        message.setText(
                buildEmailBody(
                        displayName,
                        accountType,
                        accountId,
                        activationKey
                )
        );

        mailSender.send(message);
    }

    /* =======================
       Email Content
       ======================= */

    /**
     * Builds the activation email body using a standard template.
     *
     * The format is fixed and follows an official communication style.
     */
    private String buildEmailBody(
            String displayName,
            String accountType,
            String accountId,
            String activationKey
    ) {

        return """
            %s,

            Your RuralOps account has been successfully provisioned and is pending activation.
            Please use the activation key below to complete your registration.

            ───────────────────────────────────────
            ACCOUNT INFORMATION
            ───────────────────────────────────────
            Account Type  :  %s
            Account ID    :  %s

            ───────────────────────────────────────
            ACTIVATION KEY
            ───────────────────────────────────────
            %s

            ───────────────────────────────────────

              •  This key is valid for 10 minutes only
              •  It can be used once and will expire immediately after
              •  A maximum of 3 activation requests are allowed per 24 hours

            If you did not request this, you may safely ignore this message.
            Your account will remain inactive unless this key is used.

            Never share your activation key with anyone, including RuralOps staff.

            ───────────────────────────────────────
            This is an automated message — please do not reply.

            RuralOps  |  Digital Rural Governance Platform
            Government Services Infrastructure
            Support: ruralops.official@gmail.com
            © 2026 RuralOps. All rights reserved.
            """.formatted(
                safeDisplayName(displayName),
                accountType,
                accountId,
                activationKey
        );
    }

    /**
     * Returns a safe salutation for the email.
     *
     * Falls back to a generic greeting if no display name is provided.
     */
    private String safeDisplayName(String displayName) {
        if (displayName == null || displayName.isBlank()) {
            return "Dear User";
        }
        return "Dear " + displayName;
    }
}
