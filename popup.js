var video, canvas, context;
var t = 70;
var edgeT = 0;
navigator.getUserMedia = ( navigator.getUserMedia ||
                       navigator.webkitGetUserMedia ||
                       navigator.mozGetUserMedia ||
                       navigator.msGetUserMedia);
function initialize(){
	chrome.storage.local.get("t", function(data){
			if(chrome.runtime.lastError)
				t=70;
			else
				t = parseInt(data.t);
		});	
	video = document.getElementById("zoomPopupFeed");
	canvas = document.getElementById("zoomPopupDraw");
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
	var frame = readFrame(context);
	if(frame){
		bgr2gray(frame.data);
		chrome.storage.local.get("t", function(data){
			if(chrome.runtime.lastError)
				t=70;
			else
				t = parseInt(data.t);
		});
		blurImg(frame.data, edgeT);
		threshold(frame.data, t, 0, 255);
		try{
			context.putImageData(frame, 0, 0);
		} catch(e){
			console.log(e);
		}
	}
	requestAnimationFrame(draw);
}

document.addEventListener('DOMContentLoaded', function(){
	document.getElementById('etp').onclick = function(){edgeT++;};
	document.getElementById('etm').onclick = function(){edgeT--;};
	document.getElementById('plus').onclick = function(){
		t+=5;
		chrome.storage.local.set({'t':t});
	};
	document.getElementById('minus').onclick = function(){
		t-=5;
		chrome.storage.local.set({'t':t});
	};
	document.getElementById('invert').onclick = function(){
		chrome.runtime.sendMessage({"invert":"true"});	
	};
	document.getElementById('enable').onclick = function(){
		chrome.runtime.sendMessage({"enable":"true"});	
	};
	document.getElementById('onlyZoom').onclick = function(){
		chrome.runtime.sendMessage({"onlyZoom":"true"});
	};
	chrome.runtime.onMessage.addListener(
  		function(request, sender, sendResponse) {
			if(request.tDelta){
					t = request.tDelta;
					console.log(t);
			}
  		}
	);
	initialize();
});

