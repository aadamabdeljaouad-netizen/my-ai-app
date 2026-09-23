window.addEventListener("message", (event) => {
    if (event.source !== window) return;

    if (event.data && event.data.type === "TRIGGER_GENERATION") {
        console.log("تم استلام طلب التوليد من الواجهة:", event.data);
        chrome.runtime.sendMessage(event.data);
    }
});

chrome.runtime.onMessage.addListener((request) => {
    if (request.type === "EXECUTE_TARGET_JOB") {
        const targetIframe = document.getElementById("targetIframe");
        if (!targetIframe?.contentWindow) {
            console.warn("تعذر الوصول إلى إطار موقع التوليد.");
            return;
        }

        targetIframe.contentWindow.postMessage({
            type: "EXECUTE_TARGET_JOB",
            prompt: request.prompt,
            mediaType: request.mediaType
        }, "https://aifreeforever.com");
        return;
    }

    if (request.type === "GENERATION_RESULT") {
        window.postMessage({
            type: "MEDIA_READY",
            url: request.url,
            mediaType: request.mediaType
        }, "*");
    }
});