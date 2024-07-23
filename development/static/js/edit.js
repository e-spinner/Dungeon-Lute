// static/js/edit.js

// Initial column and row counts for the grid
let cols = 3;
let rows = 2;

// Function to expand the grid to the right by adding a new column
function expandRight() {
    animateButton("r-add");                                         // Animate the button press
    if (cols < 3) {                                                 // Limit the maximum number of columns to 3
        let rows = document.querySelectorAll(".row");               // Select all rows in the grid
        rows.forEach((row) => {
            let slot = document.createElement("td");                // Create a new table cell (slot)
            setSlot(slot);                                          // Set properties for the new slot
            slot.classList.add("slot", "fade-in", "droppable");     // Add classes for styling and animations

            const children = Array.from(row.children);              // Get all children of the row
            row.insertBefore(slot, children[children.length - 1]);  // Insert the new slot before the last child

            // Remove the fade-in class after the animation ends
            setTimeout(() => {
                slot.classList.remove("fade-in");
            }, 500);
        });

        let d = document.getElementById("d");   // Get the element with ID 'd'
        cols += 1;                              // Increment the column count
        d.colSpan += 1;                         // Adjust the colspan attribute of 'd'
        log('edit', 'expanding grid right');
    }
}

// Function to retract the grid from the right by removing the last column
function retractRight() {
    animateButton("r-remove");                                  // Animate the button press
    if (cols > 1) {                                             // Ensure at least one column remains
        let rows = document.querySelectorAll(".row");           // Select all rows in the grid
        rows.forEach((row) => {
            const children = Array.from(row.children);          // Get all children of the row
            let slotToRemove = children[children.length - 2];   // Get the second last child (slot to remove)
            slotToRemove.classList.add("fade-out");             // Add fade-out class for animation

            // Remove the slot after the animation ends
            setTimeout(() => {
                row.removeChild(slotToRemove);
            }, 500);
        });

        setTimeout(() => {
            let d = document.getElementById("d");   // Get the element with ID 'd'
            cols -= 1;                              // Decrement the column count
            d.colSpan -= 1;                         // Adjust the colspan attribute of 'd'
        }, 500);
    }
    log('edit', 'retracting grid right');
}

// Function to expand the grid downwards by adding a new row
function expandDown() {
    animateButton("d-add");                                     // Animate the button press
    let grid = document.getElementById("grid");                 // Get the grid element
    let row = document.createElement("tr");                     // Create a new table row
    let bot = document.getElementById("bot");                   // Get the element with ID 'bot'
    row.classList.add("row");                                   // Add class for styling

    for (let i = 0; i < cols; i++) {                            // Iterate to create slots for the new row
        let slot = document.createElement("td");                // Create a new table cell (slot)
        slot.classList.add("slot", "fade-in", "droppable");     // Add classes for styling and animations
        setSlot(slot);                                          // Set properties for the new slot
        row.appendChild(slot);                                  // Append the slot to the row

        // Remove the fade-in class after the animation ends
        setTimeout(() => {
            slot.classList.remove("fade-in");
        }, 500);
    }

    let td = document.createElement("td");  // Create an additional cell
    row.appendChild(td);                    // Append the cell to the row

    let r = document.getElementById("r");   // Get the element with ID 'r'
    r.rowSpan += 1;                         // Adjust the rowspan attribute of 'r'
    rows += 1;                              // Increment the row count

    grid.insertBefore(row, bot);            // Insert the new row before the 'bot' element
    log('edit', 'expanding grid down');
}

// Function to retract the grid from the bottom by removing the last row
function retractDown() {
    animateButton("d-remove");                              // Animate the button press
    if (rows > 1) {                                         // Ensure at least one row remains
        let grid = document.getElementById("grid");         // Get the grid element
        const children = Array.from(grid.children);         // Get all children of the grid
        let rowToRemove = children[children.length - 2];    // Get the second last row (row to remove)

        // Apply fade-out animation
        rowToRemove.classList.add("fade-out");

        // Remove the row after the animation ends
        setTimeout(() => {
            grid.removeChild(rowToRemove);
            let r = document.getElementById("r");   // Get the element with ID 'r'
            r.rowSpan -= 1;                         // Adjust the rowspan attribute of 'r'
            rows -= 1;                              // Decrement the row count
        }, 500);                                    // Wait for the animation to complete
    }
    log('edit', 'retracting grid down');
}

// Array to store the list of colors
let color_list = [];

// Event listener for DOMContentLoaded to initialize the page
document.addEventListener("DOMContentLoaded", function () {
    if (window.location.pathname == '/edit') {                                      // Check if the current page is '/edit'
        const slots = document.querySelectorAll(".slot");                           // Select all slots in the grid
        const playlistContainer = document.getElementById('playlist-container');    // Get the playlist container element

        // Fetch saved color data from the server
        fetch('/load/data/color')
            .then(response => response.json())  // Parse the response as JSON
            .then(data => {
                if (data.length > 0) {
                    saveColors(data);           // Save the fetched colors
                    colors = data;              // Assign the fetched colors to a variable
                }
            });

        let stylesheet = document.styleSheets[1]; // Get the second stylesheet

        log('edit', 'initializing playlist list');

        // Fetch the list of playlists from the server
        fetch('/playlists')
            .then(response => response.json())                      // Parse the response as JSON
            .then(playlists => {
                playlists.forEach((playlist) => {
                    let pl = document.createElement('div');         // Create a new div for each playlist
                    pl.classList.add('playlist', 'draggable');      // Add classes for styling and dragging
                    pl.draggable = 'true';                          // Make the playlist draggable
                    pl.innerText = playlist;                        // Set the playlist name as the div content
                    pl.addEventListener('dragstart', dragstart);    // Add dragstart event listener
                    playlistContainer.appendChild(pl);              // Append the playlist div to the container

                    color_list.push(playlist);                                  // Add the playlist to the color list
                    stylesheet.insertRule(`#${playlist} { }`, 0);               // Add an empty rule for the playlist
                    color_list.push(`${playlist}:hover`);                       // Add hover state to the color list
                    stylesheet.insertRule(`#${`${playlist}:hover`} { }`, 0);    // Add an empty rule for hover state
                    color_list.push(`${playlist}.playing`);                             // Add playing state to the color list
                    stylesheet.insertRule(`#${`${playlist}.playing`} { }`, 0);          // Add an empty rule for playing state
                    color_list.push(`${playlist}.playing:hover`);                       // Add playing:hover state to the color list
                    stylesheet.insertRule(`#${`${playlist}.playing:hover`} { }`, 0);    // Add an empty rule for playing:hover state
                });
            });

        // Add dragover event listener to each slot
        slots.forEach((slot) => {
            setSlot(slot); // Set properties and event listeners for the slot
        });

        // Add change event listener to the accent-color input element
        document.getElementById('accent-color').addEventListener('change', updateColor);
    }
});

// Function to handle the dragstart event
function dragstart(event) {
    // Set the data being dragged to the text content of the dragged element
    event.dataTransfer.setData("text/plain", event.target.textContent);

    // If the dragged element is a slot, update its properties
    if (this.classList.contains('slot')) {
        this.classList.remove('draggable'); // Remove draggable class
        this.draggable = false;             // Disable dragging
        this.innerText = '';                // Clear the text content
        this.id = '';                       // Clear the id attribute
        this.dataset.color = '#000';        // Set the default color
    }
}

// Function to handle the dragover event
function dragOver(event) {
    event.preventDefault(); // Prevent default behavior to allow drop
}

// Function to handle the dragenter event
function dragEnter(event) {
    event.preventDefault();         // Prevent default behavior to allow drop
    this.classList.add("hover");    // Add hover class for styling
}

// Function to handle the dragleave event
function dragLeave() {
    this.classList.remove("hover"); // Remove hover class for styling
}

// Function to handle the drop event
function drop(event) {
    event.preventDefault();                                 // Prevent default behavior
    const data = event.dataTransfer.getData("text/plain");  // Get the dragged data
    this.innerHTML = data;                                  // Set the slot's inner HTML to the dragged data
    this.id = data;                                         // Set the slot's id to the dragged data
    this.classList.add("draggable");                        // Add draggable class
    this.draggable = "true";                                // Enable dragging
    this.cursor = "grab";                                   // Set cursor to grab
    this.addEventListener("dragstart", dragstart);          // Add dragstart event listener

    // Remove active and playing classes from all slots
    Array.from(document.querySelectorAll('.slot')).forEach((s) => {
        s.classList.remove('active', 'playing');
    });
    this.classList.add('active', 'playing');    // Add active and playing classes to the current slot
    activateColors(this);                       // Activate colors for the current slot

    this.classList.remove("hover"); // Remove hover class

    // Add click event listener to toggle active and playing classes
    this.onclick = () => {
        if (this.classList.contains('active')) {
            this.classList.remove('active', 'playing');
        } else {
            // Remove active and playing classes from all slots
            Array.from(document.querySelectorAll('.slot')).forEach((s) => {
                s.classList.remove('active', 'playing');
            });
            this.classList.add('active', 'playing');    // Add active and playing classes to the current slot
            activateColors(this);                       // Activate colors for the current slot
        }
    };
}

// Function to set properties and event listeners for a slot
function setSlot(slot) {
    slot.addEventListener("dragover", dragOver);    // Add dragover event listener
    slot.addEventListener("dragenter", dragEnter);  // Add dragenter event listener
    slot.addEventListener("dragleave", dragLeave);  // Add dragleave event listener
    slot.addEventListener("drop", drop);            // Add drop event listener
}

// Function to save the current preset
function savePreset() {
    const preset = document.getElementById('preset-name');  // Get the preset name element
    let name = preset.innerText;                            // Get the preset name

    let soundBoard = [];                                // Initialize sound board array

    const rows = document.querySelectorAll('.row');     // Select all rows in the grid
    rows.forEach((row) => {
        let boardRow = [];                              // Initialize row array
        const children = Array.from(row.children);      // Get all children of the row
        children.forEach((child) => {
            if (child.classList.contains('slot')) {
                if (child.classList.contains('draggable')) {
                    boardRow.push(child.innerText);     // Add slot content to the row array
                } else {
                    boardRow.push('blank');              // Add 'blank' for empty slots
                }
            }
        });
        soundBoard.push(boardRow); // Add row array to the sound board array
    });

    const stylesheet = document.styleSheets[1];             // Get the second stylesheet
    let cssRules = [];                                      // Initialize CSS rules array
    for (let i = 0; i < stylesheet.cssRules.length; i++) {
        cssRules.push(stylesheet.cssRules[i].cssText);      // Add each CSS rule to the array
    }

    log('edit', `saving preset - ${name}`); // Log the saving action
    fetch(`/save/${name}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            soundBoard: soundBoard,     // Send the sound board data
            cssRules: cssRules          // Send the CSS rules
        })
    }).then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                log('edit', 'saving successful');
            } else {
                log('edit', 'saving error');
            }

            window.location.href = '/';     // Redirect to the home page
        });
}

// Function to activate colors for a slot
function activateColors(slot) {
    document.getElementById('accent-color').value = slot.dataset.color; // Set the accent color input to the slot's color
}

// Function to update the color based on user input
function updateColor() {
    let stylesheet = document.styleSheets[1];                                           // Get the second stylesheet
    const slot = document.querySelector('.active');                                     // Get the active slot
    slot.setAttribute('data-color', document.getElementById('accent-color').value);     // Update the slot's color
    const accent = slot.dataset.color;                                                  // Get the updated color

    const ruleChanges = [
        { selector: `#${slot.id}`, color: adjustLightless(accent, 25) },
        { selector: `#${slot.id}:hover`, color: adjustLightless(accent, 35) },
        { selector: `#${slot.id}.playing`, color: adjustLightless(accent, 0) },
        { selector: `#${slot.id}.playing:hover`, color: adjustLightless(accent, -10) }
    ];

    ruleChanges.forEach(({ selector, color }) => {
        let ruleIndex = -1;
        for (let i = 0; i < stylesheet.cssRules.length; i++) {
            if (stylesheet.cssRules[i].selectorText === selector) {
                ruleIndex = i;
                break;
            }
        }
        if (ruleIndex !== -1) {
            stylesheet.deleteRule(ruleIndex);                                                   // Delete the existing rule
            stylesheet.insertRule(`${selector} { background-color: ${color}; }`, ruleIndex);    // Insert the new rule
        }
    });
}
