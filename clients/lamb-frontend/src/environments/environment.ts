export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:18080',
  mercadoPago: {
    // Pega aqui la MISMA Public Key que pusiste en
    // infra/lamb-config/config-repo/lamb-finanzas-ms-dev.yml (mercadopago.public-key).
    // Se obtiene en el panel de Mercado Pago > tu aplicacion > Credenciales de prueba.
    publicKey: 'APP_USR-64dd822b-4fe9-434c-9005-83d113e39ce3',
  },
  keycloak: {
    issuer: 'http://localhost:18180/realms/lamb',
    clientId: 'lamb-frontend',
    redirectUri: 'http://localhost:4200/auth/callback',
    logoutRedirectUri: 'http://localhost:4200/',
  },
};
