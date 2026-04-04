let floatingWidget: HTMLDivElement | null = null;
let currentSelectionText: string = "";

document.addEventListener("mouseup", (e) => {
  if (floatingWidget && floatingWidget.contains(e.target as Node)) {
    return;
  }

  if (floatingWidget && e.target !== floatingWidget) {
    floatingWidget.remove();
    floatingWidget = null;
  }

  const selection = window.getSelection();
  if (!selection || selection.isCollapsed) return;

  const text = selection.toString().trim();
  if (text.length > 0) {
    currentSelectionText = text;
    showAskButton(e.pageX, e.pageY);
  }
});

function showAskButton(x: number, y: number) {
  floatingWidget = document.createElement("div");
  floatingWidget.style.position = "absolute";
  floatingWidget.style.top = `${y + 10}px`;
  floatingWidget.style.left = `${x + 10}px`;
  floatingWidget.style.zIndex = "999999";
  floatingWidget.style.display = "flex";
  floatingWidget.style.flexDirection = "column";

  const btn = document.createElement("button");
  btn.innerText = "✨ Generate Answer from Resume";
  btn.style.padding = "8px 12px";
  btn.style.background = "linear-gradient(90deg, #7b61ff, #6343e8)";
  btn.style.color = "white";
  btn.style.border = "none";
  btn.style.borderRadius = "8px";
  btn.style.cursor = "pointer";
  btn.style.boxShadow = "0 4px 6px rgba(0,0,0,0.1)";
  btn.style.fontFamily = "sans-serif";
  btn.style.fontSize = "13px";
  
  floatingWidget.appendChild(btn);

  btn.addEventListener("mousedown", (e) => {
    e.preventDefault();
    btn.innerText = "✨ Generating...";
    fetchAnswer();
  });

  document.body.appendChild(floatingWidget);
}

function fetchAnswer() {
  if (!chrome || !chrome.runtime || !chrome.runtime.sendMessage) {
    showErrorBox("Extension not available. Please reload the page or enable the extension.");
    return;
  }
  try {
    chrome.runtime.sendMessage({
      action: "suggest",
      selected_text: currentSelectionText
    }, (response: any) => {
      // If chrome.runtime.lastError is set, message failed (often due to being disconnected)
      if (chrome.runtime.lastError) {
        showErrorBox("Failed to connect to extension. Please refresh the page. " + chrome.runtime.lastError.message);
        return;
      }
      
      if (!floatingWidget) return;
      renderResult(response);
    });
  } catch (err: any) {
    // Catches "Extension context invalidated"
    if (err.message.includes("Extension context invalidated")) {
      showErrorBox("Extension was updated! Please refresh this webpage to use it again.");
    } else {
      showErrorBox("Error: " + err.message);
    }
  }
}

function showErrorBox(msg: string) {
  if (!floatingWidget) return;
  floatingWidget.innerHTML = "";
  
  const resultBox = document.createElement("div");
  resultBox.style.background = "#ff4d4d";
  resultBox.style.color = "#fff";
  resultBox.style.padding = "12px";
  resultBox.style.borderRadius = "8px";
  resultBox.style.boxShadow = "0 6px 12px rgba(0,0,0,0.2)";
  resultBox.style.maxWidth = "300px";
  resultBox.style.fontFamily = "sans-serif";
  resultBox.style.fontSize = "14px";
  resultBox.innerText = msg;
  
  floatingWidget.appendChild(resultBox);
}

function renderResult(response: any) {
  if (!floatingWidget) return;
  floatingWidget.innerHTML = "";
  
  const resultBox = document.createElement("div");
  resultBox.style.background = "#2a2a35";
  resultBox.style.color = "#fff";
  resultBox.style.padding = "12px";
  resultBox.style.borderRadius = "8px";
  resultBox.style.boxShadow = "0 6px 12px rgba(0,0,0,0.2)";
  resultBox.style.maxWidth = "300px";
  resultBox.style.fontFamily = "sans-serif";
  resultBox.style.fontSize = "14px";
  
  const textNode = document.createTextNode(response?.suggestion || response?.error || "Error generating response.");
  resultBox.appendChild(textNode);

  const copyBtn = document.createElement("button");
  copyBtn.innerText = "Copy to Clipboard";
  copyBtn.style.marginTop = "12px";
  copyBtn.style.display = "block";
  copyBtn.style.width = "100%";
  copyBtn.style.padding = "8px";
  copyBtn.style.background = "#7b61ff";
  copyBtn.style.color = "white";
  copyBtn.style.border = "none";
  copyBtn.style.borderRadius = "6px";
  copyBtn.style.cursor = "pointer";
  copyBtn.style.fontWeight = "bold";

  copyBtn.addEventListener("mousedown", () => {
    navigator.clipboard.writeText(textNode.nodeValue || "");
    copyBtn.innerText = "Copied!";
    setTimeout(() => {
      if (floatingWidget) floatingWidget.remove();
      floatingWidget = null;
    }, 1000);
  });

  resultBox.appendChild(copyBtn);
  floatingWidget.appendChild(resultBox);
}
