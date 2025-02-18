
function setColors( c ) {
    document.documentElement.style.setProperty( '--text', c[0] );
    document.documentElement.style.setProperty( '--border-color', c[0] );
    document.documentElement.style.setProperty( '--accent', c[3] );
    document.documentElement.style.setProperty( '--hover-accent', adjustLightless(c[3], -10) );
    document.documentElement.style.setProperty( '--secondary-background', c[2] );
    document.documentElement.style.setProperty( '--hover', adjustLightless( c[2], 10 ) );
    document.documentElement.style.setProperty( '--primary-background', c[1] );
    document.documentElement.style.setProperty( '--logo', adjustLightless( c[1], 5 ) );
    const primaryBackground = getComputedStyle( document.documentElement )
        .getPropertyValue( '--primary-background' )
        .trim();
    const primaryBackgroundRgb = HEXtoRGB( primaryBackground );

    document.documentElement.style.setProperty( '--primary-background-rgba', `rgba( ${primaryBackgroundRgb}, 1 )` );
    document.documentElement.style.setProperty( '--primary-background-transparent', `rgba( ${primaryBackgroundRgb}, 0 )` );
}

function saveColors( c ) {
    setColors( c );
    animateButton( 'color-save' );

    fetch( '/save/color/color', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            save: c
        })
    });
}

function setVolume( value ) {
    let volumeRange = document.getElementById( 'main-range' );
    volumeRange.style.width = ( value * 100 ) + '%';

    if ( audio ) {
        audio.volume = value;
    }
}