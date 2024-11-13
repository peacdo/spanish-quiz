let currentQuestion = 0;
let userAnswers = [];
let quizQuestions;
let startTime;
let endTime;

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getFirestore, collection, addDoc, query, orderBy, limit, getDocs } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDophykOqVYKV7t_YthU3vHzk-OvvrJJeE",
    authDomain: "spanish-quiz-fe087.firebaseapp.com",
    projectId: "spanish-quiz-fe087",
    storageBucket: "spanish-quiz-fe087.appspot.com",
    messagingSenderId: "834025143539",
    appId: "1:834025143539:web:2fa8d34545a0a75894cb86",
    measurementId: "G-EVEJ2WXRWX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Adds a user to the leaderboard
async function addToLeaderboard(name, score, timeInSeconds) {
    try {
        const docRef = await addDoc(collection(db, "leaderboard"), {
            name: name,
            score: score,
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

// Retrieves leaderboard data
async function getLeaderboard() {
    const leaderboardQuery = query(
        collection(db, "leaderboard"),
        orderBy("score", "desc"),
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

// Show quiz results and handle leaderboard submission
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

    const name = await promptForName(score);
    if (name) {
        await addToLeaderboard(name, score, timeTaken);
        await updateLeaderboardDisplay();
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
    
    const timeHtml = `<p class="completion-time">Completion Time: ${formatTime(timeTaken)}</p>`;
    answersReviewDiv.innerHTML = timeHtml + answersReviewHtml;
    
    document.getElementById('restart').addEventListener('click', restartQuiz);
}

// Prompts user for name based on score and returns it
async function promptForName(score) {
    const message = score === 60 ? 'Perfect Score! 🎉' : 
                    score >= 45 ? 'Great job! 🌟' :
                    score >= 30 ? 'Well done! 👍' : 
                    'Thanks for playing! 😊';
                    
    const result = await Swal.fire({
        title: message,
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
    
    return result.isConfirmed ? result.value : null;
}

// Helper function to format time
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// Event listeners and initial setup
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    loadQuestions();
    const leaderboardBtn = document.getElementById('leaderboard-btn');
    if (leaderboardBtn) leaderboardBtn.addEventListener('click', showLeaderboard);
});

// Other functions remain the same...
