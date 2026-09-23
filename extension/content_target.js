const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

const getText = (element) => [
    element.innerText,
    element.textContent,
    element.getAttribute("aria-label"),
    element.getAttribute("title")
].filter(Boolean).join(" ").toLowerCase();

const getControls = () => [...document.querySelectorAll(
    "button, [role='button'], input[type='button'], input[type='submit']"
)];

const findInput = () => document.querySelector("textarea") || document.querySelector("input[type='text']");

const findControl = (patterns, excludedPatterns = []) => getControls().find((element) => {
    const text = getText(element);
    return patterns.some((pattern) => pattern.test(text)) &&
        !excludedPatterns.some((pattern) => pattern.test(text));
});

const getMediaUrl = (mediaType, existingMedia) => {
    const selectors = mediaType === "video"
        ? ["video[src]", "video source[src]", "a[href*='.mp4']", "a[href*='video']"]
        : ["img[src]", "a[href*='.png']", "a[href*='.jpg']", "a[href*='.jpeg']", "a[href*='image']"];

    return selectors
        .flatMap((selector) => [...document.querySelectorAll(selector)])
        .map((element) => element.currentSrc || element.src || element.href)
        .find((url) => url && !existingMedia.has(url) && !url.startsWith("data:"));
};

const waitForInput = () => new Promise((resolve, reject) => {
    const inputArea = findInput();
    if (inputArea) {
        resolve(inputArea);
        return;
    }

    const observer = new MutationObserver(() => {
        const nextInput = findInput();
        if (!nextInput) return;
        observer.disconnect();
        clearTimeout(timeoutId);
        resolve(nextInput);
    });
    const timeoutId = setTimeout(() => {
        observer.disconnect();
        reject(new Error("لم يظهر مربع النص في موقع التوليد."));
    }, 15000);
    observer.observe(document.documentElement, { childList: true, subtree: true });
});

const executeJob = async (request) => {
    if (request.type !== "EXECUTE_TARGET_JOB") return;

    console.log("جاري البدء في التعبئة والتوليد الآلي...");

    const existingMedia = new Set(
        [...document.querySelectorAll("img[src], video[src], video source[src], a[href]")]
            .map((element) => element.currentSrc || element.src || element.href)
            .filter(Boolean)
    );
    let jobCompleted = false;
    let observer;
    const reportResult = () => {
        if (jobCompleted) return;
        const media = getMediaUrl(request.mediaType, existingMedia);
        if (!media) return;

        jobCompleted = true;
        observer?.disconnect();
        chrome.runtime.sendMessage({
            type: "JOB_FINISHED",
            url: media,
            mediaType: request.mediaType
        });
    };

    observer = new MutationObserver(reportResult);
    observer.observe(document.documentElement, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["src", "href"]
    });

    try {
        const inputArea = await waitForInput();
        const valueSetter = Object.getOwnPropertyDescriptor(
            Object.getPrototypeOf(inputArea),
            "value"
        )?.set;
        valueSetter?.call(inputArea, request.prompt);
        if (!valueSetter) inputArea.value = request.prompt;
        inputArea.dispatchEvent(new Event("input", { bubbles: true }));
        inputArea.dispatchEvent(new Event("change", { bubbles: true }));

        const generatePatterns = [/generate/i, /create/i, /render/i, /إنشاء/i, /توليد/i];
        const modePatterns = request.mediaType === "video"
            ? [/video/i, /فيديو/i, /motion/i]
            : [/image/i, /صورة/i, /photo/i];
        const modeButton = findControl(modePatterns, generatePatterns);

        if (modeButton) {
            modeButton.click();
            await wait(200);
        }

        const submitBtn = findControl(generatePatterns, modePatterns) ||
            document.querySelector("button[type='submit']");
        if (submitBtn) submitBtn.click();
        reportResult();
    } catch (error) {
        observer.disconnect();
        console.warn(error.message);
    }
};

chrome.runtime.onMessage.addListener(executeJob);

window.addEventListener("message", (event) => {
    if (window.parent !== window.top || event.source !== window.top) return;
    executeJob(event.data);
});