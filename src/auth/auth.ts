import fs from "fs";

const TOKEN_FILE = "./twitch_token.json"

export function loadToken() {
    if (!fs.existsSync(TOKEN_FILE)) return;
    return JSON.parse(fs.readFileSync(TOKEN_FILE, "utf-8"));
};

export function validToken() {
    const tokenData = loadToken();

    if (tokenData && tokenData.access_token && tokenData.expires_in && Date.now() < tokenData.expires_in) return true;
    else return false;
};

export function saveToken(tokenData) {
    fs.writeFileSync(TOKEN_FILE, JSON.stringify(tokenData, null, 2));
};
