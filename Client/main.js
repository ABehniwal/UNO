const socket = io({autoConnect: false});

const canvas = document.getElementById('canvas'); //canvas of html page
var rect;
const ctx = canvas.getContext('2d'); //drawing context

// Sound effects
var drawCardSound = new sound("sound-effects/Card-flip-sound-effect.mp3")


//cards
const cardWidth = 120, cardHeight = 180; //must be in the ratio 2:3 to avoid distortion
const topMargin = 200, leftMargin = 80;
const cardBackSide = new Image(); //image of the backside of an uno card
const unoButton = new Image(); //image of the uno button
const deck = []; //array of images of the cards in the deck


//button parameters
const buttonX = leftMargin+5*cardWidth;
const buttonY = topMargin-(cardHeight-77)/2-77;
const buttonW = 110;
const buttonH = 77;


//colour rectangle parameters
const colourW = 77; //matching the height of the uno button
const colourH = 77;
const colourX = leftMargin + 2*cardWidth + (cardWidth - colourW) / 2;
const colourY = topMargin-(cardHeight-colourH)/2-colourH;
const colours = {
    0: 'red',
    1: 'yellow',
    2: 'green',
    3: 'blue'
};


//text colour
const TEXT_COLOUR = '#D7BA89';


//top bar
header = document.getElementById("header");
countdown = document.getElementById("countdown");


// https://www.w3schools.com/jsref/prop_style_visibility.asp -> Style Visibility Property for buttons

// Red, Yellow, Green, Blue Buttons for when a player plays a wild card 
// Initially make them invisible -> only visible when a player plays a wild card
// https://stackoverflow.com/questions/53263825/add-css-to-a-javascript-button -> linking buttons added here to main.css through the property 'className'
const redButton = document.createElement('button');
redButton.innerText = 'Red';
redButton.setAttribute('disabled', 'disabled');
redButton.className = "red_button";
redButton.style.visibility = "hidden";
document.body.appendChild(redButton);
redButton.addEventListener("click", function() {
    setColour(0);
});

const yellowButton = document.createElement('button');
yellowButton.innerText = 'Yellow';
yellowButton.setAttribute('disabled', 'disabled');
yellowButton.className = 'yellow_button';
yellowButton.style.visibility = "hidden";
document.body.appendChild(yellowButton);
yellowButton.addEventListener("click", function() {
    setColour(1);
});

const greenButton = document.createElement('button');
greenButton.innerText = 'Green';
greenButton.setAttribute('disabled', 'disabled');
greenButton.className = 'green_button';
greenButton.style.visibility = "hidden";
document.body.appendChild(greenButton);
greenButton.addEventListener("click", function() {
    setColour(2);
});

const blueButton = document.createElement('button');
blueButton.innerText = 'Blue';
blueButton.setAttribute('disabled', 'disabled');
blueButton.className = 'blue_button';
blueButton.style.visibility = "hidden";
document.body.appendChild(blueButton);
blueButton.addEventListener("click", function() {
    setColour(3);
});


let wildCard = 0; // Making a variable to store the number of a wild card if played
let wildCardPlayed = false // Boolean storing if a wild card is played and the change colour buttons are visible
let room;
let hand = [];
let turn = false;
let username;
let index;


function init() {
	//initializing the client side

	//font, loading images
	ctx.font = "16px Arial";
	cardBackSide.src = "images/uno.png";
    unoButton.src = "images/unoButton.png";
	for (let i = 0; i <= 13; ++i){
		for (let j = 0; j <= 7; ++j){
			deck[`deck${i*10+j}.png`] = new Image();
			deck[`deck${i*10+j}.png`].src = `images/deck/deck${i*10+j}.png`;
		}
	}

	//add listeners for mouse-click events (refer to https://www.w3schools.com/jsref/dom_obj_event.asp)
	document.addEventListener('click', onMouseClick);

	checkCookie()
}


//connects to server and requests a room
function joinGame(){
    //connect to server
    socket.connect();
    //request for a room
    socket.emit('requestRoom', username); //tell server to request room, passing in the username
    console.log('Room Requested');
}


/*
name: the name of the cookie (what sort of information we are storing)
value: the actual value of the cookie based on the user that has joined
       the server
days: the number of days until the expiration of the cookie
*/

// https://www.w3schools.com/js/js_cookies.asp

function setCookie(name, value, days) {
    let date = new Date();

    // https://www.w3schools.com/jsref/tryit.asp?filename=tryjsref_settime
    // We setTime by passing in how many milliseconds after the current 
    // time we want to set it to
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    let expires = "expires="+ date.toUTCString();
    document.cookie = name + "=" + value + ";" + expires + ";path=/";
}

// taking the cookie's name as the parameter

function getCookie(cookieName) {
    let name = cookieName + "=";

    // decoding the cookie string to handle special characters
    // (if there are any)
    let decodedCookie = decodeURIComponent(document.cookie);

    // splitting the cookie into elements in an array based on ;'s
    let ca = decodedCookie.split(';');

	// Looping through the characters in the cookie
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];

        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }

        // If we find the cookie name, we return the value of the cookie
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }

    return "";
}


//generating a random number in a range [min,max)
//https://stackoverflow.com/questions/1527803/generating-random-whole-numbers-in-javascript-in-a-specific-range
function genRand(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}


function checkCookie() {
    username = getCookie("username");

    // If the username isn't empty, we welcome the user again by using an alert box
    if (username != "") {
        // alert("Welcome again " + username);
        Swal.fire({
          title: `Welcome back, ${username}.`,
          icon: 'success',
          confirmButtonText: 'Play',
          allowOutsideClick: false,
        }).then((result) => {
            if (result.isConfirmed){
                joinGame();
            }
        });
    }

    // Otherwise we request the username
    else {
        // username = prompt("Please enter your name:", "");
        Swal.fire({
          title: "Enter your name:",
          input: 'text',
          inputValue: 'Player'+genRand(1000,10000),
          inputAttributes: {
            autocapitalize: 'off',
            maxlength: 10,
          },
          confirmButtonText: 'Play',
          allowOutsideClick: false,
        }).then((result) => {
            console.log(result.value, username);
            // If the username entered isn't an empty string or null 
            // we set the cookie with the username entered
            if (result.isConfirmed && result.value){
                username = result.value;
                console.log('username updated:',username);
                setCookie("username", username, 1);
                joinGame();
            }
        });
    }
}

//mouse click listener function
function onMouseClick(e) {
    rect = canvas.getBoundingClientRect();
    let pageX = e.pageX - rect.left, pageY = e.pageY - rect.top;
    console.log(pageX,pageY);
    //if it is the player's turn...
    if (turn && ! wildCardPlayed){
        //check for playing a card
        let column = 0, row = 0.5;
        for (let i = 0; i < hand.length; ++i){
            if (column == 7){
                //go to next row
                column = 0;
                ++row;
            }
            let cardX = leftMargin+column*cardWidth;
            let cardY = topMargin+row*cardHeight;
            //check if the click is within the area of the card
            if (cardX < pageX && pageX < cardX + cardWidth && cardY < pageY && pageY < cardY + cardHeight){
                // if a wild card was played, we un-disable the change colour buttons
                if (hand[i] >= 130) {

                    wildCardPlayed = true;
                    wildCard = hand[i];

                    // Making the buttons visible and clickable
                    redButton.disabled = false;
                    redButton.style.visibility = "visible";
                    yellowButton.disabled = false;
                    yellowButton.style.visibility = "visible";
                    greenButton.disabled = false;
                    greenButton.style.visibility = "visible";
                    blueButton.disabled = false;
                    blueButton.style.visibility = "visible";
                }
                else {
                    //inform the server that we are playing this card
                    console.log(`${hand[i]} played`);
                    socket.emit('playingCard', [room, hand[i]]); 
                    return;
                    // 
                }
            }
            ++column;
        }

        //check for drawing a card
        if (leftMargin+4*cardWidth < pageX &&
            pageX < leftMargin+5*cardWidth &&
            topMargin-cardHeight < pageY &&
            pageY < topMargin){
            console.log(`drawing a card`);
            socket.emit('drawCard', [1,room]);
            return;
        }
    }
    //if the uno button is clicked
    if (buttonX <= pageX && pageX <= buttonX + buttonW && buttonY <= pageY && pageY <= buttonY + buttonH){
        console.log('uno button pressed');
        socket.emit('unoPress', [room, index]);
    }
}


socket.on('playCardFailed', function(){
    Swal.fire({
      title: 'Oops!',
      text: "You can't play that card",
      icon: 'error',
      showConfirmButton: false,
      timer: 1000
    });
});


socket.on('playableCard', function(){
    // alert("You can not draw when you have a playable card.");
    Swal.fire({
      title: 'Oops!',
      text: 'You cannot draw when when you have a playable card.',
      icon: 'error',
      showConfirmButton: false,
      timer: 1000
    });
})


function setColour(colour) {

    // Playing the wildCard now so that the next player can only make a turn after the current player has chosen a colour
    //inform the server that we are playing this card
    console.log(`${wildCard} played`);
    socket.emit('playingCard', [room, wildCard]);

    // Changing the current colour of the room
    socket.emit('changeColour', [room, colour]);

    redButton.disabled = true;
    redButton.style.visibility = "hidden";
    yellowButton.disabled = true;
    yellowButton.style.visibility = "hidden";
    greenButton.disabled = true;
    greenButton.style.visibility = "hidden";
    blueButton.disabled = true;
    blueButton.style.visibility = "hidden";

    wildCardPlayed = false;
}

//process the response of the room request: either you can join a room, or everything is full
socket.on('responseRoom', function(roomName){
    if (roomName != 'error'){
        room = roomName;
        console.log(`${username} successfully joined ${room}`);
        Swal.fire({
            title: `You joined ${roomName}`,
            text: 'The game will start soon!',
            icon: 'success',
            showConfirmButton: false,
            timer: 3000,
        });
        ctx.clearRect(0,0,canvas.width,canvas.height);
        header.innerHTML = `${username} &emsp; &emsp; ${roomName}`;
    }
    else {
        socket.disconnect();
        // alert("All rooms are full! Try again later");
        Swal.fire({
          title: 'Oops!',
          text: 'All rooms are full! Try again later',
          icon: 'error',
          showConfirmButton: true,
        });
    }
});


//displays the countdown to the start of the game
socket.on('countDown', function(secondsLeft){
    if (secondsLeft != 0){
        countdown.style.display = "block";
        countdown.innerHTML = `The game will start in ${secondsLeft} seconds.`;
    }
    else {
        countdown.style.display = "none";
    }
});


//resizes the canvas (inspired by https://stackoverflow.com/questions/5517783/preventing-canvas-clear-when-resizing-window)
function resize(height){
    let curImage = ctx.getImageData(0,0,canvas.width,canvas.height);
    canvas.height = height;
    ctx.putImageData(curImage,0,0);
    ctx.font = "16px Arial";
}


//receives and displays the hand
socket.on('hand', function(playerHand){
    console.log("Displaying the cards...");
    hand = playerHand; //update the hand of the client
    let rows = Math.floor((hand.length-1) / 7);
    let requiredHeight = (rows+2.5)*cardHeight + topMargin;
    console.log('requiredHeight',requiredHeight);
    if (requiredHeight > canvas.height){
        resize(requiredHeight);
    }
    ctx.clearRect(0,topMargin,canvas.width,canvas.height); //clear the canvas space where the previous hand was drawn
    let row = 0.5, column = 0;
    for (let i = 0; i < hand.length; ++i){
        if (column == 7){
            //go to next row
            column = 0;
            ++row;
        }
        //refer to https://www.w3schools.com/tags/canvas_drawimage.asp
        ctx.drawImage(deck[`deck${hand[i]}.png`],
                      leftMargin+column*cardWidth,
                      topMargin+row*cardHeight,cardWidth,cardHeight);
        ++column;
    }
});


socket.on('drawCardSound', function() {
    drawCardSound.play();
})


// https://www.w3schools.com/graphics/game_sound.asp --> code for adding sound effects
function sound(src) {
    this.sound = document.createElement("audio");
    this.sound.src = src;
    this.sound.setAttribute("preload", "auto");
    this.sound.setAttribute("controls", "none");
    this.sound.style.display = "none";
    document.body.appendChild(this.sound);
    this.play = function(){
      this.sound.play();
    }
    this.stop = function(){
      this.sound.pause();
    }
  }

//receives and displays the current card, displays the deck and uno button
socket.on('currentCard', function(currentCard){
    ctx.clearRect(leftMargin+3*cardWidth,topMargin-cardHeight,cardWidth,cardHeight); //clearing the space for current card
    ctx.drawImage(deck[`deck${currentCard}.png`],leftMargin+3*cardWidth,topMargin-cardHeight,cardWidth,cardHeight); //drawing the current card

    ctx.drawImage(cardBackSide,leftMargin+4*cardWidth,topMargin-cardHeight,cardWidth,cardHeight);//drawing the back of card (representing the deck)

    ctx.drawImage(unoButton,buttonX,buttonY,buttonW,buttonH); //drawing the uno button
});


//sets the turn variable to true or false (true if it is the player's turn, false otherwise)
socket.on('setTurn', function(bool) {
    turn = bool;
    //inform the user it is their turn
    if (turn){
        Swal.fire({
            title: "It's your turn!",
            showConfirmButton: false,
            timer: 1000
        })
    }
});


//displays an indicator next to the name of whichever player's turn it is
socket.on('showTurn', function(turnIndex){
    ctx.clearRect(canvas.width-130,0,canvas.width,15+10*20);
    ctx.fillStyle = 'black';
    ctx.fillText('>',canvas.width-130,15+turnIndex*20);
});


//receives the player index from the server once the game room has been decided
socket.on('receiveIndex', function(playerIndex){
    index = playerIndex;
});


//displays the names and number of cards of each play in the room
socket.on('showPlayersCardCounts', function(namesOfPlayers,playersCardCounts){
    ctx.clearRect(canvas.width-110,0,canvas.width,15+10*20);
    ctx.fillStyle = TEXT_COLOUR;
    for (let i = 0; i < playersCardCounts.length; ++i){
        let posx = canvas.width - 110;
        let posy = 15 + i * 20;
        ctx.fillText(namesOfPlayers[i] + ": " + playersCardCounts[i],posx,posy);
    }
});


socket.on('showColour', function(curColour){
    console.log(`showing the colour ${curColour}`);
    ctx.fillStyle = colours[curColour];
    ctx.fillRect(colourX, colourY, colourW, colourH);
});


socket.on('endGame', function(winner){
    socket.disconnect();
    ctx.clearRect(canvas.width-130,0,canvas.width,15+10*20);
    ctx.clearRect(0,20,canvas.width,canvas.height);
    Swal.fire({
      title: 'Game Over!',
      text: `${winner} won the game!`,
      showConfirmButton: true,
      confirmButtonText: 'Play Again', 
    }).then((result) => {
        if (result.isConfirmed){
            joinGame();
        }
    });
});


socket.on('playerDisconnected', function(playerName){
    // alert(playerName + " has left the game.");
    Swal.fire({
        title: 'Someone left...',
        text: `${playerName} has left the game.`,
        icon: 'error',
        timer: 1000
    })
})


init();