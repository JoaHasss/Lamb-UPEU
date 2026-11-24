export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:18080',
  mercadoPago: {
    // Pega aqui la MISMA Public Key que pusiste en
    // infra/lamb-config/config-repo/lamb-finanzas-ms-dev.yml (mercadopago.public-key).
    // Se obtiene en el panel de Mercado Pago > tu aplicacion > Credenciales de prueba.
    publicKey: 'PEGA_AQUI_TU_PUBLIC_KEY_DE_PRUEBA',
  },
  keycloak: {
    issuer: 'http://localhost:18180/realms/lamb',
    clientId: 'lamb-frontend',
    redirectUri: 'http://localhost:4200/auth/callback',
    logoutRedirectUri: 'http://localhost:4200/',
  },
};
