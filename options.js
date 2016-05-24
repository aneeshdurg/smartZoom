var video, canvas, context;
var t = 70;
var autoThresh = false;
navigator.getUserMedia = ( navigator.getUserMedia ||
                       navigator.webkitGetUserMedia ||
                       navigator.mozGetUserMedia ||
                       navigator.msGetUserMedia);
function initialize(){
	//chrome.storage.local.get("t", function(data){
	//		if(chrome.runtime.lastError)
	//			t=70;
	//	else
	//			t = parseInt(data.t);
	//	});	
	video = document.getElementById("zoomOptionFeed");
	canvas = document.getElementById("zoomOptionDraw");
	context = canvas.getContext("2d");
	width = 320;
	height = 180;
	canvas.width = width;
	canvas.height = height;
	//chrome.storage.local.set({"t":70});
	//chrome.storage.local.set({"xs":0});
	//chrome.storage.local.set({"ys":0});
	//chrome.storage.local.set({"xe":width});
	//chrome.storage.local.set({"ye":height});
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
		if(autoThresh){
			t = 70;
			var ideal = (xe-xs)*(ye-ys)/5;
			var lastw = threshold(frame.data, t, 0, 255);
			while(autoThresh){
				var delta;
				if(lastw>ideal){
					delta = -1;
				}
				else if(lastw<ideal){
					delta = 1;
				}
				else
					break;
				t+=delta;
				console.log(t);
				var currw = threshold(frame.data, t, 0, 255, et);
				if(Math.abs(currw-ideal)>Math.abs(lastw-ideal)){
					t-=delta;
					break;
				}
				lastw = currw;
			}
			autoThresh = false;
			//chrome.storage.local.set({'t':t});
		}
		if(!autoThresh){
				/*chrome.storage.local.get("t", function(data){
						if(chrome.runtime.lastError)
							t=70;
						else
						t = parseInt(data.t);
				});*/
		}
		var w = threshold(frame.data, t, 0, 255);
		drawDetected(frame.data);
		document.getElementById("w").innerHTML = w;
		document.getElementById("total").innerHTML = (xe-xs)*(ye-ys);
		try{
			context.putImageData(frame, 0, 0);
		} catch(e){
			console.log(e);
		}
	}
	requestAnimationFrame(draw);
}


document.addEventListener('DOMContentLoaded', function(){
	document.getElementById('plus').onclick = function(){
		t+=1;
		//chrome.storage.local.set({'t':t});
	};
	document.getElementById('minus').onclick = function(){
		t-=1;
		//chrome.storage.local.set({'t':t});
	};
	document.getElementById('auto').onclick = function(){
		autoThresh = !autoThresh;
	};
	document.getElementById('xs+').onclick = function(){
		xs+=5;
		if(xs>=xe){
			xs = xe;
		}
		//chrome.storage.local.set({'xs':xs});
	};
	document.getElementById('xs-').onclick = function(){
		xs-=5;
		if(xs<0){
			xs = 0;
		}
		//chrome.storage.local.set({"xs":xs});
	};
	document.getElementById('xe+').onclick = function(){
		xe+=5;
		if(xe>width){
			xe = width;
		}
		//chrome.storage.local.set({"xe":xe});
	};
	document.getElementById('xe-').onclick = function(){
		xe-=5;
		if(xe<xs){
			xe = xs;
		}
		//chrome.storage.local.set({"xe":xe});
	};
	document.getElementById('ys+').onclick = function(){
		ys+=5;
		if(ys>ye){
			ys = ye;
		}
		chrome.storage.local.set({"ys":ys});
	};
	document.getElementById('ys-').onclick = function(){
		ys-=5;
		if(ys<0){
			ys = 0;
		}
		//chrome.storage.local.set({"ys":ys});
	};
	document.getElementById('ye+').onclick = function(){
		ye+=5;
		if(ye>height){
			ye = height;
		}
		//chrome.storage.local.set({"ye":ye});
	};
	document.getElementById('ye-').onclick = function(){
		ye-=5;
		if(ye<ys){
			ye = ys;
		}
		//chrome.storage.local.set({"ye":ye});
	};
	initialize();
});

