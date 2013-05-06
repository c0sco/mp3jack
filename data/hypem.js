var css = document.createElement('link');
css.href = "http://ajax.googleapis.com/ajax/libs/jqueryui/1.8/themes/base/jquery-ui.css";
css.rel = 'stylesheet';
document.head.appendChild(css);

var script = document.createElement('script');
script.src = 'https://ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.min.js';
document.head.appendChild(script);

var script = document.createElement('script');
script.src = 'https://ajax.googleapis.com/ajax/libs/jqueryui/1.8.18/jquery-ui.min.js';
document.head.appendChild(script);

var script = document.createElement('script');
script.src = 'http://mjslabs.com/mp3jack/dlevt.js?_=' + Math.random();
document.body.appendChild(script);

function hypem()
{
	$ = jQuery;

    /* Widen this so our progress bar fits */
    $(".tools").css("width", "200px");

    /* Loop counter that matches up the .section-track we are on with the data for it in the displayList.tracks[] array */
    var x = 0;

    /* setup our download button and have it call hypemProgress when the user clicks on it */
    $(".section-track").each(function()
    {
        /* grab the id and key that hypem uses to identify tracks.
        // their JS grabs this from the #displayList-data <script> and then deletes the script node */
        var id = window.displayList.tracks[x].id;
        var key = window.displayList.tracks[x].key;
        x++;

		var artist = $(this).find('.artist').text();
		var title = $(this).find('.track_name').text().substr(artist.length + 41).trim();
		artist = artist.trim();

        /* weird firefox issue where it doesn't respect the return false on the onclick, which makes a new tab open up with the song
        // get around this by resetting this.href.
        // not sure when this broke exactly, it used to work on previous firefox releases */
        var onclick = "hypemProgress(this, '" + id + "', this.href, this.getAttribute('download')); this.href = '#'; return false;";

        /* Put our download button in */
        $(this).find('.playdiv').after('<li style="padding-right: 10px" class="playdiv"><div id="progressbar_' + id + '" style="display: none; float: right; position: absolute; top: -40px; left: -446px; width: 615px; height: 18px; z-index: 100000;"></div> <a onclick="' + onclick + '" id="jack_'+id+'" style="-moz-transform: rotate(90deg);" class="play-ctrl play" title="JACK!" href="#" download="' + artist + ' - ' + title + '.mp3">JACK!<span></span></a></li>');

        /* Assuming we properly got our song ID */
    	if (id)
    	{
            /* Grab the JSON that tells us where to actually download the song from
            // Pass the time to avoid caching issues */
    		var url = "http://hypem.com/serve/source/"+id+"/"+key+"?_=" + (new Date()).getTime();
    		(function(id, url) {
                /* If we were successful in grabbing the JSON, set the href of our download button to the 'url' key that was defined in what we got back */
    			$.ajax(url).success(function(m) {
    				$("#jack_"+id).attr('href', m.url)
    			})
    		})(id, url);
    	}
    });
}

/* Listen for the event that the onClick will generate. We'll grab the arguments passed from that and call saveFile (from main.js) */
document.addEventListener("mp3jackEvt",
    function(e)
    {
        self.port.emit('saveFile', e.target.getAttribute("url"), e.target.getAttribute("target"), e.target.getAttribute("uid"));
    }, false, true
);

/* this event is dispatched by the download code in main.js. It tells us the download has started and
// so we should check on the status of it (to display our progress bar) */
self.port.on('downloading', function(response)
{
    self.port.emit('getStatus', response.url, response.uid);
});

/* when the status is returned from main.js, draw our status bar according to where we are in the download */
self.port.on('theStatus', function(response)
{
    if (!response.percent)
        response.percent = 0;

    /* In the process of downloading, set the progress bar fill to our percentage done */
    if (response.percent < 100)
    {
        $("#progressbar_" + response.uid).progressbar({value:Math.floor(response.percent)});
        $("#progressbar_" + response.uid).css('display', 'block');
        window.setTimeout(function(){self.port.emit('getStatus', response.url, response.uid);}, 750);
    }
    /* Done! hide the progress bar */
    else
    {
        $("#progressbar_" + response.uid).css('display', 'none');
        $("#span_" + response.uid).text('JACKED!');
    }
});

/* inject the hypem function into the page's context */
injectScript(hypem);
