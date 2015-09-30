

$(document).ready(function() {

	var AnimatedObject = function(){

		var obj = this;
		this.showing = false;
	
		this.size = {w:0, h:0}
		this.position = {
			x : 0,
			y : 0
		};

		this.draw = function() {
			this.showing = true;
			context.drawImage(this.asset, 0,0, this.asset.width, this.asset.height, this.position.x, this.position.y, this.asset.width, this.asset.height);
		}

		this.move = function(pixelsX, pixelsY) {
			this.position.x += pixelsX;
			this.position.y += pixelsY;

			if(this.position.x + this.size.w < canvas.width && this.position.y + this.size.h < canvas.height) {
				this.draw();
			} else {
				this.position.x = 0;
				this.position.y += this.size.h;

				if(this.position.y > canvas.height) {
					this.remove();
				}
			}
		}

		this.remove = function() {
			this.showing = false;
			console.log("Removed");
			delete this;
		}

		this.setImage = function(key) {
			this.asset = images[key];
			this.size.w = this.asset.width;
			this.size.h = this.asset.height;
			this.draw();
		}

		this.setSize = function(width, height){
			this.size.w = width;
			this.size.h = height;
		}

	}; 

	//CANVAS ANIMATION
	var canvas = document.getElementsByTagName("canvas")[0],
		context = canvas.getContext("2d"),
		animation;

	var requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
	var cancelAnimationFrame = window.cancelAnimationFrame || window.mozCancelAnimationFrame;

	var square1 = new AnimatedObject();
	square1.setSize(50,50);

	square1.draw = function(){
		this.showing = true;
		context.save();
		context.fillStyle = "orange";

		context.fillRect(this.position.x, this.position.y, this.size.w,this.size.h);
		context.restore();
	}

	square1.draw();

	function animate() {
		context.clearRect(0, 0, canvas.width, canvas.height);
		animation = requestAnimationFrame(animate);		

		if(square1.showing) {
			square1.move(10,0);
		} 
	}

	function cancelAnimation() {
		cancelAnimationFrame(animation);
		animation = null;
	}

	animate();

});

