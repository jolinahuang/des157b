Parse.initialize(
    'ZyjEsYCANgqjpUgpuyI5ebQro17GUMDn0NaZELxv',
    'jRL0OCO4qwJf7XjwR4tntJZBq0bzEPGhiNsr0qcj'
);
Parse.serverURL = 'https://parseapi.back4app.com/';


function showScreen(id) {
    // hide all screens
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });

    // pause demo video when leaving that screen
    const demoVideo = document.getElementById('demo-video');
    if (demoVideo) {
        demoVideo.pause();
        demoVideo.currentTime = 0;
    }

    // show the target screen
    const target = document.getElementById(id);
    if (target) {
        target.classList.add('active');
        window.scrollTo(0, 0);
    }

    // start or stop the piano based on which screen is active
    if (id === 'piano') {
        startPiano();
    } else {
        stopPiano();
    }
}

// intro screen
document.getElementById('button-try').addEventListener('click', function () {
    showScreen('how-to-play');
});

document.getElementById('button-watch-demo').addEventListener('click', function () {
    showScreen('piano-demo');
});

// how to play
document.getElementById('button-ready').addEventListener('click', function () {
    showScreen('camera-access');
});

// allow camera access?
document.getElementById('button-allow-camera').addEventListener('click', async function () {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(track => track.stop());
        showScreen('piano');
    } catch (error) {
        console.error('camera access denied:', error);
        showScreen('piano-demo');
    }
});

document.getElementById('button-no-demo').addEventListener('click', function () {
    showScreen('piano-demo');
});

// air piano
document.getElementById('button-done').addEventListener('click', function () {
    showScreen('survey-intro');
});

// demo video
document.getElementById('button-continue-survey').addEventListener('click', function () {
    showScreen('survey-intro');
});

document.getElementById('button-try-piano').addEventListener('click', function () {
    showScreen('how-to-play');
});

// survey intro
document.getElementById('button-begin-survey').addEventListener('click', function () {
    showScreen('survey');
    resetSurvey();
    revealSurveyItem('question', 1);
});

// finish survey
document.getElementById('button-finish-survey').addEventListener('click', function () {
    showScreen('ending');
});

// ending screen
document.getElementById('button-play-again').addEventListener('click', function () {
    resetSurvey();
    showScreen('intro');
});


const totalQuestions = 6;
const surveyContainer = document.getElementById('survey');

const questionAnswers = {
    1: ['Yes, for most of my life', 'I started learning recently', "I've tried it a few times", 'Never'],
    2: ['It felt like playing music', 'It started to feel like playing music', 'It felt more like a simulation', 'It just felt like moving my fingers'],
    3: ['Absolutely', "It's a good start", "It's better than nothing", 'Not really'],
    4: ['Their skill becomes even more valuable', 'Both paths can coexist', 'It devalues what they learned', "I'm not too sure"],
    5: ['Yes, the instrument is a part of the art', 'It matters but less than I thought', "It's starting to not matter", 'No, only the music matters'],
    6: ['Much closer', 'Closer but something is missing', 'It depends on the person', 'Further from it']
};

function resetSurvey() {
    // hide all survey items and reset selections
    document.querySelectorAll('.survey-question, .survey-results-view').forEach(el => {
        el.classList.remove('visible');
    });
    document.querySelectorAll('.answer-button').forEach(btn => {
        btn.classList.remove('selected');
    });
    // scroll survey container to top
    if (surveyContainer) surveyContainer.scrollTop = 0;
}

function revealSurveyItem(type, number) {
    let target;
    if (type === 'question') {
        target = document.querySelector(`[data-question="${number}"]`);
    } else {
        target = document.querySelector(`[data-results="${number}"]`);
    }

    if (target) {
        target.classList.add('visible');

        setTimeout(() => {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    }
}

// save a survey response to back4app
async function saveResponse(questionNumber, answer) {
    try {
        const SurveyResponse = Parse.Object.extend('SurveyResponse');
        const response = new SurveyResponse();
        response.set('questionNumber', questionNumber);
        response.set('answer', answer);

        // make the response publicly readable and writable
        const acl = new Parse.ACL();
        acl.setPublicReadAccess(true);
        acl.setPublicWriteAccess(true);
        response.setACL(acl);

        await response.save();
        console.log('response saved successfully');
    } catch (error) {
        console.error('failed to save response:', error);
    }
}

// get results for a question from back4app
async function fetchResults(questionNumber) {
    try {
        const SurveyResponse = Parse.Object.extend('SurveyResponse');
        const query = new Parse.Query(SurveyResponse);
        query.equalTo('questionNumber', questionNumber);
        query.limit(10000);
        const results = await query.find();

        // count each answer
        const counts = {};
        const answers = questionAnswers[questionNumber];
        answers.forEach(answer => { counts[answer] = 0; });

        results.forEach(result => {
            const answer = result.get('answer');
            if (counts[answer] !== undefined) {
                counts[answer]++;
            }
        });

        const total = results.length;
        return { counts, total };
    } catch (error) {
        console.error('failed to fetch results:', error);
        return { counts: {}, total: 0 };
    }
}

// results bars for a question
function renderResults(questionNumber, counts, total) {
    const resultsView = document.querySelector(`[data-results="${questionNumber}"]`);
    if (!resultsView) return;

    // update respondent count
    const countSpan = resultsView.querySelector('.respondent-count');
    if (countSpan) countSpan.textContent = total;

    // find the most popular answer
    const answers = questionAnswers[questionNumber];
    let maxCount = 0;
    answers.forEach(answer => {
        const count = counts[answer] || 0;
        if (count > maxCount) maxCount = count;
    });

    const barsContainer = resultsView.querySelector('.results-bars');
    barsContainer.innerHTML = '';

    answers.forEach(answer => {
        const count = counts[answer] || 0;
        const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
        const isMostPopular = count === maxCount && count > 0;

        const fillColor = isMostPopular
            ? 'rgba(199, 187, 255, 0.8)'
            : 'rgba(255, 254, 250, 0.8)';

        const item = document.createElement('div');
        item.className = 'result-item';
        item.innerHTML = `
            <div class="result-header">
                <span class="result-answer">${answer}</span>
                <span class="result-percentage">${percentage}%</span>
            </div>
            <div class="result-bar-track">
                <div class="result-bar-fill" style="width: 0%; background: ${fillColor}"></div>
            </div>
        `;
        barsContainer.appendChild(item);

        // animate the bar fill after a short delay
        setTimeout(() => {
            item.querySelector('.result-bar-fill').style.width = percentage + '%';
        }, 200);
    });
}

// handle answer selection
document.querySelectorAll('.answer-button').forEach(button => {
    button.addEventListener('click', async function () {
        const questionDiv = this.closest('.survey-question');
        const questionNumber = parseInt(questionDiv.dataset.question);
        const answer = this.dataset.answer;

        // mark as selected
        questionDiv.querySelectorAll('.answer-button').forEach(btn => {
            btn.classList.remove('selected');
        });
        this.classList.add('selected');

        // save response to back4app
        await saveResponse(questionNumber, answer);

        setTimeout(async () => {
            const { counts, total } = await fetchResults(questionNumber);
            renderResults(questionNumber, counts, total);

            // reveal results for this question
            revealSurveyItem('results', questionNumber);

            // also reveal the next question so user can scroll to it
            if (questionNumber < totalQuestions) {
                const nextQ = document.querySelector(`[data-question="${questionNumber + 1}"]`);
                if (nextQ) nextQ.classList.add('visible');
            }
        }, 400);
    });
});


// air piano using mediapipe hands + tone.js
const video = document.getElementById('webcam');
const canvas = document.getElementById('hand-canvas');
const ctx = canvas.getContext('2d');
const keyElements = document.querySelectorAll('#piano .piano-keys .key');

// 10 fingers mapped to 10 notes across two octaves
const noteNames = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5'];

// tone.js setup
let synth = null;
let toneStarted = false;
let activeNotes = {};

function initTone() {
    if (synth) return;

    synth = new Tone.PolySynth(Tone.Synth, {
        maxPolyphony: 10,
        voice: Tone.Synth,
        options: {
            oscillator: { type: 'triangle' },
            envelope: {
                attack: 0.02,
                decay: 0.3,
                sustain: 0.4,
                release: 0.8
            },
            volume: -8
        }
    }).toDestination();
}

async function ensureToneStarted() {
    if (!toneStarted) {
        await Tone.start();
        toneStarted = true;
        initTone();
    }
}

function playNote(noteIndex) {
    if (!synth) return;
    const note = noteNames[noteIndex];

    if (!activeNotes[note]) {
        activeNotes[note] = true;
        synth.triggerAttack(note);

        if (keyElements[noteIndex]) {
            keyElements[noteIndex].classList.add('active');
        }
    }
}

function stopNote(noteIndex) {
    if (!synth) return;
    const note = noteNames[noteIndex];

    if (activeNotes[note]) {
        activeNotes[note] = false;
        synth.triggerRelease(note);

        if (keyElements[noteIndex]) {
            keyElements[noteIndex].classList.remove('active');
        }
    }
}

// mediapipe hands setup
let hands = null;
let camera = null;
let pianoRunning = false;

const fingerTips = [4, 8, 12, 16, 20];
const fingerPIPs = [3, 6, 10, 14, 18];

function isFingerCurled(landmarks, fingerIndex) {
    const tip = landmarks[fingerTips[fingerIndex]];
    const pip = landmarks[fingerPIPs[fingerIndex]];

    if (fingerIndex === 0) {
        const wrist = landmarks[0];
        const thumbBase = landmarks[2];
        const tipDist = Math.abs(tip.x - wrist.x);
        const baseDist = Math.abs(thumbBase.x - wrist.x);
        return tipDist < baseDist * 0.7;
    } else {
        return tip.y > pip.y;
    }
}

function onHandResults(results) {
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
        for (let i = 0; i < 10; i++) {
            stopNote(i);
        }
        return;
    }

    let leftLandmarks = null;
    let rightLandmarks = null;

    for (let i = 0; i < results.multiHandLandmarks.length; i++) {
        const label = results.multiHandedness[i].label;
        const landmarks = results.multiHandLandmarks[i];

        if (label === 'Right') {
            leftLandmarks = landmarks;
        } else if (label === 'Left') {
            rightLandmarks = landmarks;
        }
    }

    // draw hand skeleton overlay
    for (const landmarks of results.multiHandLandmarks) {
        drawConnectors(ctx, landmarks, HAND_CONNECTIONS, {
            color: 'rgba(150, 180, 255, 0.5)',
            lineWidth: 2
        });
        drawLandmarks(ctx, landmarks, {
            color: 'rgba(150, 180, 255, 0.9)',
            lineWidth: 1,
            radius: 3
        });
    }

    // left hand tracking
    if (leftLandmarks) {
        const leftFingerMap = [4, 3, 2, 1, 0];
        for (let f = 0; f < 5; f++) {
            const noteIndex = leftFingerMap[f];
            if (isFingerCurled(leftLandmarks, f)) {
                playNote(noteIndex);
            } else {
                stopNote(noteIndex);
            }
        }
    } else {
        for (let i = 0; i < 5; i++) {
            stopNote(i);
        }
    }

    // right hand tracking
    if (rightLandmarks) {
        const rightFingerMap = [5, 6, 7, 8, 9];
        for (let f = 0; f < 5; f++) {
            const noteIndex = rightFingerMap[f];
            if (isFingerCurled(rightLandmarks, f)) {
                playNote(noteIndex);
            } else {
                stopNote(noteIndex);
            }
        }
    } else {
        for (let i = 5; i < 10; i++) {
            stopNote(i);
        }
    }
}

function initMediaPipe() {
    if (hands) return;

    hands = new Hands({
        locateFile: (file) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
        }
    });

    hands.setOptions({
        maxNumHands: 2,
        modelComplexity: 1,
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.5
    });

    hands.onResults(onHandResults);
}

async function startPiano() {
    if (pianoRunning) return;
    pianoRunning = true;

    await ensureToneStarted();
    initMediaPipe();

    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { width: 640, height: 480, facingMode: 'user' }
        });

        video.srcObject = stream;
        await video.play();

        camera = new Camera(video, {
            onFrame: async () => {
                if (pianoRunning && hands) {
                    await hands.send({ image: video });
                }
            },
            width: 640,
            height: 480
        });

        camera.start();
    } catch (error) {
        console.error('failed to start piano:', error);
    }
}

function stopPiano() {
    pianoRunning = false;

    for (let i = 0; i < 10; i++) {
        stopNote(i);
    }

    if (camera) {
        camera.stop();
        camera = null;
    }

    if (video.srcObject) {
        video.srcObject.getTracks().forEach(track => track.stop());
        video.srcObject = null;
    }
}