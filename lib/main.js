// Modules needed
var pageMod = require("page-mod");
var self = require("self");
var prefs = require("simple-prefs");
const { Unknown } = require('api-utils/xpcom');
const { Cc, Ci } = require('chrome');

/* Global used to store the download stats of the file we are currently downloading */
var dlStats = {};

/* Define all the things we are going to do to hypem.com */
pageMod.PageMod({
    include: "*.hypem.com",
    contentScriptFile:
    [
        self.data.url("jquery.js"),
        self.data.url("jquery-ui.js"),
        self.data.url("injectScript.js"),
        self.data.url("hypem.js")
    ],
    onAttach: function(worker)
    {
        /* When we get a saveFile event, start the download and transmit the downloading event */
        worker.port.on('saveFile', function(url, name, uid)
        {
            if (downloadFile(url, name))
                worker.port.emit("downloading", {'url': url, 'uid': uid});
        });

        /* When we get a getStatus event send back the status of the download with a theStatus event */
        worker.port.on('getStatus', function(url, uid)
        {
            worker.port.emit('theStatus', {'percent': dlStats[url], 'url': url, 'uid': uid});
        });
    }
});

/* Downloader code */
function downloadFile(url, name, target)
{
    const nsIFilePicker = Ci.nsIFilePicker;

    var fp = Cc["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);

    var windowMediator = Cc["@mozilla.org/appshell/window-mediator;1"].getService(Ci.nsIWindowMediator);
    var window = windowMediator.getMostRecentWindow("");

    /* Our "where to save to" window */
    fp.init(window, "Save media to...", nsIFilePicker.modeSave);

    /* Default the file name to the artist/track info */
    fp.defaultString = name;

    var rv = fp.show();

    if (rv == nsIFilePicker.returnOK || rv == nsIFilePicker.returnReplace)
    {
        /* create a persist and uri object */
        var persist = Cc["@mozilla.org/embedding/browser/nsWebBrowserPersist;1"].createInstance(Ci.nsIWebBrowserPersist);
        var obj_URI = Cc["@mozilla.org/network/io-service;1"].getService(Ci.nsIIOService).newURI(url, null, null);

        /* The object that reports our download status */
        persist.progressListener =
        {
            /* Calculates the percentage done as the download occurs and stores it in dlStats for the getStatus event code up above */
            onProgressChange: function(aWebProgress, aRequest, aCurSelfProgress, aMaxSelfProgress, aCurTotalProgress, aMaxTotalProgress)
            {  
                var percentComplete = (aCurTotalProgress/aMaxTotalProgress) * 100;
                dlStats[url] = percentComplete;
            },
            onStateChange: function()
            {
                /* Firefox requires this be defined even though we don't need it for anything */
            }
        }

        /* do the save */
        persist.saveURI(obj_URI, null, null, null, "", fp.file, null);
        
        return true;
    }
    else
        return false;
}
