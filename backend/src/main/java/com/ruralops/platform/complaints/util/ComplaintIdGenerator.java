package com.ruralops.platform.complaints.util;

import com.ruralops.platform.governance.domain.Village;

import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

/**
 * Utility responsible for generating globally unique
 * public complaint identifiers.
 *
 * Format:
 * RLC-{VILLAGE}-{DATE}-{RANDOM}
 *
 * Example:
 * RLC-PNP-20260311-7F4K2Q9B
 *
 * Design goals:
 * - human readable
 * - globally unique
 * - scalable to millions of complaints
 */
public final class ComplaintIdGenerator {

    private static final DateTimeFormatter DATE_FORMAT =
            DateTimeFormatter.ofPattern("yyyyMMdd");

    private static final String ALPHABET =
            "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

    private static final int RANDOM_LENGTH = 8;

    private static final SecureRandom RANDOM = new SecureRandom();

    private ComplaintIdGenerator() {
        // utility class
    }

    /**
     * Generates a new complaint ID.
     */
    public static String generate(Village village) {

        if (village == null || village.getId() == null) {
            throw new IllegalArgumentException(
                    "Village required for complaint ID generation"
            );
        }

        String villageCode = extractVillageCode(village.getId());

        String date = LocalDate.now().format(DATE_FORMAT);

        String randomSegment = randomString(RANDOM_LENGTH);

        return "RLC-" + villageCode + "-" + date + "-" + randomSegment;
    }

    /**
     * Extracts readable prefix from village id.
     *
     * Example:
     * PNP-4831 → PNP
     */
    private static String extractVillageCode(String villageId) {

        int dashIndex = villageId.indexOf('-');

        if (dashIndex <= 0) {
            return villageId.toUpperCase();
        }

        return villageId.substring(0, dashIndex).toUpperCase();
    }

    /**
     * Generates a secure random alphanumeric string.
     */
    private static String randomString(int length) {

        StringBuilder builder = new StringBuilder(length);

        for (int i = 0; i < length; i++) {
            int index = RANDOM.nextInt(ALPHABET.length());
            builder.append(ALPHABET.charAt(index));
        }

        return builder.toString();
    }
}