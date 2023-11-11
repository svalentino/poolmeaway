document.getElementById("reset-btn").addEventListener("click", function () {
  chrome.runtime.sendMessage({ action: "resetStatus" });
  window.close();
});
