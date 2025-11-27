export const withRateLimit = rateLimit(4_000);

function rateLimit(delayMS: number) {
    let lastTime = 0;

    return async function <T>(fn: () => Promise<T>): Promise<T | null> {
        const now = Date.now();
        if (now - lastTime < delayMS) {
            // console.log(`rate limited! Time left: ${(now - lastTime) / 1000}`);
            return;
        }
        lastTime = now;
        return await fn();
    };
};




