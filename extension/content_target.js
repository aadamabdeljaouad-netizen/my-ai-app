let jobCompleted = false;

chrome.runtime.onMessage.addListener((request) => {
    if (request.type !== "EXECUTE_TARGET_JOB") return;

    console.log("جاري البدء في التعبئة والتوليد الآلي...");

    const inputArea = document.querySelector("textarea") || document.querySelector("input[type='text']");
    if (inputArea) {
        inputArea.value = request.prompt;
        inputArea.dispatchEvent(new Event("input", { bubbles: true }));
        inputArea.dispatchEvent(new Event("change", { bubbles: true }));
    }

    const existingMedia = new Set(
        [...document.querySelectorAll("img[src], video[src], video source[src]")]
            .map((element) => element.currentSrc || element.src)
            .filter(Boolean)
    );

    const submitBtn = document.querySelector("button[type='submit']") || document.querySelector("button.generate-btn");
    if (submitBtn) submitBtn.click();

    const reportResult = () => {
        if (jobCompleted) return;

        const media = [...document.querySelectorAll("img[src], video[src], video source[src]")]
            .map((element) => element.currentSrc || element.src)
            .find((url) => url && !existingMedia.has(url) && !url.startsWith("data:"));

        if (!media) return;
        jobCompleted = true;
        chrome.runtime.sendMessage({
            type: "JOB_FINISHED",
            url: media,
            mediaType: request.mediaType
        });
        observer.disconnect();
    };

    const observer = new MutationObserver(reportResult);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["src"] });
    reportResult();
});