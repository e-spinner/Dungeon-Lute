
/* # =================== #
   # GLOBAL DECLARATIONS #
   # =================== # */

let colors = [];
let audio = null;
let scrubbing = false;
let soundeffects = [];

let playingIndex = null;
let lastPlayedSong = {};

let history = [];
let soundBoard = [];

const FADE_OUT_DURATION = 1000;

/* # ================ #
   # STARTRUP ACTIONS #
   # ================ # */

document.addEventListener( 'DOMContentLoaded', ( e ) => {
    initColor();
    initVolumeControl();
    initDisplay();
    propagateDisplay();
    loadSoundboard('Default');
});

/* # ================ #
   # LOADER FUNCTIONS #
   # ================ # */

function initColor() {

    fetch( '/load/color/color.json')
        .then( response => response.json() )
        .then( data => {
            c = data;
            log( 'startup', `colors loaded: ${c}` );
            setColors( c );
            colors = c
        });

    document.getElementById( 'text-color' ).addEventListener( 'input', function () {
        document.documentElement.style.setProperty( '--t-text', this.value );
        document.documentElement.style.setProperty( '--t-border-color', this.value );
        colors[0] = this.value;
    });

    document.getElementById( 'accent-color' ).addEventListener( 'input', function () {
        document.documentElement.style.setProperty( '--t-accent', this.value );
        document.documentElement.style.setProperty( '--t-hover-accent', adjustLightless( this.value, -10 ) );
        colors[3] = this.value;
    });

    document.getElementById( 'secondary-color' ).addEventListener( 'input', function () {
        document.documentElement.style.setProperty( '--t-secondary-background', this.value );
        document.documentElement.style.setProperty( '--t-hover', adjustLightless(this.value, 10 ) );
        colors[2] = this.value;
    });

    document.getElementById( 'primary-color' ).addEventListener( 'input', function () {
        document.documentElement.style.setProperty( '--t-primary-background', this.value );
        colors[1] = this.value;
    });
}

function initVolumeControl() {

    let initialVolume = document.getElementById( 'main-volume' ).value;
    setVolume( initialVolume );
    const volumeControl = document.getElementById( 'main-volume' );
    volumeControl.addEventListener( 'input', ( e ) => {
        setVolume( e.target.value );
    });
    
    const scrubber = document.getElementById( 'scrubber' )
    scrubber.value = 0
    scrubber.addEventListener( 'input', () => {
        scrubbing = true;
        const percentage = scrubber.value;
        const newTime = ( percentage / 100 ) * audio.duration;
        progressBar.style.width = `${percentage}%`;
        current.innerText = formatTime( newTime );
    });

    scrubber.addEventListener( 'change', () => {
        scrubbing = false;
        const percentage = scrubber.value;
        audio.currentTime = ( percentage / 100 ) * audio.duration;
    });

    const progressContainer = document.getElementById( 'progressContainer' );
    const progressBar = document.getElementById( 'progressBar' );
    progressContainer.addEventListener( 'click', ( e ) => {
        const rect = progressContainer.getBoundingClientRect();
        const offsetX = e.clientX - rect.left;
        const percentage = offsetX / rect.width;
        audio.currentTime = percentage * audio.duration;
        progressBar.style.width = `${percentage * 100}%`;
    });

    log( 'startup', 'initialized volume control')
}

function initDisplay() {

    const buttons = document.querySelectorAll( ".tab-button" );
    const slider = document.getElementById( 'slider' );

    buttons.forEach( ( button ) => {
        button.addEventListener("click", () => {
            const tab = document.getElementById( button.dataset.tab );


            if ( tab.id == 'tab1' ) {
                slider.style.transform = "translateX(0%)";
                log( 'display', 'loading track tab' )
            }
            else if ( tab.id == 'tab2' ) {
                slider.style.transform = "translateX(-33.3%)";
                log( 'display', 'loading playlist tab' )
            }
            else if ( tab.id == 'tab3' ) {
                slider.style.transform = "translateX(-66.7%)";
                log( 'display', 'loading sound tab' )
            }

            Array.from( document.querySelectorAll( '.tab-button' ) ).forEach( ( t ) => { t.classList.remove( 'active' ) } );
            button.classList.add( 'active' );

        });
    });

    log( 'startup', 'initialized display slider' )
}

function propagateDisplay() {

    // DECKS
    fetchMedia( 'deck' ).then( presets => {
        const se = document.getElementById('presets');

        presets.forEach(preset => {
            const box = document.createElement('div');

            const p = document.createElement('a');
            p.id = preset;
            p.innerText = preset;
            p.classList.add('song');
            p.addEventListener('click', () => {
                animateButton(preset);
                const grid = document.getElementById('grid');
                grid.innerHTML = '';
                loadSoundboard(preset);
                closeMenu('presets');
                setTimeout(() => {
                    closeMenu('settings');
                }, 300);
            });

            box.appendChild(p);

            const del = document.createElement('button');
            del.classList.add('preset-del');
            del.addEventListener('click', () => {
                fetch(`/del/deck/${preset}`)
                    .then(response => {
                        box.classList.add('fade-out');
                    });
            });
            del.title = `delete ${preset}`;

            var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            svg.setAttribute("class", "delete");
            svg.setAttribute("fill", "none");
            svg.setAttribute("viewBox", "0 0 20 20");
            svg.setAttribute("height", "20");
            svg.setAttribute("width", "20");

            var use = document.createElementNS("http://www.w3.org/2000/svg", "use");
            use.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", "#delete");

            svg.appendChild(use);
            del.appendChild(svg);
            box.append(del);
            box.classList.add('preset-container');
            se.appendChild(box);
        });
    });

    // SFX
    fetchMedia( 'sound' ).then( sounds => {
        let count = 0
        const grid = document.getElementById( 'effect-grid' )
        sounds.forEach( ( sound ) => {
            const sfx_idx = count

            const button = document.createElement( 'div' )
            button.id = sound
            button.className = 'effect-button'

            const text = document.createElement( 'p' )
            text.innerText = sound
            text.onclick = () => {
                playSfx( sfx_idx, sound )
            }
            button.appendChild( text )

            const control = document.createElement( 'div' )
            control.id = `${sound}-control`
            control.classList.add( 'volume-control', 'sfx' )

            const range = document.createElement( 'div' )
            range.id = `${sound}-range`
            range.className = 'volume-range'
            control.appendChild( range )

            const slider = document.createElement( 'input' )
            slider.id = `${sound}-volume`
            slider.className = 'volume'
            slider.type = 'range'
            slider.min = '0'
            slider.max = '1'
            slider.step = '0.01'
            slider.value = '0.5'
            slider.onchange = `setSfxVolume(${sfx_idx}, this.value)`
            control.appendChild( slider )

            button.appendChild( control )

            const repeat = document.createElement( 'input' )
            repeat.id = `${sound}-repeat`
            repeat.className = 'repeat'
            repeat.title = 'toggle repeating'
            repeat.type = 'checkbox'
            button.appendChild( repeat )

            grid.appendChild( button )

            slider.addEventListener( 'input', ( e ) => {
                setSfxVolume( sfx_idx, sound, e.target.value );
            });

            slider.addEventListener( 'change', ( e ) => {
                setSfxVolume( sfx_idx, sound, e.target.value );
            });

            count += 1
        })
        log( 'loadSfx', `done` )
    });

    // TRACKS
    fetchMedia( 'track' ).then( tracks => {
        const trackList = document.getElementById( 'track-list' )
        tracks.forEach( ( track ) => {
            const li = document.createElement( 'li' )
            li.innerHTML = track
            li.id = track
            li.className = 'track'
            li.addEventListener( 'click', () => {
                animateButton( track )
                playTrack( track )
            })
            trackList.appendChild( li )
        })
    });

}

function loadSoundboard(preset) {
    log('soundboard', 'loading soundboard...')
    fetchMedia('deck', preset).then(data => {
        const grid = document.getElementById('grid')
        data.forEach((row) => {
            const tr = document.createElement('tr')
            tr.classList.add('row')
            row.forEach((playlist) => {
                const pl = document.createElement('td');
                if (playlist != 'blank') {
                    pl.classList.add('playlist')
                    pl.innerText = playlist;
                    pl.id = playlist;
                    pl.onclick = () => {
                        togglePlaylist(playlist);
                        animateButton(playlist);

                    }
                } else {
                    pl.classList.add('spacer');
                }
                tr.appendChild(pl)
            });
            grid.appendChild(tr)
        });
        log('soundboard', 'soundboard loaded')

    });
}