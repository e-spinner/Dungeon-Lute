// Function to render the buttons on the soundboard
function renderButtons() {
    const soundboard = document.getElementById('soundboard');
    soundboard.innerHTML = '';
    buttons.forEach((button, index) => {
        const btn = document.createElement('button');
        btn.className = 'sound-button';
        btn.innerText = button.name || `Button ${index + 1}`;
        btn.onclick = () => handleButtonClick(index);
        soundboard.appendChild(btn);
    });
}

// Function to handle button clicks
function handleButtonClick(index) {
    if (activeButtonIndex === index) {
        if (audio && !audio.paused) {
            stopCurrentAudio();
            return;
        }
    }
    
    stopCurrentAudio();
    
    activeButtonIndex = index;
    playRandomSound(index);
    showButtonDetails(index);
}

// Function to stop the current audio
function stopCurrentAudio() {
    if (audio) {
        audio.pause();
        audio = null;
    }
    if (activeButtonIndex !== null) {
        const buttons = document.querySelectorAll('.sound-button');
        buttons[activeButtonIndex].classList.remove('active');
    }
}

// Function to play a specific sound
function playSound(index, soundIndex) {
    stopCurrentAudio()
    const button = buttons[index];
    const sound = button.sounds[soundIndex];

    if (lastPlayedSong[index] != sound) {
        addToHistory(index, soundIndex); // Add to history
    }
    lastPlayedSong[index] = sound;

    audio = new Audio(`/sounds/${sound}`);
    audio.play();
    audio.onended = () => playRandomSound(index);
    highlightPlayingSong(index);

    const buttonElements = document.querySelectorAll('.sound-button');
    buttonElements[index].classList.add('active');
}

// Function to play a random sound from a button's list
function playRandomSound(index) {
    const button = buttons[index];
    if (button.sounds.length > 0) {
        const availableSongs = button.sounds.filter(sound => sound !== lastPlayedSong[index]);
        if (availableSongs.length === 0) {
            availableSongs.push(...button.sounds);
        }
        const randomIndex = Math.floor(Math.random() * availableSongs.length);
        const sound = availableSongs[randomIndex];

        if (lastPlayedSong[index] != sound) {
            addToHistory(index, button.sounds.indexOf(sound)); // Add to history
        }
        lastPlayedSong[index] = sound;
        
        audio = new Audio(`/sounds/${sound}`);
        audio.play();
        audio.onended = () => playRandomSound(index);
        highlightPlayingSong(index);
        
        const buttonElements = document.querySelectorAll('.sound-button');
        buttonElements[index].classList.add('active');
    }
}
