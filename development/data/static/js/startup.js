
let colors = [];

document.addEventListener( 'DOMContentLoaded', ( event ) => {
    initColor()
    
});

function initColor() {

    fetch( '/load/color/color.json')
        .then( response => response.json() )
        .then( data => {
            c = data
            log( 'startup', `colors loaded: ${c}` )

            document.documentElement.style.setProperty('--text', c[0]);
            document.documentElement.style.setProperty('--border-color', c[0]);
            document.documentElement.style.setProperty('--accent', c[3]);
            document.documentElement.style.setProperty('--hover-accent', adjustLightless(c[3], -10));
            document.documentElement.style.setProperty('--secondary-background', c[2]);
            document.documentElement.style.setProperty('--hover', adjustLightless(c[2], 10));
            document.documentElement.style.setProperty('--primary-background', c[1]);
            document.documentElement.style.setProperty('--logo', adjustLightless(c[1], 5));
            const primaryBackground = getComputedStyle(document.documentElement)
                .getPropertyValue('--primary-background')
                .trim();
            const primaryBackgroundRgb = HEXtoRGB(primaryBackground);
        
            document.documentElement.style.setProperty('--primary-background-rgba', `rgba(${primaryBackgroundRgb}, 1)`);
            document.documentElement.style.setProperty('--primary-background-transparent', `rgba(${primaryBackgroundRgb}, 0)`);
        

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
};



