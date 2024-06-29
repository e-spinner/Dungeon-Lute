let cols = 1;
let rows = 1;
function animateButton(buttonId) {
  const button = document.getElementById(buttonId);
  button.classList.add("clicked");
  setTimeout(() => {
    button.classList.remove("clicked");
  }, 300);
}
function R() {
  animateButton("r-add");
  let rows = document.querySelectorAll(".row");
  rows.forEach((row) => {
    let slot = document.createElement("td");
    setSlot(slot);
    slot.classList.add("slot", "fade-in", "droppable");

    const children = Array.from(row.children);
    row.insertBefore(slot, children[children.length - 1]);

    // Remove the fade-in class after the animation ends
    setTimeout(() => {
      slot.classList.remove("fade-in");
    }, 500);
  });

  let d = document.getElementById("d");
  cols += 1;
  d.colSpan += 1;
}
function r() {
  animateButton("r-remove");
  if (cols > 1) {
    let rows = document.querySelectorAll(".row");
    rows.forEach((row) => {
      const children = Array.from(row.children);
      let slotToRemove = children[children.length - 2];
      slotToRemove.classList.add("fade-out");

      // Remove the element after the animation ends
      setTimeout(() => {
        row.removeChild(slotToRemove);
      }, 500);
    });

    setTimeout(() => {
      let d = document.getElementById("d");
      cols -= 1;
      d.colSpan -= 1;
    }, 500);
  }
}
function D() {
  animateButton("d-add");
  let grid = document.getElementById("grid");
  let row = document.createElement("tr");
  let bot = document.getElementById("bot");
  row.classList.add("row");

  for (let i = 0; i < cols; i++) {
    let slot = document.createElement("td");
    slot.classList.add("slot", "fade-in", "droppable");
    setSlot(slot);
    row.appendChild(slot);

    // Remove the fade-in class after the animation ends
    setTimeout(() => {
      slot.classList.remove("fade-in");
    }, 500);
  }

  let td = document.createElement("td");
  row.appendChild(td);

  let r = document.getElementById("r");
  r.rowSpan += 1;
  rows += 1;

  grid.insertBefore(row, bot);
}
function d() {
  animateButton("d-remove");
  if (rows > 1) {
    let grid = document.getElementById("grid");
    const children = Array.from(grid.children);
    let rowToRemove = children[children.length - 2];

    // Apply fade-out animation
    rowToRemove.classList.add("fade-out");

    // Remove the row after the animation ends
    setTimeout(() => {
      grid.removeChild(rowToRemove);
      let r = document.getElementById("r");
      r.rowSpan -= 1;
      rows -= 1;
    }, 500); // Wait for the animation to complete
  }
}

document.addEventListener("DOMContentLoaded", function () {
  const playlists = document.querySelectorAll(".playlist");
  const slots = document.querySelectorAll(".slot");

  // Add dragstart event listener to each playlist item
  playlists.forEach((playlist) => {
    playlist.addEventListener("dragstart", dragStart);
  });

  // Add dragover event listener to each slot
  slots.forEach((slot) => {
    setSlot(slot);
  });
});

function dragStart(event) {
  event.dataTransfer.setData("text/plain", event.target.textContent);
  if ( this.classList.contains( 'slot' ) ) {
    this.classList.remove( 'draggable' );
    this.draggable = false;
    this.innerText = '';
  }
}
function dragOver(event) {
  event.preventDefault();
}
function dragEnter(event) {
  event.preventDefault();
  this.classList.add("hover");
}
function dragLeave() {
  this.classList.remove("hover");
}
function drop(event) {
  event.preventDefault();
  const data = event.dataTransfer.getData("text/plain");
  this.innerHTML = data;
  this.classList.add("draggable");
  this.draggable = "true";
  this.cursor = "grab";
  this.addEventListener("dragstart", dragStart);
  
  this.classList.remove("hover");
}
function setSlot(slot) {
  slot.addEventListener("dragover", dragOver);
  slot.addEventListener("dragenter", dragEnter);
  slot.addEventListener("dragleave", dragLeave);
  slot.addEventListener("drop", drop);
}


// gets playlists
// fetch( '/playlists' )
// .then( response => response.json() )
// .then( playlists => {
//     const playlistSelect = document.getElementById( 'playlist-select' );
//     playlists.forEach( playlist => {
//         const option = document.createElement( 'option' );
//         option.value = playlist;
//         option.innerText = playlist;
//         playlistSelect.appendChild( option );
//     } );
// } );

// // Function to load songs from the selected playlist
// function loadPlaylist() {
//     const playlist = document.getElementById( 'playlist-select' ).value;
//     if ( playlist ) {
//         buttons[activeButtonIndex].name = playlist
//         renderButtons()
//         fetch( `/get_songs/${playlist}` )
//             .then( response => response.json() )
//             .then( songs => {
//                 const soundList = document.getElementById( 'soundList' );
//                 soundList.innerHTML = '';
//                 songs.forEach( ( song, idx ) => {
//                     const listItem = document.createElement( 'li' );
//                     listItem.innerText = song;
//                     listItem.className = 'sound-item';
//                     listItem.dataset.index = idx; // Store the index in a data attribute
//                     listItem.addEventListener( 'click', () => playSound( currentButtonIndex, idx ) ); // Add click event listener
//                     soundList.appendChild( listItem );
//                 } );
//                 // Update the current button's sounds
//                 if ( activeButtonIndex !== null ) {
//                     buttons[activeButtonIndex].sounds = songs;
//                 }
//             } );
//         handleButtonClick( activeButtonIndex )
//         showButtonDetails( activeButtonIndex )
//     }
// }