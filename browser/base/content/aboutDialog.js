# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.

// Services = object with smart getters for common XPCOM services
Components.utils.import("resource://gre/modules/Services.jsm");
//Setup Prompts Service.
var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"].getService(Components.interfaces.nsIPromptService);
//Setup Localised Messages.
var localisedMessages = Components.classes["@mozilla.org/intl/stringbundle;1"].getService(Components.interfaces.nsIStringBundleService); 
let _locMSG = localisedMessages.createBundle("chrome://browser/locale/aboutDialog.properties");

const PREF_EM_HOTFIX_ID = "extensions.hotfix.id";

function init(aEvent)
{
  if (aEvent.target != document)
    return;

  try {
    var distroId = Services.prefs.getCharPref("distribution.id");
    if (distroId) {
      var distroVersion = Services.prefs.getCharPref("distribution.version");

      var distroIdField = document.getElementById("distributionId");
      distroIdField.value = distroId + " - " + distroVersion;
      distroIdField.style.display = "block";

      try {
        // This is in its own try catch due to bug 895473 and bug 900925.
        var distroAbout = Services.prefs.getComplexValue("distribution.about",
          Components.interfaces.nsISupportsString);
        var distroField = document.getElementById("distribution");
        distroField.value = distroAbout;
        distroField.style.display = "block";
      }
      catch (ex) {
        // Pref is unset
        Components.utils.reportError(ex);
      }
    }
  }
  catch (e) {
    // Pref is unset
  }

  // Include the build ID and display warning if this is an "a#" (nightly or aurora) build
  let version = Services.appinfo.version;
  if (/a\d+$/.test(version)) {
    let buildID = Services.appinfo.appBuildID;
    let buildDate = buildID.slice(0,4) + "-" + buildID.slice(4,6) + "-" + buildID.slice(6,8);
    document.getElementById("version").textContent += " (" + buildDate + ")";
    document.getElementById("experimental").hidden = false;
    document.getElementById("communityDesc").hidden = true;
  }
  
  function _Enabled(element){
		document.getElementById(element).hidden = false;
  }
  
   function _Disabled(element){ 
		document.getElementById(element).hidden = true;
  } 
  		
		_Disabled("update-button-checkNow");
		_Enabled("update-button-checking");
		_Enabled("update-button-checking-throbber");		
		_Disabled("update-button-no-update");
		_Disabled("update-button-download");

	 //Clear any previous set urls
	Services.prefs.clearUserPref("app.update.url.manual");		

//If its disabled we don't want to see any buttons here.	
if(!Services.prefs.getBoolPref("app.update.check.enabled")){   
		//hide buttons :P	  
					_Disabled("updateBox");
}	
if(Services.prefs.getCharPref("app.update.channel.type") === "beta"){
	document.getElementById("version").textContent += " beta";
}

 
if(Services.prefs.getBoolPref("app.update.autocheck")){
 
  //Set manual update url from -firefox-branding.js so update in one location is uniform across all references.
  try {
		  var manualCheck = document.getElementById("checkForUpdatesButton");
				manualCheck.setAttribute('href', Services.prefs.getCharPref("app.update.url.manual"));
      } catch (ex) {
        // Pref is unset
        Components.utils.reportError(ex);
      } 
  
  //feature prototype

   try { 
 
//Set Global to disable update checks entirely 
if(Services.prefs.getBoolPref("app.update.check.enabled")){
   
  	//Get Latest Browser Version
	//Unfortunately same origin policy's prevent us using HTTPS here.
	let url = Services.prefs.getCharPref("app.update.check.url");
	let request = Components.classes["@mozilla.org/xmlextras/xmlhttprequest;1"]
					.createInstance(Components.interfaces.nsIXMLHttpRequest);
					  
	request.onload = function(aEvent) {
	
			let text = aEvent.target.responseText;
			
			//Need to check if json is valid, If json not valid don't continue and show error.
			function IsJsonValid(text) {
					try {
						JSON.parse(text);
					} catch (e) {
						return false;
					}
				return true;
			}			
			
			
			let jsObject;
			let currentVersion;
			
			if(!IsJsonValid(text)){
				 		//hide buttons		  
					_Enabled("update-button-checkNow");
					_Disabled("update-button-checking-throbber");
					_Disabled("update-button-checking");
					_Disabled("update-button-no-update");
					_Disabled("update-button-download");
				//Throw error message	
				console.log("Were sorry but something has gone wrong while trying to parse update.json (json is not valid!)");
				//Return error
				return;	
			}else{
				jsObject = JSON.parse(text);
			}
			
			switch (Services.prefs.getCharPref("app.update.channel.type")){
				
				case "release":
					currentVersion = jsObject.release;
				break;

				case "beta":
					currentVersion = jsObject.beta;
				break;				

				case "esr":
					currentVersion = jsObject.esr;
				break;				
			}
			
			
			var manualCheck = document.getElementById("checkForUpdatesButton");				
						
			switch (versions.compareVersions(Services.appinfo.version, currentVersion.toString())){
			
			case false:
					_Disabled("update-button-checking-throbber");
					_Disabled("update-button-checking");
					_Enabled("update-button-download");
			break;
			
			
			case true:
			_Disabled("update-button-checking-throbber");
			_Disabled("update-button-checking");
			Services.prefs.setCharPref("app.update.url.manual", "https://8pecxstudios.com/hooray-your-cyberfox-is-up-to-date-" + Services.appinfo.version);
						_Enabled("update-button-no-update");
						//set the browsers core version in-case "app.update.url.manual" is not changed from a browser update or switched versions.
						manualCheck.setAttribute('href', Services.prefs.getCharPref("app.update.url.manual"));			
			break;
			
			
			
			}
			
			
	};


	request.ontimeout = function(aEvent) {
	
			//Prompt return failed check message for request time-out!
			console.log(_locMSG.GetStringFromName("updateCheckErrorTitle") + " " + _locMSG.GetStringFromName("updateCheckError"));
			prompts.alert(window, _locMSG.GetStringFromName("updateCheckErrorTitle"), _locMSG.GetStringFromName("updateCheckError"));
					_Disabled("update-button-checkNow");
					_Disabled("update-button-checking-throbber");
					_Disabled("update-button-checking");
					_Disabled("update-button-no-update");
					_Enabled("update-button-download");
	};
	
	request.onerror = function(aEvent) {

	//Marked to add better error handling and messages.
	switch (aEvent.target.status){
	
		case 0:
			//Prompt return failed request message for status 0 unsent
			console.log(_locMSG.GetStringFromName("updateCheckErrorTitle") + " " + _locMSG.GetStringFromName("updateRequestError"));	
			prompts.alert(window, _locMSG.GetStringFromName("updateCheckErrorTitle"), _locMSG.GetStringFromName("updateRequestError"));
		break;
		
		case 1:
			console.log("Error Status: " + this.target.status);		
			window.alert("Error Status: " + this.target.status);
		break;
		
		case 2:
			console.log("Error Status: " + this.target.status);	
			window.alert("Error Status: " + this.target.status);
		break;
		
		case 3:
			console.log("Error Status: " + this.target.status);	
			window.alert("Error Status: " + this.target.status);
		break;
				
		case 4:
			console.log("Error Status: " + this.target.status);	
			window.alert("Error Status: " + this.target.status);
		break;
	
		default: aEvent.target.status
			console.log("Error Status: " + this.target.status);	
			window.alert("Error Status: " + this.target.status);
		break;
	
	}
		//hide buttons		  
					_Disabled("update-button-checkNow");
					_Disabled("update-button-checking-throbber");
					_Disabled("update-button-checking");
					_Disabled("update-button-no-update");
					_Disabled("update-button-download");
	};
	
	//Only send async POST requests, Must declare the request header forcing the request to only be for content type json.
	request.open("GET", url, true);
	request.setRequestHeader("Content-Type", "application/json");
	request.send(null);
	
	}
	
} catch (eve) {
        //Show error
        Components.utils.reportError(eve);
      }
	  
	 }else{

	 //Clear any previous set urls
	Services.prefs.clearUserPref("app.update.url.manual");
	 
  //Set manual update url from -firefox-branding.js so update in one location is uniform across all references.
  try {
		  var manualCheck = document.getElementById("checkForUpdatesButton");
				manualCheck.setAttribute('href', Services.prefs.getCharPref("app.update.url.manual"));
      } catch (ex) {
        // Pref is unset
        Components.utils.reportError(ex);
      } 
	 		//hide buttons		  
					_Enabled("update-button-checkNow");
					_Disabled("update-button-checking-throbber");
					_Disabled("update-button-checking");
					_Disabled("update-button-no-update");
					_Disabled("update-button-download");

}	 

}
//Versions.compareVersions where the numeric comparison happens.
//Takes 2 variables installed version number as string & required version number as string, The required version comes from update.json
//Update.json will in future have versions support for esr, beta & alpha builds.
//We will continue using our method over https://developer.mozilla.org/en/docs/Using_nsIXULAppInfo#Version as its working effectively for version.minor version.major revision.
var versions = {
compareVersions: function (_Installed, _Required) {

  try {
        var _Installed_Version = _Installed.split('.');
        var _Required_Version = _Required.split('.');

        for (var i = 0; i < _Installed_Version.length; ++i) {
            _Installed_Version[i] = Number(_Installed_Version[i]);
        }
        for (var i = 0; i < _Required_Version.length; ++i) {
            _Required_Version[i] = Number(_Required_Version[i]);
        }
        if (_Installed_Version.length == 2) {
            _Installed_Version[2] = 0;
        }

        if (_Installed_Version[0] > _Required_Version[0]) return true;
        if (_Installed_Version[0] < _Required_Version[0]) return false;

        if (_Installed_Version[1] > _Required_Version[1]) return true;
        if (_Installed_Version[1] < _Required_Version[1]) return false;

        if (_Installed_Version[2] > _Required_Version[2]) return true;
        if (_Installed_Version[2] < _Required_Version[2]) return false;

        return true;
		
		}catch (rv){
				//Show error
				Components.utils.reportError(rv);
		}
    }
	
	
}