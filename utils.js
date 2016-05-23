var oldArea = 0;
var et = 75;
var xs, xe, ys, ye;
var xavg = -1;
var yavg = -1;
var blur, threshCopy, thresholded;
var width, height;
var maxPts;
function bgr2gray(data){
	var len = data.length;
	for(var i = 0; i<len; i+=4){
		var lumin = 0.21*data[i]+0.72*data[i+1]+0.07*data[i+2];
		data[i] = lumin;
		data[i+1] = lumin;
		data[i+2] = lumin;
	}
}
function blurImg(data){
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
	return 0;
}
function difference(data, pos, pos2){
	var ret = 0;
	for(var i = 0; i<3; i++){
		ret+=(data[4*pos+i]-data[4*pos2+i])*(data[4*pos+i]-data[4*pos2+i]);
	}
	return Math.sqrt(ret);
}
function EdgeDetect(data, thresh){
	//draw black edges
	var len = blur.length;
	var dir = [1, -1, width, -width, 1+width, -1+width, -1+width, -1-width];
	for(var i = ys; i<ye; i++){
		for(var j = xs; j<xe; j++){
			var k = i*width + j;
			for(var l = 0; l<8; l++){
				if(k+dir[l]>0&&k+dir[l]<len){
					if(difference(data, k, k+dir[l])>thresh){
						//console.log(Math.abs(blur[k]-blur[k+dir[l]]));
						thresholded[k] = 0;
						threshCopy[k] = 100;
						for(var m = 0; m<8; m++){
							if(k+dir[m]>0&&k+dir[m]<len){
								thresholded[k+dir[m]] = 0;
								threshCopy[k+dir[m]] = 100;
							}
						}
					}
				}
			}
		}
	}
}

function fastEdgeDetect(data, i){	
	var dir = [1, -1, width, -width, -width-1, -width+1, width+1, width-1];
	for(var j = 0; j<3; j++){
		if(i+dir[j]>0&&i+dir[j]<data.length/4&&difference(data, i, i+dir[j])>et){
			threshCopy[i] = 100;
			return true;
		}
	}
	return false;
}

function blobDetect(data, src){
	EdgeDetect(data, et);
	var dir = [1, -1, width, -width, -width-1, -width+1, width+1, width-1];
	var maxArea = -1;
	maxPts = [];
	var numBlobs = 0;
	var currXavg = -1;
	var currYavg = -1;
	for(var i = 0; i<src.length; i++){
		var area = 0;
		var pts = [];
		if(src[i]==255){
			var done = false;
			var j = i;
			var temp = new Array();
			numBlobs++;
			var newXavg = 0;
			var newYavg = 0;
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
				newXavg+=j%width;
				newYavg+=j/width;
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
			newXavg/=area;
			newYavg/=area;
			if(maxArea==-1||(shouldReplace(currXavg, currYavg, maxArea, newXavg, newYavg, area))){
				console.log(oldArea+' '+area+' '+maxArea+' '+shouldReplace(currXavg, currYavg, newXavg, newYavg, area));
				currXavg = newXavg;
				currYavg = newYavg;
				maxArea = area;
				maxPts = pts;
			}
		}
	}
	xavg = currXavg;
	yavg = currYavg;
	oldArea = maxArea;
	return numBlobs, maxArea;
}
function shouldReplace(cx, cy, ca, nx, ny, na){
	var cdist = (xavg-cx)*(xavg-cx)+(yavg-cy)*(yavg-cy);
	var ndist = (xavg-nx)*(xavg-nx)+(yavg-ny)*(yavg-ny);
	//console.log(a);
	return (((ndist<cdist)&&Math.abs(na-oldArea)<1000)||(na>=ca));
}
function drawDetected(data){
	for(var i = ys; i<ye; i++){
		for(var j = xs; j<xe; j++){
			var k = i*width+j;
			data[4*k] = threshCopy[k]==100?0:threshCopy[k];
			data[4*k+1] = threshCopy[k]==100?0:threshCopy[k];
			data[4*k+2] = threshCopy[k];
		}
	}
	xavg = 0;
	yavg = 0;
	for(var i = 0; i<maxPts.length; i++){
		xavg+=i%width;
		yavg+=i/width;
		data[4*maxPts[i]] = 0;
		data[4*maxPts[i]+1] = 255;
		data[4*maxPts[i]+2] = 255;
	}
	xavg/=maxPts.length;
	yavg/=maxPts.length;
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
function threshold(data, thresh, a, b, eThresh){
	blurImg(data);
	counter = 0;
	thresholded = new Array(data.length/4);
	threshCopy = new Array(data.length/4);
	updateLimits();
	for(var i = ys; i<ye; i++){
		for(var j = xs; j<xe; j++){
			var k = i*4*width+4*j
			if(data[k]>thresh){
				thresholded[k/4] = a;
				threshCopy[k/4] = a;
			}		
			else{
				thresholded[k/4] = b;
				threshCopy[k/4] = b;
				counter++;
			}	
		}
	}
	var numBlobs, blobArea;
	numBlobs, blobArea = blobDetect(data, thresholded);
	//if(numBlobs<40)
		counter = blobArea
	return counter;
}
