package com.ruralops.platform.citizen.dashboard.dto;

/**
 * Response DTO representing the data required
 * to render the citizen dashboard.
 *
 * Aggregates information from multiple modules:
 * - CitizenAccount
 * - CitizenProfile
 * - Complaints module
 * - News service
 * - Weather service
 */
public class CitizenDashboardResponse {

    /* =========================
       Citizen Identity
       ========================= */

    private String citizenId;
    private String citizenName;
    private String villageName;

    /* =========================
       Profile
       ========================= */

    private String profilePhoto;
    private boolean profileCompleted;

    /* =========================
       Dashboard Quick Actions
       ========================= */

    private boolean complaintsEnabled;
    private boolean grievancesEnabled;
    private boolean schemesEnabled;

    /* =========================
       Complaint Metrics
       ========================= */

    private int totalComplaints;
    private int pendingComplaints;

    /* =========================
       Information Widgets
       ========================= */

    private String latestNews;
    private String weatherSummary;

    /* =========================
       Getters and Setters
       ========================= */

    public String getCitizenId() {
        return citizenId;
    }

    public void setCitizenId(String citizenId) {
        this.citizenId = citizenId;
    }

    public String getCitizenName() {
        return citizenName;
    }

    public void setCitizenName(String citizenName) {
        this.citizenName = citizenName;
    }

    public String getVillageName() {
        return villageName;
    }

    public void setVillageName(String villageName) {
        this.villageName = villageName;
    }

    public String getProfilePhoto() {
        return profilePhoto;
    }

    public void setProfilePhoto(String profilePhoto) {
        this.profilePhoto = profilePhoto;
    }

    public boolean isProfileCompleted() {
        return profileCompleted;
    }

    public void setProfileCompleted(boolean profileCompleted) {
        this.profileCompleted = profileCompleted;
    }

    public boolean isComplaintsEnabled() {
        return complaintsEnabled;
    }

    public void setComplaintsEnabled(boolean complaintsEnabled) {
        this.complaintsEnabled = complaintsEnabled;
    }

    public boolean isGrievancesEnabled() {
        return grievancesEnabled;
    }

    public void setGrievancesEnabled(boolean grievancesEnabled) {
        this.grievancesEnabled = grievancesEnabled;
    }

    public boolean isSchemesEnabled() {
        return schemesEnabled;
    }

    public void setSchemesEnabled(boolean schemesEnabled) {
        this.schemesEnabled = schemesEnabled;
    }

    public int getTotalComplaints() {
        return totalComplaints;
    }

    public void setTotalComplaints(int totalComplaints) {
        this.totalComplaints = totalComplaints;
    }

    public int getPendingComplaints() {
        return pendingComplaints;
    }

    public void setPendingComplaints(int pendingComplaints) {
        this.pendingComplaints = pendingComplaints;
    }

    public String getLatestNews() {
        return latestNews;
    }

    public void setLatestNews(String latestNews) {
        this.latestNews = latestNews;
    }

    public String getWeatherSummary() {
        return weatherSummary;
    }

    public void setWeatherSummary(String weatherSummary) {
        this.weatherSummary = weatherSummary;
    }
}