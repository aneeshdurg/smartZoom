var xs, xe, ys, ye;
var blur, edges;
var width, height;
function bgr2gray(data){
	var len = data.length;
	for(var i = 0; i<len; i+=4){
		var lumin = 0.21*data[i]+0.72*data[i+1]+0.07*data[i+2];
		data[i] = lumin;
		data[i+1] = lumin;
		data[i+2] = lumin;
	}
}
function blurImg(data, thresh){
	var len = data.length/4;
	blur = new Array(len);
	var dir = [1, -1, width, -width, 1+width, -1+width, -1+width, -1-width];
	for(var i = ys; i<ye; i++){
		for(var j = xs; j<xe; j++){
			var k = i*width+j;
			var total = data[4*k];
			var counter = 1;
			for(var l = 0; l<8; l++){
				if(k+dir[l]>0&&k+dir[l]>len){
					total+=data[4*(k+dir[l])];
					counter++;
				}
			}
			total/=counter;
			blur[k] = total;	
			data[4*k] = total;
			data[4*k+1] = total;
			data[4*k+2] = total;
		}	
	}
}
function EdgeDetect(data, thresh){
	//draw black edges
	//var len = blur.length;
	//var dir = [1, -1, width, -width, 1+width, -1+width, -1+width, -1-width];
	for(var i = ys; i<ye; i++){
		for(var j = xs; j<xe; j++){
			var k = i*width + j;
			for(var l = 0; l<8; l++){
				if(k+dir[l]>0&&k+dir[l]<len){
					if(Math.abs(blur[k]-blur[k+dir[l]])>thresh){
						data[4*k] = 0;
						data[4*k+1] = 0;
						data[4*k+2] = 0;
					}
				}
			}
		}
	}
}

function blobDetect(data, src){
	var dir = [1, -1, width, -width, -width-1, -width+1, width+1, width-1];
	var maxArea = -1;
	var maxPts = [];
	for(var i = 0; i<src.length; i++){
		var area = 0;
		var pts = [];
		if(src[i]==255){
			var done = false;
			var j = i;
			var temp = new Array();
			while(!done){
				if(src[j]==0){
					if(temp.length==0)
						break;
					else{
						j = temp.pop();
						continue;
					}						
				}
				src[j] = 0;
				area++;
				pts.push(j);
				var changed = false;
				for(var d = 0; d<8; d++){
					if(j+dir[d]>0&&src[j+dir[d]]>0){
						if(!changed){
							j = j+dir[d];
							changed = true;
						}
						else
							temp.push(j+dir[d]);
					}
				}
				if(!changed&&temp.length==0){
					done = true;
				}
				else if(!changed){
					j = temp.pop();
				}
			}
			if(area>maxArea||maxArea==-1){
				maxArea = area;
				maxPts = pts;
			}
		}
	}
	for(var i = 0; i<maxPts.length; i++){
		data[4*maxPts[i]] = 0;
		data[4*maxPts[i]+1] = 255;
		data[4*maxPts[i]+2] = 255;
	}
}
function readFrame(ctx){
	try{
		ctx.save();
		ctx.scale(-1, 1);
		ctx.drawImage(video, -width, 0, width, height);
		ctx.restore();
	} catch(e){
		console.log(e);
		return null;
	}
	return ctx.getImageData(0, 0, width, height);
}
function updateLimits(){
	var xStart, xEnd, yStart, yEnd;
	chrome.storage.local.get("xs", function(data){
			if(chrome.runtime.lastError)
				xs=0;
			else
				xs = parseInt(data.xs);
		});
	chrome.storage.local.get("xe", function(data){
			if(chrome.runtime.lastError)
				xe=width;
			else
				xe = parseInt(data.xe);
		});
	chrome.storage.local.get("ys", function(data){
			if(chrome.runtime.lastError)
				ys=0;
			else
				ys = parseInt(data.ys);
		});
	chrome.storage.local.get("ye", function(data){
			if(chrome.runtime.lastError)
				ye=height;
			else
				ye = parseInt(data.ye);
		});
}
function threshold(data, thresh, a, b){
	counter = 0;
	thresholded = new Array(data.length/4);
	updateLimits();
	for(var i = ys; i<ye; i++){
		for(var j = xs; j<xe; j++){
			var k = i*4*width+4*j
			if(data[k]>thresh){
				data[k] = a;
				data[k+1] = a;
				data[k+2] = a;
			}		
			else{
				data[k] = b;
				data[k+1] = b;
				data[k+2] = b;
				counter++;
			}	
		}
	}
	return counter;
}
