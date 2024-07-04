// static/js/index/menu-bar.js

let playingIndex = null;
let lastPlayedSong = {}
let audio = null;
let history = []
let soundBoard = []

const FADE_OUT_DURATION = 1000; 

function lr(){
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
                    a(preset);
                    const grid = document.getElementById( 'grid' )
                    grid.innerHTML=''
                    ls(preset);
                    cm('presets')
                    setTimeout(() => {
                        cm('settings')

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
                del.title = `delete ${preset}`
                
                const i = document.createElement( 'i' );
                i.classList.add( 'far', 'fa-circle-xmark' );
                del.appendChild(i)

                box.append( del )

                box.classList.add('preset-container')

                se.appendChild( box );
            });
        })
}
function rw() {
    a( 'rewind' )
    if ( history.length > 1 ) {
        let audio_status = document.getElementById( 'pause_play' )
        audio_status.classList.remove( 'fa-play' )
        audio_status.classList.add( 'fa-pause' )

        history.pop();
        const { p_idx, s_idx } = history[ history.length - 1 ];

        z();

        playingIndex = p_idx;
        l( p_idx, s_idx);
        sp( p_idx );

        history.pop()
        log( 'menu-bar', 'rewound succcessfull' )
    }
    else {
        log( 'menu-bar', 'cannot rewind' )
    }
}
function p() {
    a( 'toggle' )
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
function n() {
    a( 'next' )
    z();
    L( playingIndex )
    sp( playingIndex )
    log( 'menu-bar', 'going to next song' )
}
function ah( p_idx, s_idx ) {
    log( 'history', `adding ${p_idx}, ${s_idx} to history` )
    history.push( { p_idx, s_idx } );
}