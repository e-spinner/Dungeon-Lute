


function log(origin, message) {
    fetch('/log', {

        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ origin: origin, message: message })
    });

    console.log( origin, ' -:- ', message )
}

function closeProgram() {
    fetch( '/stop' )
    setTimeout(() => {
        location.reload()
    }, 500 ); history
}

function edit() {
    log( 'util', 'loading edit.html' )
    animateButton( 'edit' )
    window.location.href = '/edit'
}

function openMenu( menu ) {
    animateButton( `${menu}-open` )
    document.getElementById( `${menu}-menu` ).style.width = '100%';
    setTimeout( () => {
        document.getElementById( `${menu}` ).classList.add( 'active' );
    }, 300 );
}

function closeMenu( menu ) {
    animateButton( `${menu}-close` )
    document.getElementById( `${menu}-menu` ).style.width = "0%";
    document.getElementById( `${menu}` ).classList.remove( 'active' );
}

function animateButton( buttonId ) {
    const button = document.getElementById( buttonId );
    button.classList.add( "clicked" );
    setTimeout( () => {
        button.classList.remove( "clicked" );
    }, 300 );
}

function resetColors() {
    animateButton('color-reset')
    document.documentElement.style.setProperty('--t-text', '#ffffff');
    document.documentElement.style.setProperty('--t-border-color', '#ffffff');
    document.documentElement.style.setProperty('--t-accent', '#007bff');
    document.documentElement.style.setProperty('--t-hover-accent', adjustLightless('#007bff', -10));
    document.documentElement.style.setProperty('--t-secondary-background', '#343a40');
    document.documentElement.style.setProperty('--t-hover', adjustLightless('#343a40', 10));
    document.documentElement.style.setProperty('--t-primary-background', '#292b2c');
    colors = ['#ffffff', '#292b2c', '#343a40', '#007bff']
}

function adjustLightless( hex, percent ) {
    let { h, s, l } = HEXtoHSL( hex );
    l = Math.min(100, Math.max( 0, l + percent ) );
    return HSLtoHEX( h, s, l );
}

function HEXtoRGB( hex ) {
    let bigint = parseInt( hex.slice( 1 ), 16 );
    let r = ( bigint >> 16 ) & 255;
    let g = ( bigint >> 8 ) & 255;
    let b =   bigint & 255;
    return `${r}, ${g}, ${b}`;
}

function HEXtoHSL( hex ) {
    let r = parseInt( hex.slice( 1, 3 ), 16 ) / 255;
    let g = parseInt( hex.slice( 3, 5 ), 16 ) / 255;
    let b = parseInt( hex.slice( 5, 7 ), 16 ) / 255;

    // Find greatest and smallest channel values
    let cmin = Math.min( r, g, b ),
        cmax = Math.max( r, g, b ),
        delta = cmax - cmin,
        h = 0, s = 0, l = 0;

    // Calculate hue
    if ( delta == 0 )
        h = 0;
    else if ( cmax == r )
        h = ( ( g - b ) / delta ) % 6;
    else if ( cmax == g )
        h = ( b - r ) / delta + 2;
    else
        h = ( r - g ) / delta + 4;

    h = Math.round( h * 60 );

    // Make negative hues positive behind 360°
    if ( h < 0 )
        h += 360;

    // Calculate lightness
    l = ( cmax + cmin ) / 2;

    // Calculate saturation
    s = delta == 0 ? 0 : delta / ( 1 - Math.abs( 2 * l - 1 ) );
    s = +( s * 100 ).toFixed( 1 );
    l = +( l * 100 ).toFixed( 1 );

    return { h, s, l };
}

function HSLtoHEX( h, s, l ) {
    s /= 100;
    l /= 100;

    let c = ( 1 - Math.abs( 2 * l - 1 ) ) * s,
        x = c * ( 1 - Math.abs( ( h / 60 ) % 2 - 1 ) ),
        m = l - c / 2, r = 0, g = 0, b = 0;

    if      (  0 <= h && h <  60) { r = c; g = x; b = 0; } 
    else if ( 60 <= h && h < 120) { r = x; g = c; b = 0; } 
    else if (120 <= h && h < 180) { r = 0; g = c; b = x; } 
    else if (180 <= h && h < 240) { r = 0; g = x; b = c; } 
    else if (240 <= h && h < 300) { r = x; g = 0; b = c; } 
    else if (300 <= h && h < 360) { r = c; g = 0; b = x; }

    r = Math.round( ( r + m ) * 255 ).toString( 16 ).padStart( 2, '0' );
    g = Math.round( ( g + m ) * 255 ).toString( 16 ).padStart( 2, '0' );
    b = Math.round( ( b + m ) * 255 ).toString( 16 ).padStart( 2, '0' );
    return `#${r}${g}${b}`;
}