$(document).ready(function() {
	addListeners();

	var requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
	var cancelAnimationFrame = window.cancelAnimationFrame || window.mozCancelAnimationFrame;

	var canvas = document.getElementsByTagName("canvas")[0],
		context = canvas.getContext("2d"),
		animation,
		counter = 0,
		startTime = Date.now(),
		framesToSkip = 10, 
		pendingLoadImages = 0, 
		images = {},
		clouds = [],
		cloud1,
		cloud2,
		cloud3,
		nextCloudTime = 3,
		gameStarted = false,
		falling;

	//Counters
	var squareTime = Date.now();
	var cloudsTime;

	loadImage("background", "/img/game-bg1.jpg")
	loadImage("testobject", "/img/calavera.png")
	loadImage("bullsprite", "/img/bullsprite1.png")
	loadImage("bullfalling", "/img/bull-falling.png")
	loadImage("falleffect","img/caida.png")

	var backgroundImg;
	var backgroundPosition = {
		x : 0,
		y : 0
	}

	var InteractiveObject = function(){

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

			if(this.position.x < canvas.width && this.position.y < canvas.height) {
				this.draw();
			} else {
				this.remove();
			}
		}

		this.remove = function() {
			this.showing = false;
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

		this.collides = function(theOther){

			if( this.isPointInternal(theOther.position.x, theOther.position.y) ) return true;
			if( this.isPointInternal(theOther.position.x + theOther.size.w , theOther.position.y) ) return true;
			if( this.isPointInternal(theOther.position.x, theOther.position.y + theOther.size.h) ) return true;
			if( this.isPointInternal(theOther.position.x + theOther.size.w, theOther.position.y + theOther.size.h) ) return true;
			
			if( theOther.isPointInternal(this.position.x, this.position.y) ) return true;
			if( theOther.isPointInternal(this.position.x + this.size.w , this.position.y) ) return true;
			if( theOther.isPointInternal(this.position.x, this.position.y + this.size.h) ) return true;
			if( theOther.isPointInternal(this.position.x + this.size.w, this.position.y + this.size.h) ) return true;

			return false;
		}

		this.isPointInternal = function(x,y){
			return x >= this.position.x && 
				   x <= this.position.x + this.size.w && 
				   y >= this.position.y && 
				   y <= this.position.y + this.size.h ;
		}

	}; 

	//STATS
	var altitude = 35000;
	var energy = 0;


	//ALTITUDE
	function addAltitude() {
		altitude += 15;
		updateAltitude();
	};

	function substractAltitude() {
		altitude -= 15;
		updateAltitude();
	}

	function updateAltitude() {
		$('.score span').text(altitude);
	};

	//ENERGY
	function addEnergy(perc) {
		if(perc <=100) {
			$('.progress-amount').width(perc+"%");
		}
		energy = perc;
	};

	function substractEnergy(perc) {
		if(perc >=0) {
			$('.progress-amount').width(perc+"%");
		}
		energy = perc;
	};

	var square1 = new InteractiveObject();
	var bullItem = new InteractiveObject();

	function imagesLoaded(){
		console.log("All images loaded")

		createObjects();
		drawBackground(); //Triggers main loop

		animate();
	}

	function createObjects(){
		addEnergy(50);

		//Executed before the loop, after the images have been loaded

		falling = new InteractiveObject();
		falling.asset = images["falleffect"];
		falling.position.x = (canvas.width/2) - (falling.asset.width/2);
		falling.position.y = 0;

		square1.setSize(50,50);
		square1.speed = 0.32;
		square1.itemTime = Date.now();

		square1.draw = function(){
			context.save();
			context.fillStyle = "orange";
			var now = Date.now();
			var pos = this.speed * (now - this.itemTime)
			if(pos > 450) {
				this.itemTime = now
			}

			this.position.x = 100 + pos
			this.position.y = 200

			context.fillRect(this.position.x, this.position.y, this.size.w,this.size.h);
			context.restore();
		}

		bullItem.setSize(100,190);
		bullItem.accel = 0.001;
		bullItem.speed = 0;
		bullItem.itemTime = Date.now();
		bullItem.asset = images['bullsprite']
		bullItem.basePos = 300;
		bullItem.position.x = 360 - bullItem.size.w / 2
		bullItem.currentLane = 1; // 0, 1, 2
		bullItem.spriteNum = 0
		bullItem.imgWidth = 190
		bullItem.speedX = 0
		bullItem.speedXTime = 0
		bullItem.spriteOffsets = [0,500,1000,1500 + 5,2000]

		bullItem.fillStyle = "green"
		bullItem.draw = function(){
			context.save();
			context.fillStyle = this.fillStyle;
			var now = Date.now();

			var elapsed = (now - this.itemTime);

			if(gameStarted) {
				if(this.position.y > 800 ) {
					this.speed = -0.2;
					this.itemTime = now;
				}

				this.goingUp = 0 > this.speed + this.accel * elapsed
				this.position.y = this.basePos + this.speed * elapsed + 0.5 * this.accel * elapsed * elapsed
			} else {

				this.position.y = this.basePos;
			}

			var destination = ( 120 + this.currentLane * 240 ) - this.size.w / 2

			if(Math.abs(this.position.x - destination) < 60){
				this.speedX = 0;
				this.position.x = destination
			}else{
				this.position.x = this.position.x + (now - this.speedXTime) * this.speedX;
			}

			//context.fillRect(this.position.x, this.position.y, this.size.w,this.size.h);
			context.drawImage(this.asset, this.spriteOffsets[this.spriteNum], 30, 440, 515, this.position.x - 50, this.position.y - 20, this.imgWidth, this.imgWidth * 1.156);
		
			context.restore();
		}

		bullItem.up = function(){
			if(gameStarted){
				this.basePos = this.position.y
				this.speed = -0.5;
				this.itemTime = Date.now();
			}
		}

		bullItem.left = function(){
			if(gameStarted){
				bullItem.speedXTime = Date.now();
				bullItem.currentLane = 0;
				bullItem.speedX = -0.1;
			}
		}

		bullItem.center = function(){
			if(gameStarted){
				bullItem.speedXTime = Date.now();
				if(bullItem.currentLane == 0) bullItem.speedX = 0.1;
				if(bullItem.currentLane == 2) bullItem.speedX = -0.1;
				bullItem.currentLane = 1;
			}
		}

		bullItem.right = function(){
			if(gameStarted){
				bullItem.speedXTime = Date.now();
				bullItem.currentLane = 2;
				bullItem.speedX = 0.1;
			}
		}

		bullItem.animMode = 'fly'

		setInterval(function(){
			if(gameStarted){
				if(bullItem.animMode == 'fly'){
					if( bullItem.spriteNum == 3 ){
						bullItem.spriteNum = 4
					}else{
						bullItem.spriteNum = 3
					}
				}
			}else{
				bullItem.spriteNum = 0
			}
		},50)

		//Clouds
		cloud1 = new InteractiveObject();
		cloud1.setImage("testobject");	
		cloud1.instanceIndex = 0;
		cloud1.showing = false;

		cloud2 = new InteractiveObject();
		cloud2.setImage("testobject");	
		cloud2.instanceIndex = 1;
		cloud2.showing = false;

		cloud3 = new InteractiveObject();
		cloud3.setImage("testobject");
		cloud3.instanceIndex = 2;
		cloud3.showing = false;

		clouds.push(cloud1);
		clouds.push(cloud2);
		clouds.push(cloud3);
	}

	function drawBackground() {
		backgroundImg = images["background"];
		backgroundPosition.y = (backgroundImg.height - $(window).height()) - 1000;
		context.drawImage(backgroundImg,backgroundPosition.x, backgroundPosition.y, canvas.width, canvas.height, 0, 0, canvas.width, canvas.height);
	}


	function loadImage(key, url) {
		pendingLoadImages++;
		var img = new Image();
		img.src = url;

		images[key] = img;

		img.onload = function() {
			pendingLoadImages--;
			if(pendingLoadImages === 0){
				imagesLoaded();
			}
		}
	}

	function startGame(){
		gameStarted = true;
		bullItem.itemTime = Date.now();

	}

	function animate() {

		if(altitude < 70000) {
			context.clearRect(0, 0, canvas.width, canvas.height);
			//Main Loop!

			animateBackground();	

			bullItem.draw();

			if(gameStarted) {
				//square1.draw();

				addAltitude();

				console.log("Altitude",altitude);
				if(altitude > 38000 && altitude < 39000) {
					if(!$('.msg-02').hasClass('hidden')){
						$('.msg-02').show();
					} 
				} else {
					$('.msg-02').hide();
				}

				if(altitude > 40000) {
					drawClouds();
				}

			} else {

				if(altitude > 30000) {

					substractAltitude();
					
					if(altitude < 32000 && altitude > 30050) {
						if(!$('.msg-01').hasClass('hidden')){
							$('.msg-01').show();
						}
					} else {
						$('.msg-01').hide();
					}

				} else {
					startGame();
				}
			}

			animation = requestAnimationFrame(animate);
	
		}
	}

	function animateBackground() {

		if(!gameStarted) {

			if(backgroundPosition.y > 0) {
				backgroundPosition.y += 3;
			}

			context.drawImage(backgroundImg,backgroundPosition.x, backgroundPosition.y, canvas.width/2, canvas.height/2, 0, 0, canvas.width, canvas.height);
			//falling.move(0,0);

		} else {

			if(backgroundPosition.y > 0) {
				backgroundPosition.y -=0.5;
			}

			context.drawImage(backgroundImg,backgroundPosition.x, backgroundPosition.y, canvas.width/2, canvas.height/2, 0, 0, canvas.width, canvas.height);

		}

	}


	function drawClouds() {
		if(!cloudsTime) {
			cloudsTime = Date.now();
		}
				
		var now = Date.now();
		var timeElapsedInSeconds = Math.round((now - cloudsTime)/1000);

		if(timeElapsedInSeconds === nextCloudTime) {
			cloudsTime = now;

			var nextCloud = Math.floor(Math.random()*3);
			//var positionRight = Math.floor(Math.random()*6);

			if(!clouds[nextCloud].showing) {
				
				if(nextCloud%2) {
					clouds[nextCloud].position.x = $(window).width() - clouds[nextCloud].asset.width;
				} else if(nextCloud%3) {
					clouds[nextCloud].position.x = ($(window).width()/2) - (clouds[nextCloud].asset.width/2);
				}

				clouds[nextCloud].position.y = -clouds[nextCloud].asset.height;
				clouds[nextCloud].showing = true;
			}

			nextCloudTime = Math.floor(Math.random()*5);
		}

		for(var i=0; i<clouds.length; i++) {
			if(clouds[i].showing) {
				clouds[i].move(0,5);

				if(clouds[i].collides(bullItem)){
					bullItem.fillStyle = "red"
					substractEnergy(energy-0.1);
				}else{
					bullItem.fillStyle = "green"
				}

			}
		}

	}

	function cancelAnimation() {
		cancelAnimationFrame(animation);
		animation = null;
		counter = framesToSkip+1;
	}

	function addListeners() {
		//Mood Selector
		$('.mood-box').on('click', function() {
			$('.mood-box').removeClass('selected');
			$(this).addClass('selected');
		});

		//Add background color based on time of day
	
		var d = new Date();
		var time = d.getHours() + ":" + d.getMinutes() + ":" + d.getSeconds();

		if (d.getHours() < 5  && d.getHours() < 23) {
			console.log('morning');
		}

		$('canvas').on('pointerdown mousedown click', function(event){
			event.preventDefault();
			bullItem.up.apply(bullItem);
			if(event.pageX < 240){
				bullItem.left.apply(bullItem);
			}else if(event.pageX < 480){
				bullItem.center.apply(bullItem);
			}else{
				bullItem.right.apply(bullItem);
			}
		})
		
		console.log(time);	
	}

	//SHAKE

	var shakeDevice = new Shake({
        threshold: 5,
        timeout: 100
    }),
        total = 0;

    shakeDevice.start();

    window.addEventListener('shake', fly, false);

    function fly(e) {
       
    }
});
