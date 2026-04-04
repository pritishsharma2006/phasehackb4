chrome.runtime.onMessage.addListener((request: any, _sender: any, sendResponse: any) => {
  if (request.action === "suggest") {
    if (!request.selected_text || request.selected_text.trim() === "") {
      sendResponse({ error: "No text selected" });
      return true;
    }
    const formData = new FormData();
    formData.append("question", request.selected_text.trim());

    fetch("http://localhost:8000/api/suggest", {
      method: "POST",
      body: formData
    })
    .then(res => {
      if (!res.ok) {
        return res.text().then(text => { throw new Error(`HTTP ${res.status}: ${text}`); });
      }
      return res.json();
    })
    .then(data => sendResponse({ suggestion: data.suggestion }))
    .catch(err => sendResponse({ error: err.message }));
    
    return true; 
  }
});
