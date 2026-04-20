/**
 * LCARS Star Trek Emergency QR Logic
 * Client-Side Only (No Database)
 */

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const generateBtn = document.getElementById('generate-btn');
    const printBtn = document.getElementById('print-btn');
    const qrForm = document.getElementById('qr-form');
    const qrCodeOutput = document.getElementById('qrcode');
    const stardateEl = document.getElementById('stardate');
    const statusMsg = document.getElementById('status-msg');
    const binaryScroller = document.getElementById('binary-scroller');
    const soundFeedback = new AudioContext();

    // Stardate generator (Realtime-ish)
    function updateStardate() {
        const now = new Date();
        const stardate = (now.getFullYear() - 2323) * 1000 + Math.floor(now.getMonth() * 83.33);
        stardateEl.innerText = `${stardate}.${Math.floor(now.getDate() * 0.3)}`;
    }
    setInterval(updateStardate, 1000);
    updateStardate();

    // Binary Scroller Animation
    function updateBinary() {
        let binaryStr = "";
        for (let i = 0; i < 50; i++) {
            binaryStr += Math.random() > 0.5 ? "1 " : "0 ";
        }
        binaryScroller.innerText = binaryStr;
    }
    setInterval(updateBinary, 100);

    // Sinusoidal Wave Generator
    const waveCanvas = document.getElementById('wave-canvas');
    if (waveCanvas) {
        const ctx = waveCanvas.getContext('2d');
        let offset = 0;

        function drawWave() {
            // Adjust canvas size to parent width for HD resolution
            const rect = waveCanvas.getBoundingClientRect();
            if (waveCanvas.width !== rect.width || waveCanvas.height !== rect.height) {
                waveCanvas.width = rect.width;
                waveCanvas.height = rect.height;
            }

            ctx.clearRect(0, 0, waveCanvas.width, waveCanvas.height);
            
            // Draw grid lines
            ctx.strokeStyle = 'rgba(153, 204, 255, 0.1)';
            ctx.lineWidth = 1;
            for(let i = 0; i < waveCanvas.height; i += 20) {
                ctx.beginPath();
                ctx.moveTo(0, i); ctx.lineTo(waveCanvas.width, i);
                ctx.stroke();
            }

            // Draw 3 layers of waves (Sine, Cosine variation)
            const drawLayer = (color, amplitude, freq, speed, dash = []) => {
                ctx.beginPath();
                ctx.strokeStyle = color;
                ctx.setLineDash(dash);
                ctx.lineWidth = 2; // Slightly thicker for smoother appearance
                
                const drift = offset * speed; // Directional horizontal movement
                for (let x = 0; x < waveCanvas.width; x++) {
                    const y = waveCanvas.height / 2 + 
                              Math.sin((x * freq) + drift) * amplitude + 
                              Math.cos((x * 0.005) + (offset * 0.1)) * (amplitude/3); // Slower secondary modulation
                    if (x === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.stroke();
            };

            // Layers with distinct horizontal drift velocities
            drawLayer('#99CCFF', 80, 0.012, 0.05);  // Increased amplitude for larger height (approx 280px)
            drawLayer('#FF9900', 55, 0.02, -0.03, [15, 10]); 
            drawLayer('#CC99CC', 60, 0.008, 0.02);  

            offset += 0.5; // Overall time factor
            requestAnimationFrame(drawWave);
        }
        drawWave();
    }

    // Beep/Chirp Sound Generator
    function playBeep(type = 'normal') {
        const osc = soundFeedback.createOscillator();
        const gain = soundFeedback.createGain();
        
        osc.type = 'sine'; // More like a Star Trek chirp
        osc.connect(gain);
        gain.connect(soundFeedback.destination);

        if (type === 'normal') {
            osc.frequency.setValueAtTime(440, soundFeedback.currentTime);
            gain.gain.setValueAtTime(0.1, soundFeedback.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, soundFeedback.currentTime + 0.1);
            osc.start();
            osc.stop(soundFeedback.currentTime + 0.1);
        } else if (type === 'error') {
            osc.frequency.setValueAtTime(150, soundFeedback.currentTime);
            gain.gain.setValueAtTime(0.2, soundFeedback.currentTime);
            osc.frequency.linearRampToValueAtTime(100, soundFeedback.currentTime + 0.3);
            gain.gain.exponentialRampToValueAtTime(0.001, soundFeedback.currentTime + 0.3);
            osc.start();
            osc.stop(soundFeedback.currentTime + 0.3);
        } else if (type === 'completion') {
            osc.frequency.setValueAtTime(880, soundFeedback.currentTime);
            gain.gain.setValueAtTime(0.2, soundFeedback.currentTime);
            osc.frequency.exponentialRampToValueAtTime(1760, soundFeedback.currentTime + 0.3);
            gain.gain.exponentialRampToValueAtTime(0.001, soundFeedback.currentTime + 0.3);
            osc.start();
            osc.stop(soundFeedback.currentTime + 0.3);
        }
    }

    // Advanced Validation Logic
    function validateEmail(email) {
        // Strict pattern to ensure user@domain.tld
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    function validatePhone(phone) {
        // Strict phone pattern: optional +, then only digits, spaces, or hyphens (min 7 digits)
        const re = /^[+]?[0-9\s-]{7,20}$/;
        // Also ensure it actually contains numbers and not just +---
        const hasNumbers = /[0-9]{7,}/.test(phone.replace(/[^0-9]/g, ""));
        return re.test(phone) && hasNumbers;
    }

    // QR Code instance
    let qrcodeInst = null;

    // Generate Sequence
    generateBtn.addEventListener('click', () => {
        const phoneInput = document.getElementById('phone');
        const emailInput = document.getElementById('email');

        // Reset Custom Validities
        phoneInput.setCustomValidity("");
        emailInput.setCustomValidity("");

        // Check Phone
        if (!validatePhone(phoneInput.value)) {
            phoneInput.setCustomValidity("INVALID COMM FREQUENCY: USE NUMBERS ONLY (MIN 7)");
        }

        // Check Email
        if (!validateEmail(emailInput.value)) {
            emailInput.setCustomValidity("INVALID SUBSP_ADDRESS: ENTER VALID EMAIL (e.g. user@domain.com)");
        }

        // Check Native HTML5 Validation AND Custom Strict Checks
        if (!qrForm.checkValidity()) {
            statusMsg.innerText = "ACCESS DENIED: DATA CORRUPTION DETECTED";
            playBeep('error');
            qrForm.reportValidity();
            return;
        }

        playBeep('normal');
        
        const name = document.getElementById('name').value;
        const phone = phoneInput.value;
        const email = emailInput.value;
        const address = document.getElementById('address').value;
        const city = document.getElementById('city').value;
        const zip = document.getElementById('zip').value;
        const province = document.getElementById('province').value;
        const state = document.getElementById('state').value;
        const note = document.getElementById('note').value;

        if (!name || !phone || !email || !address || !city || !zip || !province || !state) {
            statusMsg.innerText = "ACCESS DENIED: INCOMPLETE DATA";
            playBeep('error'); 
            qrForm.reportValidity();
            return;
        }

        statusMsg.innerText = "PROCESSING ENCRYPTION...";
        document.querySelector('.scan-line').style.display = 'block';
        document.querySelector('.qr-icon-overlay').style.display = 'none';

        // Clear existing QR
        qrCodeOutput.innerHTML = "";

        // Format vCard (Standard for contact QR codes)
        const vCard = `BEGIN:VCARD
VERSION:3.0
FN:${name}
TEL;TYPE=CELL:${phone}
EMAIL:${email}
ADR;TYPE=HOME:;;${address};${city};${province};${zip};${state}
NOTE:${note}
END:VCARD`;

        setTimeout(() => {
            // Generate New QR
            qrcodeInst = new QRCode(qrCodeOutput, {
                text: vCard,
                width: 256,
                height: 256,
                colorDark : "#000000",
                colorLight : "#ffffff",
                correctLevel : QRCode.CorrectLevel.H
            });

            playBeep('completion');
            statusMsg.innerText = "DATA ENCRYPTED. BUFFER LOADED.";
            printBtn.disabled = false;
            document.querySelector('.qr-icon-overlay').style.display = 'block';
            
            // Set owner name for print preview
            document.querySelector('.panel-output').setAttribute('data-owner', name);
        }, 1200);
    });

    // Print Sequence
    printBtn.addEventListener('click', () => {
        playBeep('normal');
        window.print();
    });
});
