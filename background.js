// background.js

chrome.runtime.onMessage.addListener(
	function(request, sender, sendResponse){
		
		if(request.onlyZoom||request.invert||request.enable){
			chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    			var activeTab = tabs[0];
    			chrome.tabs.sendMessage(activeTab.id, request);
  			});	
		}
	}
);
