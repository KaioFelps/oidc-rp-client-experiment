/**
 * See: https://github.com/panva/oauth4webapi/blob/main/examples/oidc.ts
 * These same values are registered in the proof-of-concept [lti-consumer-poc]
 * application.
 * 
 * [lti-consumer-poc]: https://github.com/KaioFelps/lti-consumer-poc
 */
export const OidcClientConfig = Object.freeze({
    issuer: new URL("http://localhost:3000/oidc"),
    algorithm: "oidc",
    clientId: "test-client-1",
    clientSecret: "test-client-1-secret",
    redirectUri: "http://localhost:4000/callback",
})
