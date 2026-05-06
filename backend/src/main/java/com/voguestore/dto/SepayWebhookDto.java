package com.voguestore.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import java.math.BigDecimal;

/**
 * DTO for SePay webhook callback data.
 * Fields match SePay's webhook payload format.
 * See: https://docs.sepay.vn/tich-hop-webhooks.html
 */
@Data
public class SepayWebhookDto {
    private Long id;
    private String gateway;
    
    @JsonProperty("transactionDate")
    private String transactionDate;
    
    @JsonProperty("accountNumber")
    private String accountNumber;
    
    @JsonProperty("subAccount")
    private String subAccount;
    
    @JsonProperty("transferType")
    private String transferType;  // "in" or "out"
    
    @JsonProperty("transferAmount")
    private BigDecimal transferAmount;
    
    private BigDecimal accumulated;
    private String code;
    private String content;
    
    @JsonProperty("referenceCode")
    private String referenceCode;
    
    private String description;
}
