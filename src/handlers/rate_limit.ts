export const withRateLimit = rateLimit(8_000);

function formatTime(timestamp: number) {
    const dateObj = new Date(timestamp);

    const hours = dateObj.getHours().toString().padStart(2, "0");
    const minutes = dateObj.getMinutes().toString().padStart(2, "0");
    const seconds = dateObj.getSeconds().toString().padStart(2, "0");

    return `${hours}:${minutes}:${seconds}`;
};

function rateLimit(delayMS: number) {
    let lastTime = 0;
    let pendingPromise = false;

    return async function <T>(fn: () => Promise<T>): Promise<T> | null {
        if (pendingPromise) {
            console.log("call droped: pending...")
            return null;
        };

        const now = Date.now();
        const timeSinceLastCall = now - lastTime;
        if (timeSinceLastCall < delayMS) {
            console.log(`rate limit! now: ${formatTime(now)} last: ${formatTime(lastTime)} Passed: ${now - lastTime}ms`);
            return null;
        };

        pendingPromise = true;
        try {
            const resp = await fn();
            lastTime = Date.now();
            console.log("llm response at:", formatTime(lastTime));
            return resp;
        } finally {
            pendingPromise = false;
        }
    };
};




