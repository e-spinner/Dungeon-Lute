// static/js/utils.js

function log( origin, message ) {
  fetch( '/log', {

      method: 'POST',
      headers: {
          'Content-Type': 'application/json'
      },
      body: JSON.stringify( {origin: origin, message: message} )
  });
}
function c() {
  fetch( '/stop' )
  setTimeout( () => {
    location.reload()
  }, 500 );history
}
function e() {
    log( 'util', 'loading edit.html' )
    a( 'edit' )
    window.location.href = '/edit'
}
function om( menu ) {
    a(`${menu}-open`)
    document.getElementById(`${menu}-menu`).style.width = '100%';    
    setTimeout( () => {
      document.getElementById(`${menu}`).classList.add('active');
    }, 300 );
}
function cm( menu ) {
    a(`${menu}-close`)
    document.getElementById(`${menu}-menu`).style.width = "0%";    
    document.getElementById(`${menu}`).classList.remove('active');
}
function a(buttonId) {
  const button = document.getElementById(buttonId);
  button.classList.add("clicked");
  setTimeout(() => {
    button.classList.remove("clicked");
  }, 300);
}
function ft(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
}
let colors = [ '#ffffff', '#292b2c', '#343a40', '#007bff']
function sc( c ) {
  document.documentElement.style.setProperty('--text', c[0]);
  document.documentElement.style.setProperty('--border-color', c[0]);
  document.documentElement.style.setProperty('--accent', c[3]);
  document.documentElement.style.setProperty('--hover-accent', al(c[3], -10) );
  document.documentElement.style.setProperty('--secondary-background', c[2]);
  document.documentElement.style.setProperty('--hover', al(c[2], 10) );
  document.documentElement.style.setProperty('--primary-background', c[1]);
  const primaryBackground = getComputedStyle(document.documentElement)
      .getPropertyValue('--primary-background')
      .trim();

  const primaryBackgroundRgb = htr(primaryBackground);

  document.documentElement.style.setProperty('--primary-background-rgba', `rgba(${primaryBackgroundRgb}, 1)`);
  document.documentElement.style.setProperty('--primary-background-transparent', `rgba(${primaryBackgroundRgb}, 0)`);

  if ( window.location.pathname == '/]') {
    a('color-save')
  }

  fetch( '/save/data/color', {
      method: 'POST',
      headers: {
          'Content-Type': 'application/json'
      },
      body: JSON.stringify( c )
  })
}
function rc() {
    a('color-reset')
    document.documentElement.style.setProperty('--t-text', '#ffffff');
    document.documentElement.style.setProperty('--t-border-color', '#ffffff');
    document.documentElement.style.setProperty('--t-accent', '#007bff');
    document.documentElement.style.setProperty('--t-hover-accent', al('#007bff', -10) );
    document.documentElement.style.setProperty('--t-secondary-background', '#343a40');
    document.documentElement.style.setProperty('--t-hover', al('#343a40', 10) );
    document.documentElement.style.setProperty('--t-primary-background', '#292b2c');
    colors = [ '#ffffff', '#292b2c', '#343a40', '#007bff']
}
function htr(hex) {
    let bigint = parseInt(hex.slice(1), 16);
    let r = (bigint >> 16) & 255;
    let g = (bigint >> 8) & 255;
    let b = bigint & 255;

    return `${r}, ${g}, ${b}`;
}
function lc() {
  document.getElementById('text-color').addEventListener('input', function() {
    document.documentElement.style.setProperty('--t-text', this.value);
    document.documentElement.style.setProperty('--t-border-color', this.value);
    colors[0] = this.value;
  });

  document.getElementById('accent-color').addEventListener('input', function() {
    document.documentElement.style.setProperty('--t-accent', this.value);
    document.documentElement.style.setProperty('--t-hover-accent', al(this.value, -10) );
    colors[3] = this.value;
  });

  document.getElementById('secondary-color').addEventListener('input', function() {
    document.documentElement.style.setProperty('--t-secondary-background', this.value);
    document.documentElement.style.setProperty('--t-hover', al(this.value, 10) );
    colors[2] = this.value;
  });

  document.getElementById('primary-color').addEventListener('input', function() {
    document.documentElement.style.setProperty('--t-primary-background', this.value);
    colors[1] = this.value;
  });
}
function hth(hex) {
  // Convert hex to RGB
  let r = parseInt(hex.slice(1, 3), 16) / 255;
  let g = parseInt(hex.slice(3, 5), 16) / 255;
  let b = parseInt(hex.slice(5, 7), 16) / 255;

  // Find greatest and smallest channel values
  let cmin = Math.min(r, g, b),
      cmax = Math.max(r, g, b),
      delta = cmax - cmin,
      h = 0,
      s = 0,
      l = 0;

  // Calculate hue
  if (delta == 0)
    h = 0;
  else if (cmax == r)
    h = ((g - b) / delta) % 6;
  else if (cmax == g)
    h = (b - r) / delta + 2;
  else
    h = (r - g) / delta + 4;

  h = Math.round(h * 60);

  // Make negative hues positive behind 360°
  if (h < 0)
    h += 360;

  // Calculate lightness
  l = (cmax + cmin) / 2;

  // Calculate saturation
  s = delta == 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
  s = +(s * 100).toFixed(1);
  l = +(l * 100).toFixed(1);

  return { h, s, l };
}
function h2h(h, s, l) {
  s /= 100;
  l /= 100;

  let c = (1 - Math.abs(2 * l - 1)) * s,
      x = c * (1 - Math.abs((h / 60) % 2 - 1)),
      m = l - c / 2,
      r = 0,
      g = 0,
      b = 0;

  if (0 <= h && h < 60) {
    r = c;
    g = x;
    b = 0;
  } else if (60 <= h && h < 120) {
    r = x;
    g = c;
    b = 0;
  } else if (120 <= h && h < 180) {
    r = 0;
    g = c;
    b = x;
  } else if (180 <= h && h < 240) {
    r = 0;
    g = x;
    b = c;
  } else if (240 <= h && h < 300) {
    r = x;
    g = 0;
    b = c;
  } else if (300 <= h && h < 360) {
    r = c;
    g = 0;
    b = x;
  }

  r = Math.round((r + m) * 255).toString(16).padStart(2, '0');
  g = Math.round((g + m) * 255).toString(16).padStart(2, '0');
  b = Math.round((b + m) * 255).toString(16).padStart(2, '0');

  return `#${r}${g}${b}`;
}
function al(hex, percent) {
  let { h, s, l } = hth(hex);
  l = Math.min(100, Math.max(0, l + percent));
  return h2h(h, s, l);
}