function showScreen(id) {
    // hide all screens
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });

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
    showScreen('camera-access');
});

// allow camera access?
document.getElementById('button-allow-camera').addEventListener('click', async function () {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(track => track.stop());
        showScreen('how-to-play');
    } catch (error) {
        console.error('camera access denied:', error);
        showScreen('piano-demo');
    }
});

// how to play
document.getElementById('button-ready').addEventListener('click', function () {
    showScreen('piano');
});

// air piano
document.getElementById('button-done').addEventListener('click', function () {
    showScreen('survey-intro');
});

// survey intro
document.getElementById('button-begin-survey').addEventListener('click', function () {
    showScreen('survey');
    showQuestion(1);
});

// survey questions
let currentQuestion = 1;
const totalQuestions = 6;

function showQuestion(number) {
    document.querySelectorAll('.survey-question').forEach(question => {
        question.classList.remove('active');
    });

    const target = document.querySelector(`[data-question="${number}"]`);
    if (target) {
        target.classList.add('active');
        currentQuestion = number;
    }
}

// survey answer selection
document.querySelectorAll('.answer-button').forEach(button => {
    button.addEventListener('click', function () {
        const questionDiv = this.closest('.survey-question');
        const questionNumber = parseInt(questionDiv.dataset.question);

        // marks answer as selected
        questionDiv.querySelectorAll('.answer-button').forEach(btn => {
            btn.classList.remove('selected');
        });
        this.classList.add('selected');

        // move to next question after a short delay
        setTimeout(function () {
            if (questionNumber < totalQuestions) {
                showQuestion(questionNumber + 1);
            } else {
                showScreen('ending');
            }
        }, 400);
    });
});

// ending screen
document.getElementById('button-play-again').addEventListener('click', function () {
    // reset survey selections
    document.querySelectorAll('.answer-button').forEach(btn => {
        btn.classList.remove('selected');
    });

    // go back to intro
    showScreen('intro');
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

// landmark indices for fingertips and the joint below them (pip)
const fingerTips = [4, 8, 12, 16, 20];
const fingerPIPs = [3, 6, 10, 14, 18];

function isFingerCurled(landmarks, fingerIndex) {
    const tip = landmarks[fingerTips[fingerIndex]];
    const pip = landmarks[fingerPIPs[fingerIndex]];

    if (fingerIndex === 0) {
        // thumb moves sideways, so check x-distance to wrist
        const wrist = landmarks[0];
        const thumbBase = landmarks[2];
        const tipDist = Math.abs(tip.x - wrist.x);
        const baseDist = Math.abs(thumbBase.x - wrist.x);
        return tipDist < baseDist * 0.7;
    } else {
        // for other fingers, tip below pip means curled
        return tip.y > pip.y;
    }
}

function onHandResults(results) {
    // resize canvas to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // if no hands detected, release all notes
    if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
        for (let i = 0; i < 10; i++) {
            stopNote(i);
        }
        return;
    }

    // sort hands into left and right -> mediapipe labels a mirrored perspective (mediapipe "right" = user's left hand)
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

    // stop all active notes
    for (let i = 0; i < 10; i++) {
        stopNote(i);
    }

    // stop the camera
    if (camera) {
        camera.stop();
        camera = null;
    }

    // stop the webcam stream
    if (video.srcObject) {
        video.srcObject.getTracks().forEach(track => track.stop());
        video.srcObject = null;
    }
}