import { Controller, Get, Header, Inject, Req, Res, Session } from "@nestjs/common";
import { getAuthServer } from "./helpers";
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
        authorizationUrl.searchParams.set("scope", "openid");
        authorizationUrl.searchParams.set("code_challenge", codeChallange);
        authorizationUrl.searchParams.set("code_challenge_method", codeChallengeMethod);
        authorizationUrl.searchParams.set("nonce", nonce);

        response.redirect(authorizationUrl.toString());
    }

    @Get("callback")
    async callback(@Req() request: Request, @Session() session: Record<string, unknown>) {
        const clientAuth = oauth.ClientSecretPost(OidcClientConfig.clientSecret);
        const currentUrl = new URL(`${request.protocol}://${request.host}${request.originalUrl}`);
        const codeVerifier = session.codeVerifier as string;

        const params = oauth.validateAuthResponse(this.as, this.client, currentUrl);

        const response = await oauth.authorizationCodeGrantRequest(
            this.as,
            this.client,
            clientAuth,
            params,
            OidcClientConfig.redirectUri,
            codeVerifier);
        
        const nonce = session.nonce as string;
        const result = await oauth.processAuthorizationCodeResponse(
            this.as,
            this.client,
            response,
            { expectedNonce: nonce, requireIdToken: true });

        console.debug(result);
        session.tokenResponse = {
            accessToken: result.access_token,
            refreshToken: result.refresh_token,
            expiresIn: result.expires_in,
            idToken: result.id_token,
            scope: result.scope
        } satisfies TokenResponse;

        const claims = oauth.getValidatedIdTokenClaims(result);
        if (!claims) throw new Error("Expected to receive a IDToken, but got none.");

        console.debug(claims)
        session.idToken = claims;
    }

    @Header("Content-Type", "application/json")
    @Get("info")
    async getUserInfo(@Session() session: Record<string, unknown>) {
        const { sub } = session.idToken as oauth.IDToken;
        const { accessToken } = session.tokenResponse as TokenResponse;

        const response = await oauth.userInfoRequest(this.as, this.client, accessToken);
        const result = await oauth.processUserInfoResponse(
            this.as,
            this.client,
            sub,
            response);

        console.debug(result);
        return result;
    }
}