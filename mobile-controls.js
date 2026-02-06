document.addEventListener('DOMContentLoaded', () => {
    const showControls = true; 
    if (!showControls) return;

    const controlsContainer = document.createElement('div');
    controlsContainer.id = 'virtual-controls';

    // Note: Added IDs to each button for individual tracking
    controlsContainer.innerHTML = `
        <div class="d-pad">
            <div class="d-row"><button id="btn-up" data-key="38" data-code="ArrowUp" class="v-btn">up</button></div>
            <div class="d-row">
                <button id="btn-left" data-key="37" data-code="ArrowLeft" class="v-btn">left</button>
                <button id="btn-down" data-key="40" data-code="ArrowDown" class="v-btn">down</button>
                <button id="btn-right" data-key="39" data-code="ArrowRight" class="v-btn">right</button>
            </div>
        </div>

        <div class="action-cluster">
            <div class="util-row">
                 <button id="btn-r" data-key="82" data-code="KeyR" class="v-btn btn-r">reset</button>
                 <button id="btn-enter" data-key="13" data-code="Enter" class="v-btn btn-enter">dialog</button>
            </div>
            <div class="main-row">
                <button id="btn-z" data-key="90" data-code="KeyZ" class="v-btn btn-z">switch</button>
            </div>
            <div class="space-row">
                <button id="btn-space" data-key="32" data-code="Space" class="v-btn btn-space">jump</button>
            </div>
        </div>
    `;

    document.body.appendChild(controlsContainer);

    // --- BUTTON EVENT LOGIC ---
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
        const handleDown = (e) => { 
            // Only trigger if we aren't actively dragging
            if(!btn.classList.contains('dragging')) {
                triggerEvent(btn, 'keydown'); 
                btn.classList.add('active'); 
                handleInteraction(e);
            }
        };
        const handleUp = (e) => { 
            triggerEvent(btn, 'keyup'); 
            btn.classList.remove('active'); 
        };

        btn.addEventListener('touchstart', handleDown, { passive: false });
        btn.addEventListener('touchend', handleUp);
        btn.addEventListener('mousedown', handleDown);
        btn.addEventListener('mouseup', handleUp);
        btn.addEventListener('mouseleave', handleUp);
    });

    // --- INTERACTION EFFECT ---
    function handleInteraction(e) {
        const button = e.currentTarget;
        button.classList.add('interacted');
        setTimeout(() => {
            button.classList.remove('interacted');
        }, 3000);
    }

    // --- DRAG & DROP LOGIC (INDIVIDUAL) ---
    
    // 1. Define Default Positions for every button 
    // (These mimic your original layout but can now be moved individually)
    const defaultPositions = {
        'btn-up':    { left: '85px',  top: 'calc(100% - 240px)' },
        'btn-left':  { left: '20px',  top: 'calc(100% - 170px)' },
        'btn-down':  { left: '85px',  top: 'calc(100% - 170px)' },
        'btn-right': { left: '150px', top: 'calc(100% - 170px)' },
        
        'btn-r':     { left: 'calc(100% - 160px)', top: 'calc(100% - 320px)' }, // Reset
        'btn-enter': { left: 'calc(100% - 100px)', top: 'calc(100% - 320px)' }, // Dialog
        'btn-z':     { left: 'calc(100% - 100px)', top: 'calc(100% - 230px)' }, // Switch
        'btn-space': { left: 'calc(100% - 300px)', top: 'calc(100% - 120px)' }, // Jump
    };

    function setInitialPosition(el) {
        const storageKey = 'pos_' + el.id;
        const savedPos = localStorage.getItem(storageKey);
        
        if (savedPos) {
            const pos = JSON.parse(savedPos);
            el.style.left = pos.left;
            el.style.top = pos.top;
        } else if (defaultPositions[el.id]) {
            el.style.left = defaultPositions[el.id].left;
            el.style.top = defaultPositions[el.id].top;
        }
    }

    // Drag Handler
    function makeDraggable(el) {
        const storageKey = 'pos_' + el.id;
        let isDragging = false;
        let startX, startY, initialLeft, initialTop;

        el.classList.add('draggable');

        const onStart = (e) => {
            // Drag starts on long press or immediate depending on preference
            // Here we allow immediate drag but use a flag to prevent click events if moved
            
            const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
            const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;

            // Only start drag if we hit the element directly
            // (Optional: You could require a specific part of the button to be the handle, 
            // but for mobile controls, dragging the whole button is standard)
            
            isDragging = true;
            el.classList.add('dragging'); 
            
            startX = clientX;
            startY = clientY;

            const rect = el.getBoundingClientRect();
            initialLeft = rect.left;
            initialTop = rect.top;

            // e.preventDefault(); // Careful: preventing default here might stop button clicks if not handled right
        };

        const onMove = (e) => {
            if (!isDragging) return;
            
            e.preventDefault(); // Prevent scrolling while dragging

            const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
            const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;

            const dx = clientX - startX;
            const dy = clientY - startY;

            el.style.left = `${initialLeft + dx}px`;
            el.style.top = `${initialTop + dy}px`;
        };

        const onEnd = () => {
            if (!isDragging) return;
            isDragging = false;
            
            // Small delay to remove 'dragging' class so the click handler knows we were dragging
            setTimeout(() => {
                el.classList.remove('dragging');
            }, 50);

            // Save Position
            const pos = {
                left: el.style.left,
                top: el.style.top
            };
            localStorage.setItem(storageKey, JSON.stringify(pos));
        };

        // Attach Events
        el.addEventListener('mousedown', onStart);
        el.addEventListener('touchstart', onStart, { passive: false });

        window.addEventListener('mousemove', onMove);
        window.addEventListener('touchmove', onMove, { passive: false });

        window.addEventListener('mouseup', onEnd);
        window.addEventListener('touchend', onEnd);

        // Cleanup function
        return () => {
            el.classList.remove('draggable');
            el.removeEventListener('mousedown', onStart);
            el.removeEventListener('touchstart', onStart);
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('touchmove', onMove);
            window.removeEventListener('mouseup', onEnd);
            window.removeEventListener('touchend', onEnd);
        };
    }

    // Initialize all buttons
    const cleanupFunctions = [];
    buttons.forEach(btn => {
        setInitialPosition(btn);
        const clean = makeDraggable(btn);
        cleanupFunctions.push(clean);
    });

    // --- LOCK CONTROLS AFTER 15 SECONDS ---
    setTimeout(() => {
        console.log("Locking controls...");
        cleanupFunctions.forEach(fn => fn()); // Remove drag listeners from all buttons
    }, 15000); 
});
