package com.devteria.identity.dto.request;

import java.time.LocalDate;
import java.time.LocalDateTime;

import lombok.Data;

@Data
public class DriverRequest {
    Long id;
    String nationalId;
    String email;
    String fullName;
    String phoneNumber;
    String drivingLicense;
    LocalDate drivingLicenseExpiredDate;
    String defaultTransportationName;
    LocalDateTime createdAt;
    String status;
    String closingReason;
    LocalDateTime endClosingDate;

    @Override
    public String toString() {
        return "DriverRequest{" + "id="
                + id + ", nationalId='"
                + nationalId + '\'' + ", email='"
                + email + '\'' + ", fullName='"
                + fullName + '\'' + ", phoneNumber='"
                + phoneNumber + '\'' + ", drivingLicense='"
                + drivingLicense + '\'' + ", drivingLicenseExpiredDate="
                + drivingLicenseExpiredDate + ", defaultTransportationName='"
                + defaultTransportationName + '\'' + ", createdAt="
                + createdAt + ", status='"
                + status + '\'' + ", closingReason='"
                + closingReason + '\'' + ", endClosingDate="
                + endClosingDate + '}';
    }
}
