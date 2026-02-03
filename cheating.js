window.cheatMenuOpen = false;
window.cheatInfiniteJump = false;
window.cheatWallClip = false; 

window.cheatFrozen = false;

window.addEventListener('keydown', (e) => {

    if (e.key === '`') {
        window.cheatMenuOpen = !window.cheatMenuOpen;
    }

    if (window.cheatMenuOpen) {
        if (e.key === '1') window.cheatInfiniteJump = !window.cheatInfiniteJump;
        if (e.key === '2') window.cheatWallClip = !window.cheatWallClip;
        if (e.key === '3') window.cheatFrozen = !window.cheatFrozen;
        if (e.key === '4') teleportToMouse();
    }
});

function teleportToMouse() {

    if (typeof char !== 'undefined' && typeof control !== 'undefined' && typeof cameraX !== 'undefined') {

        char[control].x = _xmouse + cameraX;
        char[control].y = _ymouse + cameraY;
        char[control].vx = 0;
        char[control].vy = 0;
        console.log("Teleported to:", char[control].x, char[control].y);
    }
}

function drawCheatMenuOverlay(ctx) {
    if (!window.cheatMenuOpen) return;

    ctx.save();

    ctx.setTransform(1, 0, 0, 1, 0, 0); 

    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(10, 10, 260, 150);
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 10, 260, 150);

    ctx.fillStyle = '#FFFF00'; 

    ctx.font = 'bold 18px Helvetica';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('SECRET DEBUG MENU', 25, 25);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '14px Helvetica';
    let startY = 55;
    let gap = 22;

    ctx.fillText(`[1] Infinite Jump: ${window.cheatInfiniteJump ? 'ON' : 'OFF'}`, 25, startY);
    ctx.fillText(`[2] Wall Clip: ${window.cheatWallClip ? 'ON' : 'OFF'}`, 25, startY + gap);
    ctx.fillText(`[3] Freeze Char: ${window.cheatFrozen ? 'ON' : 'OFF'}`, 25, startY + gap * 2);
    ctx.fillText(`[4] Teleport to Mouse (Press 4)`, 25, startY + gap * 3);

    ctx.restore();
}
