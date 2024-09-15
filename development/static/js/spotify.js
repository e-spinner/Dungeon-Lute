window.onSpotifyWebPlaybackSDKReady = () => {
    const token = 'BQDFGsv26C-ga3B8iFs953w-WPjwavcNTCra4Gv2t43SdL8jJwbahiE5jxLov2kYqOp2fl0AX7qrSNfDQXEmsVSS_t2YAjv9wc2uBi8UELcHDUjduyEMQVC7-WTfHscN-76d9YolnNyl5B_tni7VxLxTc7aUN2AoHUGTqr7wpFgS3kO742b4rFu1d_mmhebseiwpLql5EpJq7fNhV-Tu1WeMYZHbG97wzVpOHsRn';
    const player = new Spotify.Player({
        name: 'Web Playback SDK Quick Start Player',
        getOAuthToken: cb => { cb(token); },
        volume: 0.5
    });

    document.getElementById('toggle').onclick = function () {
        player.togglePlay();
    };


    // Ready
    player.addListener('ready', ({ device_id }) => {
        console.log('Ready with Device ID', device_id);
    });

    // Not Ready
    player.addListener('not_ready', ({ device_id }) => {
        console.log('Device ID has gone offline', device_id);
    });

    player.addListener('initialization_error', ({ message }) => {
        console.error(message);
    });

    player.addListener('authentication_error', ({ message }) => {
        console.error(message);
    });

    player.addListener('account_error', ({ message }) => {
        console.error(message);
    });

    player.connect();
}



