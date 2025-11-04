export type TokenResponse = {
    readonly accessToken: string;
    readonly expiresIn?: number;
    readonly idToken?: string;
    readonly refreshToken?: string;
    readonly scope?: string;
}
