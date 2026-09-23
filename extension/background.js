let dashboardTabId = null;
let targetTabId = null;

chrome.runtime.onMessage.addListener((message, sender) => {
    if (message.type === "TRIGGER_GENERATION") {
        if (sender.tab) dashboardTabId = sender.tab.id;

        chrome.tabs.create({ url: "https://aifreeforever.com/", active: true }, (tab) => {
            targetTabId = tab.id;

            const sendJob = () => {
                if (targetTabId !== tab.id) return;
                chrome.tabs.sendMessage(tab.id, {
                    type: "EXECUTE_TARGET_JOB",
                    prompt: message.prompt,
                    mediaType: message.mediaType
                }).catch(() => {
                    console.warn("تعذر إرسال الطلب إلى صفحة التوليد.");
                });
            };

            chrome.tabs.onUpdated.addListener(function onUpdated(updatedTabId, changeInfo) {
                if (updatedTabId !== tab.id || changeInfo.status !== "complete") return;
                chrome.tabs.onUpdated.removeListener(onUpdated);
                sendJob();
            });
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
    if (tabId === targetTabId) targetTabId = null;
});