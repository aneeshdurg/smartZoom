var video, canvas, context;
var t = 70;
var sensitivity = 5000;
var invert = false;
var onlyZoom = false;
var enable = true;
console.log("from content");
document.body.innerHTML += "<video id='zoom-feed' hidden></video>";
document.body.innerHTML += "<canvas id='zoom-draw' hidden></canvas>";
initialize();
function initialize(){
	chrome.storage.local.get("t", function(data){
			if(chrome.runtime.lastError)
				t=70;
			else
				t = parseInt(data.t);
		});
	chrome.storage.local.set({"w":0});
	navigator.getUserMedia = ( navigator.getUserMedia ||
                       navigator.webkitGetUserMedia ||
                       navigator.mozGetUserMedia ||
                       navigator.msGetUserMedia);
	video = document.getElementById("zoom-feed");
	canvas = document.getElementById("zoom-draw");
	context = canvas.getContext("2d");
	width = 320;
	height = 180;
	canvas.width = width;
	canvas.height = height;
	updateLimits();
	var constraints = {
		video: {
			mandatory: {
				maxWidth: 320,
				maxHeight: 180
			}
		}
	}
	navigator.getUserMedia(constraints, startStream, function(){});
}

function startStream(stream){
	video.src = URL.createObjectURL(stream);
	video.play();

	requestAnimationFrame(draw);
}

function draw(){
	chrome.storage.local.get("enable", function(data){
		enable = data.enable;
	});	
	if(enable){
		var frame = readFrame(context);
		if(frame){
			bgr2gray(frame.data);
			chrome.storage.local.get("t", function(data){
				if(chrome.runtime.lastError)
					t=70;
				else
					t = parseInt(data.t);
			});
			var w = threshold(frame.data, t, 0, 255);
			drawDetected(frame.data);
			w = Math.floor(w/sensitivity)*sensitivity;
			
			w-=(xe-xs)*(ye-ys)/5;
			chrome.storage.local.get("onlyZoom", function(data){
				onlyZoom = data.onlyZoom;
			});	
			if(onlyZoom&&w>0)
				w = -1*w;	
			w/=((xe-xs)*(ye-ys)/200);
			chrome.storage.local.get("invert", function(data){
				invert = data.invert;
			});
			if(!invert||onlyZoom)		
				w = 100-w;
			else
				w+=100;
			w = Math.floor(w/10)*10;
			
			document.body.style.zoom = ""+w+"%";
			chrome.storage.local.set({"w":w});
			try{
				context.putImageData(frame, 0, 0);
			} catch(e){
				console.log(e);
			}
		}
	}
	else
		document.body.style.zoom = "100%";
	requestAnimationFrame(draw);
}

chrome.runtime.onMessage.addListener(
	function(request, sender, sendResponse){
		if(request.invert){
  				invert = !invert;
				chrome.storage.local.set({"invert":invert});
				console.log("inverted "+invert);
		}
		if(request.onlyZoom){
			onlyZoom = !onlyZoom;
			chrome.storage.local.set({"onlyZoom":onlyZoom});
			console.log("oz "+onlyZoom);
		}
		else if(request.enable){
			enable = !enable;
			chrome.storage.local.set({"enable":enable});
			console.log("enable "+enable);
		}
		else if(request.sdown){
			if(sensitivity>=1000)
				sensitivity+=1000;
			else if(sensitivity>=100)
				sensitivity+=100
			else
				sensitivity+=1;
			chrome.storage.local.set({"sensitivity":sensitivity});
			console.log("sensitivity "+sensitivity);
		}
		else if(request.sup){
			if(sensitivity>1000)
				sensitivity-=1000;
			else if(sensitivity>100)
				sensitivity-=100
			else
				sensitivity-=1;
			chrome.storage.local.set({"sensitivity":sensitivity});
			console.log("sensitivity "+sensitivity);
		}
	}
);
