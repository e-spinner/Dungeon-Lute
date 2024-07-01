// static/js/index/menu-bar.js

let playingIndex = null;
let lastPlayedSong = {}
let audio = null;
let history = []
let soundBoard = []

const FADE_OUT_DURATION = 1000; 

// load
function load(){

}

// rewind
function rewind() {
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
    stopCurrentSong();
    playRandomSong( playingIndex )
    showPlaylist( playingIndex )
    log( 'menu-bar', 'going to next song' )
}

// edit 
function edit() {
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