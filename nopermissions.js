// This allows to register an event that is triggered when the user clicks
// on the extension icon while there is a "popup" set
document.addEventListener('DOMContentLoaded', function() {
  chrome.runtime.sendMessage({ action: "runMain" });
});
