document.addEventListener("DOMContentLoaded", function () {
  const openExtensionButton = document.getElementById("open-extension");
  openExtensionButton.addEventListener("click", function () {
    chrome.tabs.create({
      url: "https://pxi-fusion.com/extension"
    });
  });
});