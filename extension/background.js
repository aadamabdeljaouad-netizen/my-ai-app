let dashboardTabId = null;

chrome.runtime.onMessage.addListener((message, sender) => {
    if (message.type === "TRIGGER_GENERATION") {
        if (sender.tab) dashboardTabId = sender.tab.id;
        if (dashboardTabId == null) return;

        chrome.tabs.sendMessage(dashboardTabId, {
            type: "EXECUTE_TARGET_JOB",
            prompt: message.prompt,
            mediaType: message.mediaType
        }).catch(() => {
            console.warn("تعذر إرسال الطلب إلى إطار موقع التوليد.");
        });
    } else if (message.type === "JOB_FINISHED") {
        if (dashboardTabId == null || !message.url) return;

        chrome.tabs.sendMessage(dashboardTabId, {
            type: "GENERATION_RESULT",
            url: message.url,
            mediaType: message.mediaType
        }).catch(() => {
            console.warn("تعذر إعادة النتيجة إلى لوحة التحكم.");
        });
    }
});

chrome.tabs.onRemoved.addListener((tabId) => {
    if (tabId === dashboardTabId) dashboardTabId = null;
});