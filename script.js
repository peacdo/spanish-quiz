let currentQuestion = 0;
let userAnswers;
let quizQuestions;
let startTime;
let endTime;

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getFirestore, collection, addDoc, query, orderBy, limit, getDocs } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

const firebaseConfig = {
    apiKey: "AIzaSyDophykOqVYKV7t_YthU3vHzk-OvvrJJeE",
    authDomain: "spanish-quiz-fe087.firebaseapp.com",
    projectId: "spanish-quiz-fe087",
    storageBucket: "spanish-quiz-fe087.firebasestorage.app",
    messagingSenderId: "834025143539",
    appId: "1:834025143539:web:2fa8d34545a0a75894cb86",
    measurementId: "G-EVEJ2WXRWX"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Function to add perfect score to leaderboard
async function addToLeaderboard(name, timeInSeconds) {
  try {
    const docRef = await addDoc(collection(db, "leaderboard"), {
      name: name,
      score: 60,
      timeInSeconds: timeInSeconds,
      timestamp: new Date().toISOString()
    });
    console.log("Document written with ID: ", docRef.id);
    return true;
  } catch (e) {
    console.error("Error adding to leaderboard: ", e);
    return false;
  }
}

// Function to get leaderboard data
async function getLeaderboard() {
  const leaderboardQuery = query(
    collection(db, "leaderboard"),
    orderBy("timeInSeconds", "asc"),
    limit(10)
  );
  
  const querySnapshot = await getDocs(leaderboardQuery);
  const leaderboardData = [];
  
  querySnapshot.forEach((doc) => {
    leaderboardData.push(doc.data());
  });
  
  return leaderboardData;
}

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

// Replace the showResults function in script.js with this version

async function showResults() {
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
    
    // Perfect score handling
    if (score === 60) {
        const name = await promptForName();
        if (name) {
            await addToLeaderboard(name, timeTaken);
            await updateLeaderboardDisplay();
        }
    }
    
    const answersReviewDiv = document.getElementById('answers-review');
    const answersReviewHtml = answersReview.map((review, index) => `
        <div class="answer-review ${review.isCorrect ? 'correct' : 'incorrect'}">
            <p><strong>Question ${index + 1}:</strong> ${review.question}</p>
            <p><strong>Your answer:</strong> ${review.userAnswer}</p>
            <p><strong>Correct answer:</strong> ${review.correctAnswer}</p>
            <p><strong>Status:</strong> ${review.isCorrect ? '✅ Correct' : '❌ Incorrect'}</p>
        </div>
    `).join('');
    
    // Add completion time
    const timeHtml = `<p class="completion-time">Completion Time: ${formatTime(timeTaken)}</p>`;
    
    answersReviewDiv.innerHTML = timeHtml + answersReviewHtml;

    document.getElementById('restart').addEventListener('click', restartQuiz);
}

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

async function promptForName() {
    const name = await Swal.fire({
        title: 'Perfect Score!',
        text: 'Enter your name for the leaderboard:',
        input: 'text',
        inputAttributes: {
            autocapitalize: 'off'
        },
        showCancelButton: true,
        confirmButtonText: 'Submit',
        showLoaderOnConfirm: true,
        allowOutsideClick: () => !Swal.isLoading()
    });
    
    return name.isConfirmed ? name.value : null;
}

async function updateLeaderboardDisplay() {
    const leaderboardData = await getLeaderboard();
    const leaderboardHtml = `
        <div class="leaderboard">
            <h3>Top Scores</h3>
            <table>
                <thead>
                    <tr>
                        <th>Rank</th>
                        <th>Name</th>
                        <th>Time</th>
                    </tr>
                </thead>
                <tbody>
                    ${leaderboardData.map((entry, index) => `
                        <tr>
                            <td>${index + 1}</td>
                            <td>${entry.name}</td>
                            <td>${formatTime(entry.timeInSeconds)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
    
    document.getElementById('answers-review').insertAdjacentHTML('beforebegin', leaderboardHtml);
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

async function showLeaderboard() {
    const leaderboardData = await getLeaderboard();
    
    Swal.fire({
        title: 'Spanish Quiz Leaderboard 🏆',
        html: `
            <div class="leaderboard-modal">
                <table>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Name</th>
                            <th>Time</th>
                            <th>Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${leaderboardData.map((entry, index) => `
                            <tr>
                                <td>${index + 1}</td>
                                <td>${entry.name}</td>
                                <td>${formatTime(entry.timeInSeconds)}</td>
                                <td>${new Date(entry.timestamp).toLocaleDateString()}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
                ${leaderboardData.length === 0 ? '<p class="no-scores">No perfect scores yet. Will you be the first? 🎯</p>' : ''}
            </div>
        `,
        width: '600px',
        showCloseButton: true,
        showConfirmButton: false,
        customClass: {
            container: 'leaderboard-modal-container'
        }
    });
}

// Update the DOM Content Loaded event listener
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    loadQuestions();
    
    // Add leaderboard button click handler
    document.getElementById('leaderboard-btn').addEventListener('click', showLeaderboard);
});

import React from 'react';

const HeaderButtons = () => {
  return (
    <>
      <button 
        className="fixed top-5 left-5 w-10 h-10 rounded-full border-none bg-blue-500 hover:bg-blue-600 text-white cursor-pointer flex items-center justify-center transition-all duration-200" 
        id="leaderboard-btn"
        aria-label="Show leaderboard"
      >
        🏆
      </button>

      <button 
        className="fixed top-5 right-5 w-10 h-10 rounded-full border-none bg-blue-500 hover:bg-blue-600 text-white cursor-pointer flex items-center justify-center transition-all duration-200" 
        id="theme-toggle"
        aria-label="Toggle theme"
      >
        🌙
      </button>
    </>
  );
};

export default HeaderButtons;