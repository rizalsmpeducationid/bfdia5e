document.addEventListener('DOMContentLoaded', () => {
    const showControls = true; 

    if (!showControls) return;

    const controlsContainer = document.createElement('div');
    controlsContainer.id = 'virtual-controls';

    controlsContainer.innerHTML = `
        <div class="d-pad">
            <div class="d-row"><button data-key="38" data-code="ArrowUp" class="v-btn up">▲</button></div>
            <div class="d-row">
                <button data-key="37" data-code="ArrowLeft" class="v-btn left">◀</button>
                <button data-key="40" data-code="ArrowDown" class="v-btn down">▼</button>
                <button data-key="39" data-code="ArrowRight" class="v-btn right">▶</button>
            </div>
        </div>
        <div class="actions">
            <div class="action-row top">
                 <button data-key="82" data-code="KeyR" class="v-btn action-r">R</button>
                 <button data-key="13" data-code="Enter" class="v-btn action-enter">ENTER</button>
            </div>
            <div class="action-row bottom">
                <button data-key="90" data-code="KeyZ" class="v-btn action-z">Z</button>
                <button data-key="32" data-code="Space" class="v-btn action-space">SPACE / JUMP</button>
            </div>
        </div>
    `;

    document.body.appendChild(controlsContainer);

    const buttons = document.querySelectorAll('.v-btn');
    const triggerEvent = (el, type) => {
        const keyCode = parseInt(el.getAttribute('data-key'));
        const code = el.getAttribute('data-code');
        const event = new KeyboardEvent(type, {
            bubbles: true, cancelable: true, view: window,
            keyCode: keyCode, which: keyCode, code: code, key: (keyCode === 32 ? " " : code)
        });
        window.dispatchEvent(event);
        const canvas = document.getElementById('cnv');
        if(canvas) canvas.dispatchEvent(event);
    };

    buttons.forEach(btn => {
        btn.addEventListener('touchstart', (e) => { e.preventDefault(); triggerEvent(btn, 'keydown'); btn.classList.add('active'); }, { passive: false });
        btn.addEventListener('touchend', (e) => { e.preventDefault(); triggerEvent(btn, 'keyup'); btn.classList.remove('active'); });
        btn.addEventListener('mousedown', (e) => { triggerEvent(btn, 'keydown'); btn.classList.add('active'); });
        btn.addEventListener('mouseup', (e) => { triggerEvent(btn, 'keyup'); btn.classList.remove('active'); });
        btn.addEventListener('mouseleave', (e) => { triggerEvent(btn, 'keyup'); btn.classList.remove('active'); });
    });
});
