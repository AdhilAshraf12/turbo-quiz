// DOM elements

const startScreen = document.getElementById("start-screen");
const quizScreen = document.getElementById("quiz-screen");
const resultScreen = document.getElementById("result-screen");
const startButton = document.getElementById("start-btn");
const questionText = document.getElementById("question-text");
const answersContainer = document.getElementById("answers-container");
const currentQuestionSpan = document.getElementById("current-question");
const totalQuestionsSpan = document.getElementById("total-questions");
const scoreSpan = document.getElementById("score");
const finalScoreSpan = document.getElementById("final-score");
const maxScoreSpan = document.getElementById("max-score");
const resultMessage = document.getElementById("result-message");
const restartButton = document.getElementById("restart-btn");
const progressBar = document.getElementById("progress");
const carOptions = document.getElementById("car-options");
const selectedCarLabel = document.getElementById("selected-car-label");
const carIcon = document.getElementById("car-icon");
const introScreen = document.getElementById("intro-screen");
const bestScoreSpan = document.getElementById("best-score");
const attemptsSpan = document.getElementById("attempts");
const maxScoreStartSpan = document.getElementById("max-score-start");




let quizQuestions = [];

async function loadQuestions() {
    try {
        const res = await fetch("./questions.json");
        if (!res.ok) throw new Error("Failled to load questions.json (${res.status})");
        
        const data = await res.json();

        if (!Array.isArray(data) || data.length === 0) {
            throw new Error ("questions.json must be a non-empty array.");
        }
    quizQuestions = data;

    totalQuestionsSpan.textContent = quizQuestions.length;
    maxScoreSpan.textContent = quizQuestions.length;

    if (typeof refreshStatsUI === "function") refreshStatsUI();


    startButton.disabled = false;
    } catch (err) {
        console.error(err);

        if (resultsMessage) {
            resultMessage.textContent = "Failed to load questions.json. check questions.json path or format.";
        }

        startButton.disabled = true;
    }
}



//STORAGE HELPERS

function getNumber(key,fallback =0) {
    const val = Number(localStorage.getItem(key));
    return Number.isFinite(val) ? val : fallback;
}

function setNumber(key,value) {
    localStorage.setItem(key,String(value));
}

function refreshStatsUI() {
    const best = getNumber("bestScore",0);
    const attempts = getNumber("attempts",0);

    if (bestScoreSpan) bestScoreSpan.textContent = best;
    if (attemptsSpan) attemptsSpan.textContent = attempts;
    if (maxScoreStartSpan) maxScoreStartSpan.textContent = quizQuestions.length;
}

// QUIZ STATE VARS

let currentQuestionIndex = 0;
let score = 0;
let answersDisabled = false;
let selectedCar = localStorage.getItem("selectedCar") || "🚗";
applySelectedCarToUI();
refreshStatsUI();
const savedCar = localStorage.getItem("selectedCar");
if (savedCar) selectedCar = savedCar;

totalQuestionsSpan.textContent = quizQuestions.length;
maxScoreSpan.textContent = quizQuestions.length;



// Event Listeners

startButton.addEventListener("click", startQuiz);
restartButton.addEventListener("click", restartQuiz);

function applySelectedCarToUI() {
    localStorage.setItem("selectedCar", selectedCar);
    if (selectedCarLabel) selectedCarLabel.textContent = selectedCar;
    if (carIcon) carIcon.textContent = selectedCar;

    document.querySelectorAll(".car-option").forEach(btn => {
        btn.classList.toggle("selected", btn.dataset.car === selectedCar);
    });
    }

applySelectedCarToUI();

function startQuiz() {
    startButton.disabled = true;
    startButton.classList.add("start-animate");

    startScreen.classList.add("fade-out");

    setTimeout(() => {
        startScreen.classList.remove("active", "fade-out");
        quizScreen.classList.add("active", "fade-in");

        currentQuestionIndex = 0;
        score = 0;
        scoreSpan.textContent = score;
        if (carIcon) carIcon.textContent = selectedCar;
        progressBar.style.width = "0%";
        showQuestion();
    }, 400);
    
}

function showQuestion() {

    answersDisabled = false;
    const currentQuestion = quizQuestions[currentQuestionIndex];

    currentQuestionSpan.textContent = currentQuestionIndex + 1;

    const progressPercent =
    ((currentQuestionIndex) / quizQuestions.length) * 100;

    progressBar.style.width = progressPercent + "%";

    questionText.textContent = currentQuestion.question;

    answersContainer.innerHTML = "";

    currentQuestion.answers.forEach((answer => {
        const button = document.createElement("button");
        button.textContent = answer.text;
        button.classList.add("answer-btn");
        button.dataset.correct = answer.correct;
        button.addEventListener("click", selectAnswer);
        answersContainer.appendChild(button);
        }))
}


function selectAnswer(event) {
    if(answersDisabled) return;

    answersDisabled = true;

    const selectedButton = event.target;
    const isCorrect = selectedButton.dataset.correct === "true";

    Array.from(answersContainer.children).forEach((button) => {
        if (button.dataset.correct === "true") {
            button.classList.add("correct");
        } else if(button === selectedButton) {
            button.classList.add("incorrect");
        }
    });

    if (isCorrect) {
        score++;
        scoreSpan.textContent = score;
    
    }

    const progressPercent =
    ((currentQuestionIndex + 1) / quizQuestions.length) * 100;

    progressBar.style.width = progressPercent + "%";

    setTimeout(() => {
        currentQuestionIndex++;
        if (currentQuestionIndex < quizQuestions.length) {
            showQuestion();
        }
        else { 
            showResults();
        }
    },1000)

}

carOptions.addEventListener("click", (e) => {
  const btn = e.target.closest(".car-option");
  if (!btn) return;

  selectedCar = btn.dataset.car;
  localStorage.setItem("selectedCar", selectedCar);
  applySelectedCarToUI();
});

function showResults() {
    console.log("showResults fired");
    console.log("resultScreen:", resultScreen);
    console.log("resultMessage:", resultMessage);
    quizScreen.classList.remove("active");
    resultScreen.classList.add("active");

    finalScoreSpan.textContent = score;

    const percentage = (score / quizQuestions.length)*100;

    //update attempts
    const attempts = getNumber("attempts",0) + 1;
    setNumber("attempts",attempts);

    // update best score
    const best = getNumber("bestScore",0);
    if (score > best) {
        setNumber("bestScore",score);
    }

    refreshStatsUI();

    if(percentage === 100) {
        resultMessage.textContent = "Holy! bro definitely knows his cars!";
    }
    else if (percentage >= 80) {
        resultMessage.textContent = "That was pretty good, you definitely like your cars!";
        }
    else if (percentage >= 60) {
        resultMessage.textContent = "Not too shabby but you still have lots to learn!";
    }
    else {
        resultMessage.textContent = "Yeah you gotta pick up another hobby sorry man. Unless you want to try again LOL"
    }
}
function restartQuiz() {
    resultScreen.classList.remove("active");

    //reset quiz state
    quizScreen.classList.remove("active");
    startScreen.classList.add("active");

    //reset progress bar
    progressBar.style.width = "0%";

    //re enable start button
    startButton.disabled = false;

    refreshStatsUI();
    applySelectedCarToUI();
}


window.addEventListener("DOMContentLoaded", () => {
  if (!introScreen) return;

  setTimeout(() => {
    introScreen.classList.add("intro-out");
  }, 2000);

  setTimeout(() => {
    introScreen.classList.remove("active");
    startScreen.classList.add("active");
  }, 2400);

  startButton.disabled = true;

  loadQuestions();
});

