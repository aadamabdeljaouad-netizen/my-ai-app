window.addEventListener("message", (event) => {
    if (event.source !== window) return;

    if (event.data && event.data.type === "TRIGGER_GENERATION") {
        console.log("تم استلام طلب التوليد من الواجهة:", event.data);
        chrome.runtime.sendMessage(event.data);
    }
});

chrome.runtime.onMessage.addListener((request) => {
    if (request.type === "GENERATION_RESULT") {
        window.postMessage({
            type: "MEDIA_READY",
            url: request.url,
            mediaType: request.mediaType
        }, "*");
    }
});