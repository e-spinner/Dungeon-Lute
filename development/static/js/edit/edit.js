/* Expanding slots */
let cols = 3;
let rows = 2;
function R() {
  a("r-add");
  if ( cols < 3 ) {
    let rows = document.querySelectorAll(".row");
    rows.forEach((row) => {
      let slot = document.createElement("td");
      ss(slot);
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
    log( 'edit', 'expanding grid right')
  }
}
function r() {
  a("r-remove");
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
  log( 'edit', 'retracting grid right')
}
function D() {
  a("d-add");
  let grid = document.getElementById("grid");
  let row = document.createElement("tr");
  let bot = document.getElementById("bot");
  row.classList.add("row");

  for (let i = 0; i < cols; i++) {
    let slot = document.createElement("td");
    slot.classList.add("slot", "fade-in", "droppable");
    ss(slot);
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
  log( 'edit', 'expanding grid down')
}
function d() {
  a("d-remove");
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
  log( 'edit', 'retracting grid down')
}
/* Dragging */
let color_list = []
document.addEventListener("DOMContentLoaded", function () {
  if ( window.location.pathname == '/edit') {
    const slots = document.querySelectorAll(".slot");
    const playlistContainer = document.getElementById( 'playlist-container' );
    fetch( '/load/data/color' )
    .then( response => response.json() )
    .then( data => {
        if ( data.length > 0 ) {
            sc(data)
            colors = data
        }
    });
    let stylesheet = document.styleSheets[1]

    log( 'edit', 'initializing playlist list')
    fetch( '/playlists' )
    .then( response => response.json() )
    .then( playlists => {
      playlists.forEach( ( playlist ) => {
        pl = document.createElement( 'div' );
        pl.classList.add( 'playlist',  'draggable' );
        pl.draggable = 'true';
        pl.innerText = playlist;
        pl.addEventListener( 'dragstart', ds );
        playlistContainer.appendChild( pl )

        color_list.push( playlist )
        stylesheet.insertRule( `#${playlist} { }`, 0 )
        color_list.push( `${playlist}:hover` )
        stylesheet.insertRule( `#${`${playlist}:hover`} { }`, 0 )
        color_list.push( `${playlist}.playing` )
        stylesheet.insertRule( `#${`${playlist}.playing`} { }`, 0 )
        color_list.push( `${playlist}.playing:hover` )
        stylesheet.insertRule( `#${`${playlist}.playing:hover`} { }`, 0 )
      });
    });


    // Add dragover event listener to each slot
    slots.forEach((slot) => {
      ss(slot);
    });

    document.getElementById('accent-color').addEventListener('change', uc);
  }
});
function ds(event) {
  event.dataTransfer.setData("text/plain", event.target.textContent);
  if ( this.classList.contains( 'slot' ) ) {
    this.classList.remove( 'draggable' );
    this.draggable = false;
    this.innerText = '';
    this.id = ''
    this.dataset.color = '#000'
  }
}
function dv(event) {
  event.preventDefault();
}
function de(event) {
  event.preventDefault();
  this.classList.add("hover");
}
function dl() {
  this.classList.remove("hover");
}
function dr(event) {
  event.preventDefault();
  const data = event.dataTransfer.getData("text/plain");
  this.innerHTML = data;
  this.id = data
  this.classList.add("draggable");
  this.draggable = "true";
  this.cursor = "grab";
  this.addEventListener("dragstart", ds);

  Array.from(document.querySelectorAll('.slot')).forEach( (s) => { s.classList.remove('active', 'playing') })
  this.classList.add('active', 'playing')
  avc(this)
  
  this.classList.remove("hover");
  this.onclick = () => {
    if (this.classList.contains('active')) {
        this.classList.remove('active', 'playing');
    } else {
        Array.from(document.querySelectorAll('.slot')).forEach((s) => {
            s.classList.remove('active', 'playing');
        });
        this.classList.add('active', 'playing');
        avc(this);
    }
  }
  
}
function ss(slot) {
  slot.addEventListener("dragover", dv);
  slot.addEventListener("dragenter", de);
  slot.addEventListener("dragleave", dl);
  slot.addEventListener("drop", dr);
}
function s() {
  const preset = document.getElementById('preset-name');
  let name = preset.innerText;

  let soundBoard = [];

  const rows = document.querySelectorAll('.row');
  rows.forEach((row) => {
      let boardRow = [];
      const children = Array.from(row.children);
      children.forEach((child) => {
          if (child.classList.contains('slot')) {
              if (child.classList.contains('draggable')) {
                  boardRow.push(child.innerText);
              } else {
                  boardRow.push('blank');
              }
          }
      });
      soundBoard.push(boardRow);
  });

  const stylesheet = document.styleSheets[1];
  let cssRules = [];
  for (let i = 0; i < stylesheet.cssRules.length; i++) {
      cssRules.push(stylesheet.cssRules[i].cssText);
  }

  log('edit', `saving preset - ${name}`);
  fetch(`/save/${name}`, {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json'
      },
      body: JSON.stringify({
          soundBoard: soundBoard,
          cssRules: cssRules
      })
  }).then(response => response.json())
      .then(data => {
          if (data.status === 'success') {
              log('edit', 'saving successful');
          } else {
              log('edit', 'saving error');
          }

          window.location.href = '/'
      });
}

function avc(slot) {
  document.getElementById('accent-color').value = slot.dataset.color
}
function uc() {
  let stylesheet = document.styleSheets[1]
  const slot = document.querySelector('.active')
  slot.setAttribute( 'data-color', document.getElementById('accent-color').value )
  const accent = slot.dataset.color

  const ruleChanges = [
    { selector: `#${slot.id}`, color: al(accent, 25) },
    { selector: `#${slot.id}:hover`, color: al(accent, 35) },
    { selector: `#${slot.id}.playing`, color: al(accent, 0) },
    { selector: `#${slot.id}.playing:hover`, color: al(accent, -10) }
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
        stylesheet.deleteRule(ruleIndex);
        stylesheet.insertRule(`${selector} { background-color: ${color}; }`, ruleIndex);
    }
});
}