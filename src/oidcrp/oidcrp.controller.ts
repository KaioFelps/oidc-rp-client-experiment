import { Controller, Get, Header, HttpStatus, Inject, Query, Req, Res, Session } from "@nestjs/common";
import * as oauth from "oauth4webapi"
import { OidcClientConfig } from "src/configs/client";
import type { Request, Response } from "express";
import { TokenResponse } from "./token-response";
import { IAuthServer, IClient } from "./auth-server.provider";

@Controller()
export class OidcRPController {
    @Inject(IAuthServer) private as: oauth.AuthorizationServer;
    @Inject(IClient) private client: oauth.Client;

    @Get("init")
    async init(@Session() session: Record<string, unknown>, @Res() response: Response) {
        const codeChallengeMethod = "S256";

        const codeVerifier = oauth.generateRandomCodeVerifier();
        const codeChallange = await oauth.calculatePKCECodeChallenge(codeVerifier);
        const nonce = oauth.generateRandomNonce();

        session.nonce = nonce;
        session.codeVerifier = codeVerifier;

        const authorizationUrl = new URL(this.as.authorization_endpoint!);
        authorizationUrl.searchParams.set("client_id", this.client.client_id);
        authorizationUrl.searchParams.set("redirect_uri", OidcClientConfig.redirectUri);
        authorizationUrl.searchParams.set("response_type", "code");
        authorizationUrl.searchParams.set("scope", "openid email profile");
        authorizationUrl.searchParams.set("code_challenge", codeChallange);
        authorizationUrl.searchParams.set("code_challenge_method", codeChallengeMethod);
        authorizationUrl.searchParams.set("nonce", nonce);
        
        // both can be sent in this case 'cause PoC Auth. Server will resolve this
        authorizationUrl.searchParams.set("acr_values", "1");
        authorizationUrl.searchParams.set("claims", JSON.stringify({
            id_token: { acr: { value: "1", essential: true } }
        }));

        return response.redirect(authorizationUrl.toString());
    }

    @Get("callback")
    async callback(
        @Req() request: Request,
        @Res() response: Response,
        @Session() session: Record<string, unknown>,
    ) {
        const clientAuth = oauth.ClientSecretPost(OidcClientConfig.clientSecret);
        const currentUrl = new URL(`${request.protocol}://${request.host}${request.originalUrl}`);
        const codeVerifier = session.codeVerifier as string;

        let params: URLSearchParams;
        try {
            params = oauth.validateAuthResponse(this.as, this.client, currentUrl);
        } catch (error) {
            if (!(error instanceof oauth.AuthorizationResponseError)) throw error;

            if (error.cause.get("error") === "access_denied") {
                return response
                    .json({ error: "The end-user has denied access to requested resources." })
                    .status(HttpStatus.UNAUTHORIZED);
            }

            return response.redirect("/init");
        }

        const grantResponse = await oauth.authorizationCodeGrantRequest(
            this.as,
            this.client,
            clientAuth,
            params,
            OidcClientConfig.redirectUri,
            codeVerifier, {
                [oauth.allowInsecureRequests]: true
            });
        
        const nonce = session.nonce as string;
        const result = await oauth.processAuthorizationCodeResponse(
            this.as,
            this.client,
            grantResponse,
            { expectedNonce: nonce, requireIdToken: true });

        session.tokenResponse = {
            accessToken: result.access_token,
            refreshToken: result.refresh_token,
            expiresIn: result.expires_in,
            idToken: result.id_token,
            scope: result.scope
        } satisfies TokenResponse;

        const claims = oauth.getValidatedIdTokenClaims(result);
        if (!claims) throw new Error("Expected to receive a IDToken, but got none.");

        session.idToken = claims;

        return response.redirect("/info");
    }

    @Header("Content-Type", "application/json")
    @Get("info")
    async getUserInfo(@Session() session: Record<string, unknown>, @Res() response: Response) {
        if (!("idToken" in session) || !("tokenResponse" in session)) {
            return response.redirect("/init");
        }

        try {
            const { sub } = session.idToken as oauth.IDToken;
            const { accessToken } = session.tokenResponse as TokenResponse;

            const userResponse = await oauth.userInfoRequest(this.as, this.client, accessToken, {
                [oauth.allowInsecureRequests]: true
            });

            const result = await oauth.processUserInfoResponse(
                this.as,
                this.client,
                sub,
                userResponse);

            return response.json(result);
        } catch (error) {
            if (!(error instanceof oauth.WWWAuthenticateChallengeError)) throw error;
            return response.redirect("/init");
        }
    }
}