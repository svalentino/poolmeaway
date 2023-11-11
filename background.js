let USERTAB;
let RESETTAB;
let failedScriptExecution = false;

function log(...messages){
  const functionName = log.caller.name || 'background.js';
  console.log(`${functionName}: `, ...messages);
}

async function getCurrentTab() {
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

async function goToSocketPage() {
  // Track tab from which the extension is called
  USERTAB = tab;
  log("user tab saved", USERTAB)

  chrome.tabs.create(
    { url: "chrome://net-internals/#sockets" },
    function (tab) {
      // Track new tab being created
      RESETTAB = tab;
      log("chrome://net-internals/#sockets tab opened: ", RESETTAB);
    }
  );
}

async function clickResetButtons(tabId) {
  if (!tabId) {
    tabId = (await getCurrentTab()).id;
  }
  return chrome.scripting.executeScript({
    target: { tabId },
    function: function() {
      document.querySelector("#sockets-view-close-idle-button").click();
      document.querySelector("#sockets-view-flush-button").click();
      log("clicked on 'Close idle sockets' and Flush socket pools' buttons")
    }
  });
}

// To be able to run scripts on a tab only once it's fully loaded, we have to
// add a listener on the "onUpdated" event
function onUpdatedHandler(tabId, changeInfo, tab) {
  if ( ! RESETTAB ) {
    log("the RESET TAB hasn't been opened yet. Exiting handler...");
    return;
  }
  if (failedScriptExecution) {
    log("no rights to execute scripts in chrome:// urls. Exiting handlers...");
    return;
  }

  log("processing: tab id => ", tabId, "status => ", tab.status, "tab => ", tab);

  if (RESETTAB && tabId === RESETTAB.id && changeInfo.status == "complete" && tab.active) {
    clickResetButtons(tabId)
      .then(function () {
        // If successful, return to the previous user tab
        chrome.tabs.remove(RESETTAB.id);
        chrome.tabs.update(USERTAB.id, { selected: true });
        RESETTAB = undefined;
      })
      .catch(error => handleScriptError(error));
  }
}
chrome.tabs.onUpdated.addListener(onUpdatedHandler);

function showWarningBadge() {
  chrome.action.setBadgeText({ text: '!' });
  chrome.action.setBadgeBackgroundColor({ color: '#EBB134' });
}

function handleScriptError(error) {
  log("error detected in the script execution => ", error);
  showWarningBadge();
  if (error == 'Error: Cannot access a chrome:// URL') {
    chrome.action.setPopup({ popup: "nopermissions.html" });
    failedScriptExecution = true;
  } else {
    chrome.action.setPopup({ popup: "unknown-error.html" });
  };
}

function resetBadge() {
  chrome.action.setBadgeText({ text: '' });
}

function messageHandler(message, sender, sendResponse) {
  log("message received =>", message)
  switch (message.action) {
    case 'resetStatus':
      resetBadge();
      failedScriptExecution = false;
      chrome.action.setPopup({ popup: '' });
      break;
    case 'runMain':
      main();
  }
}

chrome.runtime.onMessage.addListener(messageHandler);

// Add listener when the icon of the extension gets clicked
// chrome.action.onClicked.addListener(goToSocketPage);
async function main() {
  tab = await getCurrentTab();

  if (tab.url != "chrome://net-internals/#sockets" ) {
    log("Opening new chrome://net-internals/#sockets tab")
    await goToSocketPage();
  } else {
    log("already in chrome://net")
    if (failedScriptExecution) {
      log("extension doesn't have rights to run scripts. Exiting main..");
      return;
    }
    clickResetButtons().catch(error => handleScriptError(error));
  };
}
chrome.action.onClicked.addListener(main);
