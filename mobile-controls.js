/* mobile-controls.js */
document.addEventListener('DOMContentLoaded', () => {
    const showControls = true; 
    if (!showControls) return;

    const controlsContainer = document.createElement('div');
    controlsContainer.id = 'virtual-controls';
    
    // Simplified structure: D-Pad on left, Utility (R/Enter) Top Right, Action (Z/Space) Bottom Right
    controlsContainer.innerHTML = `
        <div class="d-pad">
            <div class="d-row"><button data-key="38" data-code="ArrowUp" class="v-btn">▲</button></div>
            <div class="d-row">
                <button data-key="37" data-code="ArrowLeft" class="v-btn">◀</button>
                <button data-key="40" data-code="ArrowDown" class="v-btn">▼</button>
                <button data-key="39" data-code="ArrowRight" class="v-btn">▶</button>
            </div>
        </div>
        
        <div class="action-cluster">
            <div class="util-row">
                 <button data-key="82" data-code="KeyR" class="v-btn btn-r">R</button>
                 <button data-key="13" data-code="Enter" class="v-btn btn-enter">ENTER</button>
            </div>
            <div class="main-row">
                <button data-key="90" data-code="KeyZ" class="v-btn btn-z">Z</button>
            </div>
            <div class="space-row">
                <button data-key="32" data-code="Space" class="v-btn btn-space">JUMP (SPACE)</button>
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
        const handleDown = (e) => { e.preventDefault(); triggerEvent(btn, 'keydown'); btn.classList.add('active'); };
        const handleUp = (e) => { e.preventDefault(); triggerEvent(btn, 'keyup'); btn.classList.remove('active'); };

        btn.addEventListener('touchstart', handleDown, { passive: false });
        btn.addEventListener('touchend', handleUp);
        btn.addEventListener('mousedown', handleDown);
        btn.addEventListener('mouseup', handleUp);
        btn.addEventListener('mouseleave', handleUp);
    });
});
