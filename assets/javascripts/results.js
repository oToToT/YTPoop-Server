window.addEventListener("load", function() {
    let currentValue = 1;
    const timeout = 0.75;
    const radios = document.querySelectorAll('.swappy-radios input');
    const fakeRadios = document.querySelectorAll('.swappy-radios .radio');

    //This next bit kinda sucks and could be improved.
    //For simplicity, I'm assuming that the distance between the first and second radios is indicative of the distance between all radios. This will fail if one of the options goes onto two lines.
    //I should really move each radio independantly depending on its own distance to its neighbour. Oh well ¯\_(ツ)_/¯
    //TODO ^^^
    const firstRadioY = document.querySelector('.swappy-radios label:nth-of-type(1) .radio').getBoundingClientRect().y;
    const secondRadioY = document.querySelector('.swappy-radios label:nth-of-type(2) .radio').getBoundingClientRect().y;
    const indicitiveDistance = secondRadioY - firstRadioY;
    //End suckyness :D

    //Apply CSS delays in JS, so that if JS doesn't load, it doesn't delay selected radio colour change
    //I'm applying background style delay here so that it doesn't appear slow if JS is disabled/broken
    fakeRadios.forEach(function(radio) {
        radio.style.cssText = `transition: background 0s ${timeout}s;`;
    });
    //Have to do this bit the long way (i.e. with a <style> element) becuase you can't do inline pseudo element syles
    const css = `.radio::after {transition: opacity 0s ${timeout}s;}`;
    const head = document.head;
    const style = document.createElement('style');
    style.type = 'text/css';
    style.appendChild(document.createTextNode(css));
    head.appendChild(style);
    //End no-js animation fallbacks.

    radios.forEach(function(radio, i) {
        //Add an attr to make finding and styling the correct element a lot easier
        radio.parentElement.setAttribute('data-index', i + 1);

        //The meat: set up the change listener!
        radio.addEventListener('change', function() {
            // add custom event listener
            updateResults(this.value);

            //Stop weirdness of incomplete animation occuring. disable radios until complete.
            temporarilyDisable();

            //remove old style tag
            removeStyles();
            const nextValue = this.parentElement.dataset.index;

            const oldRadio = document.querySelector(`[data-index="${currentValue}"] .radio`);
            const newRadio = this.nextElementSibling;
            const oldRect = oldRadio.getBoundingClientRect();
            const newRect = newRadio.getBoundingClientRect();

            //Pixel distance between previous and newly-selected radios
            const yDiff = Math.abs(oldRect.y - newRect.y);

            //Direction. Is the new option higher or lower than the old option?
            const dirDown = oldRect.y - newRect.y > 0 ? true : false;

            //Figure out which unselected radios actually need to move 
            //(we don't necessarily want to move them all)
            const othersToMove = [];
            const lowEnd = Math.min(currentValue, nextValue);
            const highEnd = Math.max(currentValue, nextValue);

            const inBetweenies = range(lowEnd, highEnd, dirDown);
            let othersCss = '';
            inBetweenies.map(option => {
                //If there's more than one, add a subtle stagger effect
                const staggerDelay = inBetweenies.length > 1 ? 0.1 / inBetweenies.length * option : 0;
                othersCss += `
                [data-index="${option}"] .radio {
                    animation: moveOthers ${timeout - staggerDelay}s ${staggerDelay}s;
                }
                `;
            });

            const css = `
            ${othersCss}
            [data-index="${currentValue}"] .radio { 
                animation: moveIt ${timeout}s; 
            }
            @keyframes moveIt {
                0% { transform: translateX(0); }
                33% { transform: translateX(-3rem) translateY(0); }
                66% { transform: translateX(-3rem) translateY(${dirDown ? '-' : ''}${yDiff}px); }
                100% { transform: translateX(0) translateY(${dirDown ? '-' : ''}${yDiff}px); }
            }
            @keyframes moveOthers {
                0% { transform: translateY(0); }
                33% { transform: translateY(0); }
                66% { transform: translateY(${dirDown ? '' : '-'}${indicitiveDistance}px); }
                100% { transform: translateY(${dirDown ? '' : '-'}${indicitiveDistance}px); }
            }
            `;
            appendStyles(css);
            currentValue = nextValue;
        });
    });

    function appendStyles(css) {
        const head = document.head;
        const style = document.createElement('style');
        style.type = 'text/css';
        style.id = 'swappy-radio-styles'; 
        style.appendChild(document.createTextNode(css));
        head.appendChild(style);
    }
    function removeStyles() {
        const node = document.getElementById('swappy-radio-styles');
        if (node && node.parentNode) {
            node.parentNode.removeChild(node);
        }
    }
    function range(start, end, dirDown) {
        let extra = 1;
        if (dirDown) {
            extra = 0;
        }
        return [...Array(end - start).keys()].map(v => start + v + extra);
    }
    function temporarilyDisable() {
        radios.forEach((item) => {
            item.setAttribute('disabled', true);
            setTimeout(() => { 
                item.removeAttribute('disabled');
            }, timeout * 1000);
        });
    }
    async function updateResults(type) {
        let params = new URLSearchParams(window.location.search.substring(1));
        const q = params.get("q");
        const req = new Request('/results', {
            method: "POST",
            headers: new Headers({
                "Content-Type": "application/json; charset=utf-8"
            }),
            body: JSON.stringify({
                q: q,
                m: type
            })
        });
        let res = await fetch(req);
        res = await res.json();
        // low efficient code
        let html = "";
        for (let s of res) {
            html += `
<div class="ret_block">
    <div class="img_block">
        <a href="/watch?v=${btoa(s._id.padStart(6, "0"))}">
            <img src="http://img.youtube.com/vi/ZOxmzpE0Vz4/0.jpg" style="width: 100%;">
        </a>
    </div>
    <div class="info_block">
        <div>
            <a href="/watch?v=${btoa(s._id.padStart(6, "0"))}" title="${s._source.singer} - ${s._source.name} (${s._source.date})" class="yt_link">
                <p class="yt_des title">${s._source.singer} - ${s._source.name} (${s._source.date})</p>
            </a>
        </div>
        <div>
            <p class="singer">${s._source.singer}</p>
        </div>
        <br>
        <div>
            <p class="yt_des lyrics">${s._source.lyrics.join(" ")}</p>
        </div>
    </div>
</div>`;
        }
        document.getElementById("result").innerHTML = html;
    }
});
