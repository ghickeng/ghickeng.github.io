let deckId = "";
let cardLeft = 0;
let curCardInfo = {};
let correctNum = 0;
let score = 0;
let playType, preVal, bool, foldValList, curVal;
let foldName = "";
let lower = "0";
let higher = "0";
let lowerCard,
  higherCard,
  totalCard = 0;

// convert card face values to numerical values
const cardMap = {
  ACE: 1,
  2: 2,
  3: 3,
  4: 4,
  5: 5,
  6: 6,
  7: 7,
  8: 8,
  9: 9,
  10: 10,
  JACK: 11,
  QUEEN: 12,
  KING: 13,
};

const heartsDeckParam = "cards=AH,2H,3H,4H,5H,6H,7H,8H,9H,0H,JH,QH,KH";
const fullDeckParam = "deck_count=1";

const fetch = async (url) => {
  const res = await window.fetch(url);
  return res.json();
};

// function to show desired elements on the page
const setElementShow = (id, show) => {
  document.getElementById(id).style.display = show ? "block" : "none";
};

// function to update the value
const setElementValue = (id, value) => {
  document.getElementById(id).innerHTML = value;
};

// clear the current card data and scores
const reset = () => {
  isHighScore(score);
  // card left
  cardLeft = 0;
  // show current card data
  curCardInfo = {};
  correctNum = 0;
  score = 0;
  setElementShow("popup-wrap", false);
  setElementShow("popup-quit", false);
  setElementValue("board-correct", correctNum);
  setElementValue("board-score", score);
  setElementValue("card-left", cardLeft);
};

// start the game, shuffle the deck
// get the deck id
const play = async (param) => {
  const res = await fetch(
    `https://deckofcardsapi.com/api/deck/new/shuffle/?${
      param || heartsDeckParam
    }`
  );
  if (!res || !res.success) {
    alert("Request failed. ");
    return;
  }
  if (!res.deck_id) {
    alert("Failed to get deck id.");
    return;
  }
  const { deck_id = "", remaining: remainingInit = 0 } = res || {};
  setElementValue("card-left", remainingInit);
  deckId = deck_id;
  // cardTotal = remaining;
  cardLeft = remainingInit;
  const cardInfo = await takeCard();
  await drawCard(cardInfo);
  setElementShow("begin-btn", false);
  setElementShow("main", true);
  setElementShow("data-board", true);
  setElementValue("deck-id", deckId);
  clearScore();
  document.getElementById("bestScores").innerHTML = `<p>Highest Score:0`;
};

// Get a card from the deck
const takeCard = async () => {
  const cardInfo = await fetch(
    `https://deckofcardsapi.com/api/deck/${deckId}/draw/?count=1`
  );
  if (!cardInfo || !cardInfo.success) {
    alert("Request Failed.");
    return null;
  }
  return cardInfo;
};

// render the image and update the information
const drawCard = async (cardInfo) => {
  // console.log(cardInfo);
  // get the cards detail
  // Default values can also be used in object destructuring
  // just in case a variable is undefined in an object it wants to extract data from:
  const { cards = [], remaining = 0 } = cardInfo || {};
  setElementValue("card-left", remaining);
  cardLeft = remaining;
  curCardInfo = cards[0] || {}; // extract the card info
  setElementValue(
    "card",
    `<img class='card-img' src=${curCardInfo.image} alt='Sorry the card image is missing.' />`
  );
};

// Add to the card pile for later use
const fold = async (cardCode) => {
  foldName = "foldCards";
  const res = await fetch(
    `https://deckofcardsapi.com/api/deck/${deckId}/pile/${foldName}/add/?cards=${cardCode}`
  );
};

// Guess the high or low
// update the number of correct guess and score
const guessClick = async (type) => {
  const { value: preVal = "1", code = "" } = curCardInfo || {}; // assigned a default value in case the unpacked value is undefined.
  const cardInfo = await takeCard(); // take a new card!
  const { cards = [], remaining = 0 } = cardInfo || {}; // give default value in case there is no card valid anymore
  const { value: newVal = "1" } = cards[0] || {};
  const bool =
    type === "lower"
      ? (cardMap[preVal] || 1) > cardMap[newVal]
      : (cardMap[preVal] || 1) < cardMap[newVal];

  if (bool) {
    await drawCard(cardInfo);
    await fold(code); // add to the pile
    //Calculate the score
    await foldedCard();
    const ACE = cardMap[preVal] === 1;
    const KING = cardMap[preVal] === 13;

    if (playType === "hearts" && bool) {
      if (ACE || KING) {
        correctNum += 1;
        score += 1;
      } else {
        await typeHeart(foldValList, curVal);
        if (
          (type === "lower" && lower < 50) ||
          (type === "higher" && higher < 50)
        ) {
          correctNum += 1;
          score += 4;
        } else if (
          (type === "lower" && lower >= 50) ||
          (type === "higher" && higher >= 50)
        ) {
          correctNum += 1;
          score += 2;
        }
      }
    } else {
      if (ACE || KING) {
        correctNum += 1;
        score += 1;
      } else {
        await typeFull(foldValList, curVal);
        if (
          (type === "lower" && lower < 50) ||
          (type === "higher" && higher < 50)
        ) {
          correctNum += 1;
          score += 4;
        } else if (
          (type === "lower" && lower >= 50) ||
          (type === "higher" && higher >= 50)
        ) {
          correctNum += 1;
          score += 2;
        }
      }
    }
    setElementValue("board-correct", correctNum);
    setElementValue("board-score", score);
    if (!remaining) {
      showPop("popup-wrap", "pop-text", "YOU FINISHED THE GAME!");
      displayBestScores();
    }
  } else {
    showPop("popup-wrap", "pop-text", "SORRY YOU MISSED IT!");
    setElementValue("pop-correct", correctNum);
    setElementValue("pop-score", score);
    displayBestScores();
  }
  let bestScores = []; // save to the local storage
  bestScores.push(score);
  localStorage.setItem(bestScores, score);
};

// get folded card
const foldedCard = async () => {
  let res;
  // if there is a corresponding foldName
  if (foldName) {
    res = await fetch(
      `https://deckofcardsapi.com/api/deck/${deckId}/pile/${foldName}/list/`
    );
    if (!res || !res.success) {
      alert("Failed to get data");
      return;
    }
  }
  const { value = "" } = curCardInfo || {};
  const foldList = (res && res.piles.foldCards.cards) || [];
  curVal = cardMap[value] || 0;
  foldValList = foldList.map((item) => cardMap[item.value] || 0);
};

const typeHeart = async (foldValList, curVal) => {
  await foldedCard();
  lowerCard = curVal - 1 - foldValList.filter((item) => item < curVal).length;
  higherCard = 13 - curVal - foldValList.filter((item) => item > curVal).length;
  totalCard = 13 - foldValList.length;
  lower = ((lowerCard / totalCard) * 100).toFixed(2);
  higher = (100 - lower).toFixed(2);
};

const typeFull = async (foldValList, curVal) => {
  await foldedCard();
  lowerCard =
    (curVal - 1) * 4 - foldValList.filter((item) => item < curVal).length;
  higherCard =
    (13 - curVal) * 4 - foldValList.filter((item) => item > curVal).length;
  totalCard = 52 - foldValList.length;
  lower = ((lowerCard / totalCard) * 100).toFixed(2);
  higher = ((higherCard / totalCard) * 100).toFixed(2);
};

// popup message to alert
const showPop = (id, textId, text) => {
  setElementShow(id, true);
  setElementValue(textId, text);
};

// restart the game, shuffle the deck with the same id
const restart = async () => {
  reset();
  await fetch(`https://deckofcardsapi.com/api/deck/${deckId}/shuffle/`);
  const cardInfo = await takeCard();
  await drawCard(cardInfo);
};

//radio check for deck
const checkHeart = async () => {
  if (playType === "hearts") return;
  playType = "hearts";
  document.getElementById("hearts").checked = true;
  document.getElementById("full").checked = false;
  reset();
  play(heartsDeckParam);
};

const checkFull = async () => {
  if (playType === "full") return;
  playType = "full";
  document.getElementById("hearts").checked = false;
  document.getElementById("full").checked = true;
  reset();
  play(fullDeckParam);
};

// quit the game with pop up message
const quit = () => {
  setElementValue("pop-quit-correct", correctNum);
  setElementValue("pop-quit-score", score);
  showPop("popup-quit", "pop-quit-text", "YOU HAVE QUIT THE GAME!");
};

// skip one card and add to the pile
const skip = async () => {
  const cardInfo = await takeCard();
  const { remaining = 0 } = cardInfo || {};
  const { code = "" } = curCardInfo || {};
  if (!remaining) {
    showPop("popup-wrap", "pop-text", "YOU FINISHED THE GAME!");
  }
  await drawCard(cardInfo); // update the next image
  await fold(code);
};

// get hint
const hint = async () => {
  await getHintDate();
};

// calculation for getting hint
const getHintDate = async () => {
  await foldedCard();
  if (playType === "hearts") {
    await typeHeart(foldValList, curVal);
  } else {
    await typeFull(foldValList, curVal);
  }
  setElementShow("popup-hint", true);
  setElementValue("pop-lower", lower);
  setElementValue("pop-higher", higher);
};

// close off the hint
const closeHint = () => {
  lower = 0;
  higher = 0;
  setElementShow("popup-hint", false);
  setElementValue("pop-lower", lower);
  setElementValue("pop-higher", higher);
};

// use local storage to display the highest score until page refresh
displayBestScores();

// check if the coming score is the high score
function isHighScore(score) {
  const bestScores = JSON.parse(localStorage.getItem("bestScores")) || [];
  const lowestScore = bestScores[bestScores.length - 1]?.score ?? 0;
  if (score > lowestScore) {
    const newScore = { score };
    saveScore(newScore, bestScores);
    displayBestScores();
  }
}

// save the score to the array
function saveScore(score, bestScores) {
  var bestScores = [];
  bestScores.push(score);
  bestScores.sort((a, b) => b.score - a.score);
  bestScores.splice(bestScores.length);
  localStorage.setItem("bestScores", JSON.stringify(bestScores));
}

// update the score
function displayBestScores() {
  var bestScores = JSON.parse(localStorage.getItem("bestScores")) || [];
  const currentBestScore = document.getElementById("bestScores");
  currentBestScore.innerHTML = bestScores.map(
    (score) => `<p>Highest Score:${score.score}`
  );
}

// clear the score
function clearScore() {
  localStorage.removeItem("bestScores");
  document.getElementById("bestScores").innerHTML = "";
}
