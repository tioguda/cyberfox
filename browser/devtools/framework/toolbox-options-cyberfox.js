
var Cc = Components.classes;
var Ci = Components.interfaces;
var Cu = Components.utils;

var ServicesPrefs = Cc["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefService);

Cu.import("resource://gre/modules/FileUtils.jsm");
Cu.import("resource://gre/modules/NetUtil.jsm");
//unused here, only exported
let nsFile = Components.Constructor("@mozilla.org/file/local;1", Ci.nsILocalFile, "initWithPath");

let panelPopUpOther = "";
let agentID = "";

if (typeof gCustomOptionsPanel == "undefined") {var gCustomOptionsPanel = {};};
if (!gCustomOptionsPanel) {gCustomOptionsPanel = {};};

var gCustomOptionsPanel = {


	init: function(e){

	try{	

		panelPopUpOther = document.getElementById("devtools-agent-options-other");
		agentID = document.getElementById("devtools-agent-menu");	
		
		//Get, Load and parse agents.json	
		var jsonFile = FileUtils.getFile("CurProcD", ["agents.json"]);
		
		var jsonContent;	
		var contentChannel = NetUtil.newChannel(jsonFile);
		
		contentChannel.contentType = "application/json";
				 
		NetUtil.asyncFetch(contentChannel, function(aInputStream, aResult) {
		
		  if (!Components.isSuccessCode(aResult)) {
				//Prevent panel activation if agents.json not found!
				document.getElementById("showUserAgent").hidden = true;
				console.log("Were sorry but something has gone wrong while trying to load agents.json (agents.json not found!)" + aResult);
			return;
		  }	
		
			jsonContent = NetUtil.readInputStreamToString(aInputStream, aInputStream.available());

			//Need to check if json is valid, If json not valid don't continue and show error.
			function IsJsonValid(jsonContent) {
					try {
						JSON.parse(jsonContent);
					} catch (e) {
						return false;
					}
				return true;
			}
			
			var myJson; 
				
			if(!IsJsonValid(jsonContent)){
					//Need to throw error message and disable agentID if not valid json.
					agentID.disabled = true;
					console.log("Were sorry but something has gone wrong while trying to parse agents.json (json is not valid!)");
				return;
			} else { 
				myJson = JSON.parse(jsonContent);
			}
			
			var browserListArray = myJson.userAgents[0].browsers;
				
				for (i = 0; browserListArray[i]; i++) {
						
					var menuItemsList = document.getElementById("devtools-agent-menu").appendItem( browserListArray[i].name, browserListArray[i].agent);			

				}
			
		});						
					//Only if known in list will it show only in current panel session, all other cases select user-agent item is set.
					agentID.label = window.navigator.userAgent;
					
					panelPopUpOther.value = "";
					panelPopUpOther.value =	window.navigator.userAgent;				

		
		}catch (e){
				//Catch any nasty errors and output to dialogue and console
				console.log("Were sorry but something has gone wrong while trying to load agents.json " + e);					
			}
			
	},
	
	isEnabled: function(element){
		document.getElementById(element).disabled = false;
	},	
	
	isDisabled: function(element){
		document.getElementById(element).disabled = true;
	},	

	itemSelectedChanged: function() {	
	try{			
			ServicesPrefs.setCharPref("general.useragent.override", agentID.value);
			panelPopUpOther.value = agentID.value;
			this.showOtherUserAgent();
		}catch (e){
				//Catch any nasty errors and output to console
				console.log("Were sorry but something has gone wrong selected item changed event!" + e);					
			}			
	},
			
					
	restoreDefaultUserAgent: function(){	
	try{		
			ServicesPrefs.clearUserPref("general.useragent.override");
			panelPopUpOther.value = "";
			panelPopUpOther.value = window.navigator.userAgent;
			this.hideOtherUserAgent();
		}catch (e){
			//Catch any nasty errors and output to dialogue and console
			console.log("Were sorry but something has gone wrong while attempting restore default useragent!" + e);					
		}			
	},	

	applyOtherUserAgent: function(){	
	try{	
			ServicesPrefs.setCharPref("general.useragent.override", panelPopUpOther.value);
			this.hideOtherUserAgent();
		}catch (e){
			//Catch any nasty errors and output to dialogue and console
			console.log("Were sorry but something has gone wrong while attempting to set custom useragent!" + e);					
		}
	},
	showOtherUserAgent: function(){	
	try{

			this.isEnabled("devtools-agent-options-other");
			this.isEnabled("applyOtherUserAgent");
			this.isEnabled("clearOtherUserAgent");
			
		}catch (e){
			//Catch any nasty errors and output to dialogue and console
			console.log("Were sorry but something has gone wrong while attempting to showOtherUserAgent!" + e);					
		}		
	},

	hideOtherUserAgent: function(){
	try{	

			this.isDisabled("devtools-agent-options-other");
			this.isDisabled("applyOtherUserAgent");
			this.isDisabled("clearOtherUserAgent");
			
		}catch (e){
			//Catch any nasty errors and output to dialogue and console
			console.log("Were sorry but something has gone wrong while attempting to hideOtherUserAgent!" + e);					
		}			
	},

	clearOtherUserAgent: function(){
			this.restoreDefaultUserAgent();
	}

}
window.addEventListener("load", function () { gCustomOptionsPanel.init(); }, false);