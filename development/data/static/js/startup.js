
let colors = [];
let audio = null;
let scrubbing = false;

document.addEventListener( 'DOMContentLoaded', ( event ) => {
    initColor();
    initDisplay();
    initVolumeControl();

});

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
