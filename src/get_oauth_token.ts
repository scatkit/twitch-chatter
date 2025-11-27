import dotenv from "dotenv";
import { authConfig } from "./appConfig.ts";
import { loadToken, saveToken, validToken } from "./auth/auth.ts";

export async function getOauthToken() {
    const tokenData = loadToken();
    if (validToken()) tokenData;

    if (tokenData && tokenData.refresh_token) {
        const params = new URLSearchParams({
            client_id: authConfig.twitchClientId,
            client_secret: authConfig.twitchClientSecret,
            grant_type: "refresh_token",
            refresh_token: tokenData.refresh_token,
        });

        const resp = await fetch("https://id.twitch.tv/oauth2/token", {
            method: "POST",
            body: params,
        });

        const data = await resp.json();
        data.expires_in = Date.now() + (data.expires_in * 1000) - 60_000;
        saveToken(data);

        return data.access_token;
    }

    return await deviceAuth();
};

async function deviceAuth() {
    const params = new URLSearchParams({
        client_id: authConfig.twitchClientId,
        scopes: "chat:read chat:edit",
    });
    const resp = await fetch("https://id.twitch.tv/oauth2/device", { method: "POST", body: params });
    const { device_code, user_code, verification_uri, interval } = await resp.json();
    console.log(verification_uri);

    return new Promise((resolve, reject) => {
        const intervalLoop = setInterval(async () => {
            const params = new URLSearchParams({
                client_id: authConfig.twitchClientId,
                scopes: "chat:read chat:edit",
                device_code: device_code,
                grant_type: "urn:ietf:params:oauth:grant-type:device_code",

            });
            const tokenResp = await fetch("https://id.twitch.tv/oauth2/token", { method: "POST", body: params });
            const data = await tokenResp.json();
            if (tokenResp.ok) {
                clearInterval(intervalLoop);
                data.expires_in = Date.now() + (data.expires_in * 1000) - 60_000;
                saveToken(data);
                resolve(data.access_token);
            } else if (data.message !== "authorization_pending") {
                clearInterval(intervalLoop);
                reject(`Error: ${data.message}`);
            };
        }, (interval * 1000) + 500);
    });
}
