let currentQuestion = 0;
let userAnswers;
let quizQuestions;
let startTime;
let endTime;

// Theme toggle
function toggleTheme() {
    const theme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    updateThemeIcon();
}

function updateThemeIcon() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    document.getElementById('theme-toggle').innerHTML = isDark ? '☀️' : '🌙';
}

function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon();
}

async function loadQuestions() {
    try {
        const response = await fetch('./questions.json');
        const data = await response.json();
        quizQuestions = data.questions;
        userAnswers = new Array(quizQuestions.length).fill(null);
        createQuiz();
    } catch (error) {
        console.error('Error loading questions:', error);
        document.getElementById('quiz').innerHTML = 'Error loading quiz questions. Please try again.';
    }
}

function createQuiz() {
    const quizContainer = document.getElementById('quiz');
    startTime = new Date();
    
    document.getElementById('total').textContent = quizQuestions.length;
    document.getElementById('current').textContent = currentQuestion + 1;
    
    quizContainer.innerHTML = '';
    
    quizQuestions.forEach((q, index) => {
        const questionDiv = document.createElement('div');
        questionDiv.className = `question ${index === 0 ? 'active' : ''}`;
        
        questionDiv.innerHTML = `
            <h3>${q.question}</h3>
            <div class="options">
                ${q.options.map((option, optIndex) => `
                    <div class="option" data-index="${optIndex}">${option}</div>
                `).join('')}
            </div>
            ${index === quizQuestions.length - 1 
                ? '<button id="submit" disabled>Submit Quiz</button>'
                : '<button class="next" disabled>Next Question</button>'
            }
        `;
        quizContainer.appendChild(questionDiv);
    });

    document.querySelectorAll('.option').forEach(option => {
        option.addEventListener('click', selectOption);
    });

    document.querySelectorAll('.next').forEach(button => {
        button.addEventListener('click', nextQuestion);
    });

    const submitButton = document.getElementById('submit');
    if (submitButton) {
        submitButton.addEventListener('click', showResults);
    }
}

function selectOption(event) {
    const selectedOption = event.target;
    const questionDiv = selectedOption.closest('.question');
    const currentOptions = questionDiv.querySelectorAll('.option');
    const nextButton = questionDiv.querySelector('button');
    
    currentOptions.forEach(option => option.classList.remove('selected'));
    selectedOption.classList.add('selected');
    
    if (nextButton) nextButton.disabled = false;
    
    const questionIndex = Array.from(document.querySelectorAll('.question')).indexOf(questionDiv);
    userAnswers[questionIndex] = parseInt(selectedOption.dataset.index);
}

function nextQuestion() {
    const questions = document.querySelectorAll('.question');
    questions[currentQuestion].classList.remove('active');
    currentQuestion++;
    questions[currentQuestion].classList.add('active');
    document.getElementById('current').textContent = currentQuestion + 1;
}

function showResults() {
    endTime = new Date();
    const timeTaken = Math.floor((endTime - startTime) / 1000);
    
    let score = 0;
    const answersReview = [];
    
    userAnswers.forEach((answer, index) => {
        const isCorrect = answer === quizQuestions[index].correct;
        if (isCorrect) score++;
        
        answersReview.push({
            question: quizQuestions[index].question,
            userAnswer: quizQuestions[index].options[answer],
            correctAnswer: quizQuestions[index].options[quizQuestions[index].correct],
            isCorrect: isCorrect
        });
    });
    
    document.getElementById('quiz').style.display = 'none';
    const results = document.getElementById('results');
    results.style.display = 'block';
    
    document.getElementById('score').textContent = score;
    
    const answersReviewDiv = document.getElementById('answers-review');
    const answersReviewHtml = answersReview.map((review, index) => `
        <div class="answer-review ${review.isCorrect ? 'correct' : 'incorrect'}">
            <p><strong>Question ${index + 1}:</strong> ${review.question}</p>
            <p><strong>Your answer:</strong> ${review.userAnswer}</p>
            <p><strong>Correct answer:</strong> ${review.correctAnswer}</p>
            <p><strong>Status:</strong> ${review.isCorrect ? '✅ Correct' : '❌ Incorrect'}</p>
        </div>
    `).join('');
    answersReviewDiv.innerHTML = answersReviewHtml;

    document.getElementById('restart').addEventListener('click', restartQuiz);
}

function restartQuiz() {
    currentQuestion = 0;
    userAnswers = new Array(quizQuestions.length).fill(null);
    document.getElementById('results').style.display = 'none';
    document.getElementById('quiz').style.display = 'block';
    createQuiz();
}

document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    loadQuestions();
});