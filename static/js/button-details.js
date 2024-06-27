// Function to show button details
function showButtonDetails(index) {
    const button = buttons[index];

    const buttonDetails = document.getElementById('button-details');
    const buttonTitle = document.getElementById('button-title');
    const buttonName = document.getElementById('button-name');
    const soundList = document.getElementById('soundList');

    buttonTitle.innerText = `${button.name || `Button ${index + 1}`}`;
    buttonName.value = button.name;

    soundList.innerHTML = '';
    button.sounds.forEach((sound, idx) => {
        const listItem = document.createElement('li');
        listItem.innerText = sound;
        listItem.className = 'sound-item';
        listItem.dataset.index = idx; // Store the index in a data attribute
        listItem.addEventListener('click', () => playSound(index, idx)); // Add click event listener
        soundList.appendChild(listItem);
    });

    buttonDetails.classList.add('active');
    highlightPlayingSong(index);
}

// Function to update button name
function updateButtonName() {
    const buttonName = document.getElementById('button-name');
    if (activeButtonIndex !== null) {
        buttons[activeButtonIndex].name = buttonName.value;
        renderButtons();
        showButtonDetails(activeButtonIndex); // Update the details section title as well
    }
}

// Function to upload a file
function uploadFile() {
    const input = document.getElementById('fileInput');
    const file = input.files[0];
    const formData = new FormData();
    formData.append('file', file);

    fetch('/upload', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.filename) {
            alert('File uploaded successfully');
            addSoundToList(data.filename);
        } else {
            alert('File upload failed');
        }
    });
}

// Function to add sound to the list
function addSoundToList(filename) {
    const soundList = document.getElementById('soundList');
    const listItem = document.createElement('li');
    listItem.innerText = filename;
    listItem.className = 'sound-item';
    soundList.appendChild(listItem);

    if (activeButtonIndex !== null) {
        buttons[activeButtonIndex].sounds.push(filename);
    }
}

// Function to highlight the currently playing song
function highlightPlayingSong(index) {
    const soundItems = document.querySelectorAll('.sound-item');
    soundItems.forEach(item => item.classList.remove('playing'));

    const currentButton = buttons[index];
    const currentSound = lastPlayedSong[index];

    if (currentButton && currentSound) {
        soundItems.forEach(item => {
            if (item.innerText === currentSound) {
                item.classList.add('playing');
            }
        });
    }
}
