document.addEventListener('DOMContentLoaded', (event) => {
    loadSoundboard();
});

let buttons = [];
let activeButtonIndex = null;
let audio = null;
let currentAudio = null;
let lastPlayedSong = {};
let history = [];

// Function to load the soundboard buttons
function loadSoundboard() {
    fetch('/get_buttons')
        .then(response => response.json())
        .then(data => {
            buttons = data;
            renderButtons();
        });
}

// Function to add button-song combination to history
function addToHistory(index, soundIndex) {
    history.push({ index, soundIndex });
    updateHistoryDisplay();
}

// Function to update the history display
function updateHistoryDisplay() {
    const historyList = document.getElementById('historyList');
    historyList.innerHTML = '';
    history.forEach((entry, index) => {
        const listItem = document.createElement('li');
        listItem.innerText = `Step ${index + 1}: Button ${entry.index + 1} - Song ${entry.soundIndex + 1}`;
        historyList.appendChild(listItem);
    });
}

// Function to rewind to previous button-song combination
function rewindToPrevious() {
    if (history.length > 1) {
        history.pop(); // Remove the current button-song combination
        updateHistoryDisplay();
        const { index, soundIndex } = history[history.length - 1];


        stopCurrentAudio()
    
        activeButtonIndex = index;
        playSound(index, soundIndex); 
        showButtonDetails(index); 

        history.pop();
        updateHistoryDisplay();
    }
}

function next() {
    index = activeButtonIndex;
    stopCurrentAudio()
    playRandomSound(index);
    showButtonDetails(index);
}

function pause_play() {
    let button = document.getElementById('pause_play');
    if (audio.paused) {
        audio.play();
        button.innerText = 'Pause';
    }
    else {
        audio.pause();
        button.innerText = 'Play';
    }
}

// Function to save the buttons
function saveButtons() {
    fetch('/save_buttons', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(buttons)
    }).then(response => response.json())
      .then(data => {
          if (data.status === 'success') {
              alert('Buttons saved successfully!');
          }
      });
}

function addButton() {
    buttons.push({ name: '', sounds: [] });
    renderButtons();
}
