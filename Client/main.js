const socket = io({autoConnect: false});

const canvas = document.getElementById('canvas'); //canvas of html page
var rect;
const ctx = canvas.getContext('2d'); //drawing context


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

let room;
let hand = [];
let turn = false;
let username;


function init() {
	//initializing the client side

	//background, font, loading images
	canvas.style.backgroundColor = "#03fce8";
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

	//connect to server
	socket.connect();
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

function checkCookie() {
    username = getCookie("username");

    // If the username isn't empty, we welcome the user again by using an alert box
    if (username != "") {
        alert("Welcome again " + username);
    }

    // Otherwise we request the username
    else {
        username = prompt("Please enter your name:", "");
        // If the username entered isn't an empty string or null 
        // we set the cookie with the username entered
        if (username != "" && username != null) {
            setCookie("username", username, 1);
        }
    }
}

function onMouseClick(e) {
    rect = canvas.getBoundingClientRect();
    let pageX = e.pageX - rect.left, pageY = e.pageY - rect.top;
    console.log(pageX,pageY);
    //if it is the player's turn...
    if (turn){
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
                //inform the server that we are playing this card
                console.log(`${hand[i]} played`);
                socket.emit('playingCard', [room, hand[i]]); 
                return;
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
        socket.emit('unoPress', [room, username]);
    }
}


//when the user connects, request for a room
socket.on('connect', function (){
    socket.emit('requestRoom', username); //tell server to request room, passing in the username
    console.log('Room Requested');
});


//process the response of the room request: either you can join a room, or everything is full
socket.on('responseRoom', function(roomName){
    if (roomName != 'error'){
        room = roomName;
        console.log(`${username} successfully joined ${room}`);
        ctx.fillText(roomName, 100, 15);
        ctx.fillText(username, 0, 15);
    }
    else {
        socket.disconnect();
        alert("All rooms are full! Try again later");
    }
});


//displays the countdown to the start of the game
socket.on('countDown', function(secondsLeft){
    ctx.clearRect(0,25,canvas.width,canvas.height); 
    /*
    to be changed
    why can't filltext be at 0,20 and be cleared everytime (since clearrect clears from 0,20)?
    */
    ctx.fillText(`The game will start in ${secondsLeft} seconds.`, 0, 40);
});


//receives and displays the hand
socket.on('hand', function(playerHand){
    console.log("Displaying the cards...");
    hand = playerHand; //update the hand of the client
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
});


//displays an indicator next to the name of whichever player's turn it is
socket.on('showTurn', function(turnIndex){
    ctx.clearRect(canvas.width-100,0,canvas.width,15+10*20);
    ctx.fillText('>',canvas.width-100,15+turnIndex*20);
});


//displays the names and number of cards of each play in the room
socket.on('showPlayersCardCounts', function(namesOfPlayers,playersCardCounts){
    ctx.clearRect(canvas.width-90,0,canvas.width,15+10*20);
    for (let i = 0; i < playersCardCounts.length; ++i){
        let posx = canvas.width - 90;
        let posy = 15 + i * 20;
        ctx.fillText(namesOfPlayers[i] + ": " + playersCardCounts[i],posx,posy);
    }
});


socket.on()

init();