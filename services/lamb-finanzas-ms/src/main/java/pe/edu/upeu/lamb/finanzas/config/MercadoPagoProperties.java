package pe.edu.upeu.lamb.finanzas.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "mercadopago")
public class MercadoPagoProperties {

    private String publicKey;
    private String accessToken;
    // Checkout Pro: a donde Mercado Pago redirige al navegador segun el resultado del pago.
    private String backUrlSuccess;
    private String backUrlPending;
    private String backUrlFailure;
    // Opcional: solo funciona si el Gateway es alcanzable desde internet (no localhost).
    private String notificationUrl;

    public String getPublicKey() {
        return publicKey;
    }

    public void setPublicKey(String publicKey) {
        this.publicKey = publicKey;
    }

    public String getAccessToken() {
        return accessToken;
    }

    public void setAccessToken(String accessToken) {
        this.accessToken = accessToken;
    }

    public String getBackUrlSuccess() {
        return backUrlSuccess;
    }

    public void setBackUrlSuccess(String backUrlSuccess) {
        this.backUrlSuccess = backUrlSuccess;
    }

    public String getBackUrlPending() {
        return backUrlPending;
    }

    public void setBackUrlPending(String backUrlPending) {
        this.backUrlPending = backUrlPending;
    }

    public String getBackUrlFailure() {
        return backUrlFailure;
    }

    public void setBackUrlFailure(String backUrlFailure) {
        this.backUrlFailure = backUrlFailure;
    }

    public String getNotificationUrl() {
        return notificationUrl;
    }

    public void setNotificationUrl(String notificationUrl) {
        this.notificationUrl = notificationUrl;
    }
}
