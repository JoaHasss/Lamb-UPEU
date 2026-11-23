export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:18080',
  mercadoPago: {
    publicKey: 'APP_USR-849c20b2-4269-4196-aded-4e3d353529a1',
  },
  keycloak: {
    issuer: 'http://localhost:18180/realms/lamb',
    clientId: 'lamb-frontend',
    redirectUri: 'http://localhost:4200/auth/callback',
    logoutRedirectUri: 'http://localhost:4200/',
  },
};
