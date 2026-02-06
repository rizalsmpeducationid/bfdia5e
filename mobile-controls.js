document.addEventListener('DOMContentLoaded', () => {
    const showControls = true; 
    if (!showControls) return;

    const controlsContainer = document.createElement('div');
    controlsContainer.id = 'virtual-controls';

    // Note: Removed the wrapping flexbox layout since we are using absolute positioning now
    controlsContainer.innerHTML = `
        <div class="d-pad" id="drag-dpad">
            <div class="d-row"><button data-key="38" data-code="ArrowUp" class="v-btn">up</button></div>
            <div class="d-row">
                <button data-key="37" data-code="ArrowLeft" class="v-btn">left</button>
                <button data-key="40" data-code="ArrowDown" class="v-btn">down</button>
                <button data-key="39" data-code="ArrowRight" class="v-btn">right</button>
            </div>
        </div>

        <div class="action-cluster" id="drag-actions">
            <div class="util-row">
                 <button data-key="82" data-code="KeyR" class="v-btn btn-r">reset</button>
                 <button data-key="13" data-code="Enter" class="v-btn btn-enter">dialog</button>
            </div>
            <div class="main-row">
                <button data-key="90" data-code="KeyZ" class="v-btn btn-z">switch</button>
            </div>
            <div class="space-row">
                <button data-key="32" data-code="Space" class="v-btn btn-space">jump</button>
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
            // Only trigger if we aren't actively dragging (simple check)
            if(!btn.closest('.dragging')) {
                // e.preventDefault(); // Commented out to allow drag start propagation
                triggerEvent(btn, 'keydown'); 
                btn.classList.add('active'); 
                handleInteraction(e); // Added interaction effect
            }
        };
        const handleUp = (e) => { 
            // e.preventDefault(); 
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

    // --- DRAG & DROP LOGIC ---
    const dPad = document.getElementById('drag-dpad');
    const actions = document.getElementById('drag-actions');

    // Function to set initial position
    function setInitialPosition(el, storageKey, defaultLeft, defaultBottom) {
        const savedPos = localStorage.getItem(storageKey);
        if (savedPos) {
            const pos = JSON.parse(savedPos);
            el.style.left = pos.left;
            el.style.top = pos.top;
        } else {
            // Default positions if never saved
            el.style.left = defaultLeft;
            el.style.top = `calc(100% - ${defaultBottom})`; 
        }
    }

    // Initialize positions (Default: Dpad left, Actions right)
    // Adjust these pixel values to match your preferred default layout
    setInitialPosition(dPad, 'pos_dpad', '20px', '250px'); 
    setInitialPosition(actions, 'pos_actions', 'calc(100% - 300px)', '250px');

    // Drag Handler
    function makeDraggable(el, storageKey) {
        let isDragging = false;
        let startX, startY, initialLeft, initialTop;

        el.classList.add('draggable'); // Add visual cue

        const onStart = (e) => {
            // Check if user is trying to press a button or drag the container
            // We allow dragging from anywhere in the container
            isDragging = true;
            el.classList.add('dragging'); // Flag to prevent button misfire if needed
            
            const clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
            const clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;

            startX = clientX;
            startY = clientY;

            const rect = el.getBoundingClientRect();
            initialLeft = rect.left;
            initialTop = rect.top;

            e.preventDefault(); // Prevent scrolling while dragging controls
        };

        const onMove = (e) => {
            if (!isDragging) return;
            
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
            el.classList.remove('dragging');

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

        // Return a cleanup function to remove listeners later
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

    // Activate Dragging
    const cleanDpad = makeDraggable(dPad, 'pos_dpad');
    const cleanActions = makeDraggable(actions, 'pos_actions');

    // --- LOCK CONTROLS AFTER 15 SECONDS ---
    setTimeout(() => {
        console.log("Locking controls...");
        cleanDpad();    // Remove listeners for D-pad
        cleanActions(); // Remove listeners for Actions
    }, 15000); // 15000 ms = 15 seconds
});
