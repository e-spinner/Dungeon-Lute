// static/js/index/menu-bar.js

let playingIndex = null;
let lastPlayedSong = {}
let audio = null;
let history = []
let soundBoard = []

const FADE_OUT_DURATION = 1000; 

// load
function loadPresets(){
    // Step 1: Fetch the list of presets
    fetch( '/load' )
        .then( response => response.json() )
        .then( presets => {

            const se = document.getElementById('presets')            
            
            presets.forEach( preset => {
                const box = document.createElement( 'div' );

                const p = document.createElement( 'a' );
                
                p.id = preset;
                p.innerText = preset;
                p.classList.add( 'song' );
                p.addEventListener( 'click', () => {
                    animateButton(preset);
                    loadSoundboard(preset);
                    closeMenu('presets')
                    setTimeout(() => {
                        closeMenu('settings')

                    }, 300 );
                });

                box.appendChild( p )

                const del = document.createElement( 'button' );
                del.classList.add( 'preset-del' );
                del.addEventListener( 'click', () => {
                    fetch( `/del/${preset}` )
                    .then( response => {
                        box.classList.add( 'fade-out' )
                    });
                })
                
                const i = document.createElement( 'i' );
                i.classList.add( 'far', 'fa-circle-xmark' );
                del.appendChild(i)

                box.append( del )

                box.classList.add('preset-container')

                se.appendChild( box );
            });
        })
}


// rewind
function rewind() {
    animateButton( 'rewind' )
    if ( history.length > 1 ) {
        let audio_status = document.getElementById( 'pause_play' )
        audio_status.classList.remove( 'fa-play' )
        audio_status.classList.add( 'fa-pause' )

        history.pop();
        updateHistoryDisplay();
        const { p_idx, s_idx } = history[ history.length - 1 ];

        stopCurrentSong();

        playingIndex = p_idx;
        playSong( p_idx, s_idx);
        showPlaylist( p_idx );

        history.pop()
        updateHistoryDisplay()
        log( 'menu-bar', 'rewound succcessfull' )
    }
    else {
        log( 'menu-bar', 'cannot rewind' )
    }
}

// pause / play
function pause_play() {
    animateButton( 'toggle' )
    let audio_status = document.getElementById( 'pause_play' )

    if (audio.paused) {
        audio.play();
        audio_status.classList.remove('fa-play');
        audio_status.classList.add('fa-pause');
        log('menu-bar', 'playing');
    } else {
        audio.pause();
        audio_status.classList.remove('fa-pause');
        audio_status.classList.add('fa-play');
        log('menu-bar', 'paused');
    }
}

// next
function next() {
    animateButton( 'next' )
    stopCurrentSong();
    playRandomSong( playingIndex )
    showPlaylist( playingIndex )
    log( 'menu-bar', 'going to next song' )
}

// edit 
function edit() {
    animateButton( 'edit' )
    buttons.push( { name: '', sounds: [] } );
    renderButtons();    
    log( 'edit', 'nothing happens for now' )
}

// Function to add button-song combination to history
function addToHistory( p_idx, s_idx ) {
    log( 'history', `adding ${p_idx}, ${s_idx} to history` )
    history.push( { p_idx, s_idx } );
    updateHistoryDisplay();
}

function updateHistoryDisplay() {
    const historyList = document.getElementById( 'historyList' );
    historyList.innerHTML = '';
    history.forEach( ( entry, p_idx ) => {
        const listItem = document.createElement( 'li' );
        listItem.innerText = `Step ${p_idx + 1}: Button ${entry.p_idx + 1} - Song ${entry.s_idx + 1}`;
        historyList.appendChild( listItem );
    } );
    log( 'history', 'displaying history' )
}