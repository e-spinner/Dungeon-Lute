// static/js/soundeffect.js

let soundeffects = []

function loadSfx() {
    log('loadSfx', 'begin')
    fetch(`/sound`)
        .then(response => response.json())
        .then(sounds => {
            let count = 0
            const grid = document.getElementById('effect-grid')
            log('loadSfx', `${JSON.stringify(sounds)}`)
            sounds.forEach((sound) => {

                const sfx_idx = count

                const button = document.createElement('div')
                button.id = sound
                button.className = 'effect-button'

                const text = document.createElement('p')
                text.innerText = sound
                text.onclick = () => {
                    playSfx(sfx_idx, sound)
                }
                button.appendChild(text)

                const control = document.createElement('div')
                control.id = `${sound}-control`
                control.classList.add('volume-control', 'sfx')

                const range = document.createElement('div')
                range.id = `${sound}-range`
                range.className = 'volume-range'
                control.appendChild(range)

                const slider = document.createElement('input')
                slider.id = `${sound}-volume`
                slider.className = 'volume'
                slider.type = 'range'
                slider.min = '0'
                slider.max = '1'
                slider.step = '0.01'
                slider.value = '0.5'
                slider.onchange = `setSfxVolume(${sfx_idx}, this.value)`
                control.appendChild(slider)

                button.appendChild(control)

                const repeat = document.createElement('input')
                repeat.id = `${sound}-repeat`
                repeat.className = 'repeat'
                repeat.title = 'toggle repeating'
                repeat.type = 'checkbox'
                button.appendChild(repeat)

                grid.appendChild(button)

                slider.addEventListener('input', (e) => {
                    setSfxVolume(sfx_idx, sound, e.target.value);
                });

                slider.addEventListener('change', (e) => {
                    setSfxVolume(sfx_idx, sound, e.target.value);
                });

                count += 1
            })
            log('loadSfx', `done`)
        });
}

function playSfx(sfx_idx, sound) {
    if (soundeffects[sfx_idx]) {
        soundeffects[sfx_idx].pause();
        soundeffects[sfx_idx] = null;
        const t = document.getElementById(sound);
        t.classList.remove('playing');
    }

    else {
        const stop = document.getElementById('stop-button')
        stop.classList.remove("hidden")
        soundeffects[sfx_idx] = new Audio(`/sound/${sound}`)

        let initialVolume = document.getElementById(`${sound}-volume`).value;
        setSfxVolume(sfx_idx, sound, initialVolume);

        soundeffects[sfx_idx].play();

        const repeat = document.getElementById(`${sound}-repeat`)
        if (repeat.checked) {
            soundeffects[sfx_idx].loop = true
        }
        else {
            soundeffects[sfx_idx].loop = false
        }

        soundeffects[sfx_idx].onended = () => {
            const t = document.getElementById(sound);
            t.classList.remove('playing');
            soundeffects[sfx_idx] = null;
        }

        const t = document.getElementById(sound);
        t.classList.add('playing');
    }
}

function setSfxVolume(sfx_idx, sound, value) {
    let volumeRange = document.getElementById(`${sound}-range`);
    volumeRange.style.width = (value * 100) + '%';

    if (soundeffects[sfx_idx]) {
        soundeffects[sfx_idx].volume = value;
    }
}

function stopCurrentSfx() {

    soundeffects.forEach((sound) => {
        if (sound) {
            sound.pause()
            sound = null
        }
    })

    const stop = document.getElementById('stop-button')
    stop.classList.add("hidden")
    Array.from(document.querySelectorAll('.effect-button')).forEach((s) => { s.classList.remove('playing') })
}