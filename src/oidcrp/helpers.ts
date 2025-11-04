import { allowInsecureRequests, discoveryRequest, DiscoveryRequestOptions, processDiscoveryResponse } from "oauth4webapi"
import { OidcClientConfig } from "src/configs/client"

export async function  getAuthServer() {
    const { issuer, algorithm } = OidcClientConfig;

    const options: DiscoveryRequestOptions = { algorithm };
    options[allowInsecureRequests] = true;
    const as = await discoveryRequest(issuer, options)
        .then(response => processDiscoveryResponse(OidcClientConfig.issuer, response));

    return as;
}