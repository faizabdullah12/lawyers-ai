// ============================================
// shared-otp.js — Lawyers AI v2.0 PERFECT
// ============================================

(function () {

    const STYLE_ID = 'lai-otp-styles';
    if (!document.getElementById(STYLE_ID)) {
        const s = document.createElement('style');
        s.id = STYLE_ID;
        s.textContent = `
            .lai-otp-overlay {
                position: fixed; inset: 0; z-index: 99999;
                display: flex; align-items: center; justify-content: center; padding: 16px;
                background: rgba(0,0,0,0.8); backdrop-filter: blur(14px);
                -webkit-backdrop-filter: blur(14px);
                animation: otpFadeIn 0.18s ease;
            }
            @keyframes otpFadeIn { from{opacity:0} to{opacity:1} }
            .lai-otp-overlay.closing { animation: otpFadeOut 0.15s ease forwards; }
            @keyframes otpFadeOut { to{opacity:0} }

            .lai-otp-card {
                background: var(--bg-sidebar, #1E293B);
                border: 1px solid var(--border, rgba(255,255,255,0.08));
                border-radius: 28px; padding: 30px 24px 24px;
                width: 100%; max-width: 420px;
                box-shadow: 0 40px 80px rgba(0,0,0,0.6);
                animation: otpSlideUp 0.25s cubic-bezier(0.16,1,0.3,1);
                font-family: 'Plus Jakarta Sans', sans-serif;
            }
            body.light .lai-otp-card { background: #fff; border-color: #E2E8F0; box-shadow: 0 20px 60px rgba(0,0,0,0.15); }
            @keyframes otpSlideUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }

            .lai-otp-header { display:flex; flex-direction:column; align-items:center; margin-bottom:20px; }
            .lai-otp-icon {
                width: 56px; height: 56px; border-radius: 18px;
                display: flex; align-items: center; justify-content: center;
                font-size: 22px; margin-bottom: 14px;
            }
            .lai-otp-title {
                font-size: 17px; font-weight: 900; font-style: italic;
                color: var(--text-1, #F1F5F9); text-align: center;
                margin: 0 0 6px; letter-spacing: -0.3px;
            }
            body.light .lai-otp-title { color: #0F172A; }
            .lai-otp-sub {
                font-size: 12px; color: var(--text-3, #64748B);
                text-align: center; line-height: 1.65; margin: 0;
            }
            .lai-otp-sub strong { color: var(--text-2, #94A3B8); }
            body.light .lai-otp-sub strong { color: #334155; }

            .lai-otp-boxes {
                display: flex; gap: 7px; justify-content: center;
                margin: 22px 0 18px;
            }
            .lai-otp-box {
                flex: 1; max-width: 46px; height: 54px;
                border-radius: 12px;
                background: var(--bg-input, rgba(255,255,255,0.05));
                border: 2px solid var(--border, rgba(255,255,255,0.1));
                color: var(--text-1, #F1F5F9);
                font-size: 20px; font-weight: 900;
                text-align: center; outline: none; font-family: inherit;
                transition: border-color 0.15s, background 0.15s, transform 0.1s;
                caret-color: transparent;
                -webkit-appearance: none;
            }
            body.light .lai-otp-box { background: #F8FAFC; border-color: #E2E8F0; color: #0F172A; }
            .lai-otp-box:focus { border-color: #3B82F6; background: rgba(59,130,246,0.06); transform: scale(1.05); }
            body.light .lai-otp-box:focus { background: #EFF6FF; }
            .lai-otp-box.filled { border-color: #3B82F6; }
            .lai-otp-box.error { border-color: #EF4444 !important; background: rgba(239,68,68,0.06) !important; }
            .lai-otp-boxes.shake { animation: otpShake 0.35s ease; }
            @keyframes otpShake {
                0%,100%{transform:translateX(0)} 20%{transform:translateX(-6px)}
                40%{transform:translateX(6px)} 60%{transform:translateX(-4px)} 80%{transform:translateX(4px)}
            }

            .lai-otp-btn {
                width: 100%; padding: 14px; border-radius: 14px;
                background: #2563EB; color: #fff; border: none;
                font-size: 12px; font-weight: 800; text-transform: uppercase;
                letter-spacing: 0.1em; cursor: pointer; font-family: inherit;
                transition: all 0.15s;
                box-shadow: 0 4px 20px rgba(37,99,235,0.35);
                display: flex; align-items: center; justify-content: center; gap: 8px;
            }
            .lai-otp-btn:hover:not(:disabled) { background: #1d4ed8; transform: translateY(-1px); }
            .lai-otp-btn:active:not(:disabled) { transform: scale(0.98); }
            .lai-otp-btn:disabled { opacity: 0.55; cursor: not-allowed; transform: none; }

            .lai-otp-status {
                font-size: 11.5px; text-align: center;
                margin: 10px 0 0; min-height: 18px;
                font-weight: 700; letter-spacing: 0.01em;
            }
            .lai-otp-status.error { color: #F87171; }
            .lai-otp-status.success { color: #34D399; }
            .lai-otp-status.info { color: #60A5FA; }

            .lai-otp-footer {
                display: flex; align-items: center; justify-content: space-between;
                margin-top: 16px; padding-top: 16px;
                border-top: 1px solid var(--border, rgba(255,255,255,0.06));
            }
            body.light .lai-otp-footer { border-color: #F1F5F9; }
            .lai-otp-footer span { font-size: 11px; color: var(--text-3, #64748B); }
            .lai-otp-resend-btn {
                font-size: 11px; font-weight: 800; color: #60A5FA;
                background: none; border: none; cursor: pointer;
                font-family: inherit; padding: 4px 10px;
                border-radius: 8px; transition: background 0.15s;
            }
            .lai-otp-resend-btn:hover:not(:disabled) { background: rgba(59,130,246,0.1); }
            .lai-otp-resend-btn:disabled { color: var(--text-4, #475569); cursor: not-allowed; }

            .lai-spin { animation: laiSpin 0.7s linear infinite; display:inline-block; }
            @keyframes laiSpin { to { transform: rotate(360deg); } }
        `;
        document.head.appendChild(s);
    }

    function closeModal(overlay) {
        overlay.classList.add('closing');
        setTimeout(() => overlay.remove(), 150);
    }

    window.showOTPModal = function (options = {}) {
        const {
            email = '',
            type = 'signup',
            onSuccess = () => {},
            title = 'Verifikasi Email',
            subtitle = null,
            digits = 6,
        } = options;

        const existing = document.getElementById('lai-otp-modal');
        if (existing) existing.remove();

        const subText = subtitle ||
            `Kode OTP <strong>${digits} digit</strong> dikirim ke<br><strong>${email}</strong><br>
            <span style="font-size:10.5px;opacity:0.65;">Cek folder Spam jika tidak muncul dalam 1 menit.</span>`;

        const iconMap = {
            signup:       { icon: 'fa-envelope-open-text', color: '#60A5FA', bg: 'rgba(59,130,246,0.12)' },
            recovery:     { icon: 'fa-key',                color: '#FBBF24', bg: 'rgba(245,158,11,0.12)' },
            email_change: { icon: 'fa-shield-check',       color: '#34D399', bg: 'rgba(16,185,129,0.12)' },
        };
        const ic = iconMap[type] || iconMap.signup;

        const overlay = document.createElement('div');
        overlay.className = 'lai-otp-overlay';
        overlay.id = 'lai-otp-modal';
        overlay.innerHTML = `
            <div class="lai-otp-card" id="lai-otp-card">
                <div class="lai-otp-header">
                    <div class="lai-otp-icon" style="background:${ic.bg};">
                        <i class="fas ${ic.icon}" style="color:${ic.color};"></i>
                    </div>
                    <p class="lai-otp-title">${title}</p>
                    <p class="lai-otp-sub">${subText}</p>
                </div>

                <div class="lai-otp-boxes" id="lai-otp-boxes">
                    ${Array.from({length: digits}, (_, i) =>
                        `<input class="lai-otp-box" id="otp-${i}" type="text"
                         inputmode="numeric" pattern="[0-9]*"
                         maxlength="1" autocomplete="one-time-code">`
                    ).join('')}
                </div>

                <button class="lai-otp-btn" id="otp-verify-btn">
                    <i class="fas fa-check-circle"></i> Verifikasi Kode
                </button>

                <p class="lai-otp-status" id="otp-status"></p>

                <div class="lai-otp-footer">
                    <span>Belum dapat kode?</span>
                    <button class="lai-otp-resend-btn" id="otp-resend-btn" disabled>
                        Kirim ulang (<span id="otp-cd">60</span>s)
                    </button>
                </div>
            </div>`;
        document.body.appendChild(overlay);

        const boxes     = Array.from({length: digits}, (_, i) => document.getElementById(`otp-${i}`));
        const boxWrap   = document.getElementById('lai-otp-boxes');
        const verifyBtn = document.getElementById('otp-verify-btn');
        const statusEl  = document.getElementById('otp-status');
        const resendBtn = document.getElementById('otp-resend-btn');
        const cdEl      = document.getElementById('otp-cd');

        setTimeout(() => boxes[0]?.focus(), 250);

        boxes.forEach((box, i) => {
            box.addEventListener('input', e => {
                const ch = e.target.value.replace(/\D/g, '');
                box.value = ch ? ch[ch.length - 1] : '';
                box.classList.toggle('filled', !!box.value);
                if (box.value && i < digits - 1) boxes[i + 1].focus();
                if (boxes.every(b => b.value)) verifyBtn.focus();
            });

            box.addEventListener('keydown', e => {
                if (e.key === 'Backspace') {
                    if (box.value) {
                        box.value = '';
                        box.classList.remove('filled');
                    } else if (i > 0) {
                        boxes[i - 1].value = '';
                        boxes[i - 1].classList.remove('filled');
                        boxes[i - 1].focus();
                    }
                    e.preventDefault();
                }
                if (e.key === 'ArrowLeft'  && i > 0)           boxes[i - 1].focus();
                if (e.key === 'ArrowRight' && i < digits - 1)  boxes[i + 1].focus();
                if (e.key === 'Enter') verifyBtn.click();
            });

            box.addEventListener('paste', e => {
                e.preventDefault();
                const raw = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, digits);
                raw.split('').forEach((ch, idx) => {
                    if (!boxes[idx]) return;
                    boxes[idx].value = ch;
                    boxes[idx].classList.add('filled');
                });
                const nextEmpty = boxes.findIndex(b => !b.value);
                (nextEmpty >= 0 ? boxes[nextEmpty] : boxes[digits - 1]).focus();
            });

            box.addEventListener('click', () => box.select());
        });

        function getOTP() { return boxes.map(b => b.value).join(''); }

        function setError(msg) {
            statusEl.textContent = msg;
            statusEl.className = 'lai-otp-status error';
            boxWrap.classList.add('shake');
            boxes.forEach(b => b.classList.add('error'));
            setTimeout(() => {
                boxWrap.classList.remove('shake');
                boxes.forEach(b => b.classList.remove('error'));
            }, 400);
        }

        function setStatus(msg, cls = 'info') {
            statusEl.textContent = msg;
            statusEl.className = `lai-otp-status ${cls}`;
        }

        let remaining = 60;
        let timer = setInterval(() => {
            remaining--;
            if (cdEl) cdEl.textContent = remaining;
            if (remaining <= 0) {
                clearInterval(timer);
                resendBtn.disabled = false;
                resendBtn.innerHTML = 'Kirim ulang OTP';
            }
        }, 1000);

        resendBtn.addEventListener('click', async () => {
            if (resendBtn.disabled) return;
            resendBtn.disabled = true;
            setStatus('Mengirim kode baru...', 'info');

            try {
                if (type === 'recovery') {
                    const { error } = await window.supabase.auth.resetPasswordForEmail(email);
                    if (error) throw error;
                } else {
                    const { error } = await window.supabase.auth.resend({ type: 'signup', email });
                    if (error) throw error;
                }
                setStatus('Kode baru terkirim! Cek email ✓', 'success');
                remaining = 60;
                clearInterval(timer);
                resendBtn.innerHTML = `Kirim ulang (<span id="otp-cd">60</span>s)`;
                const newCd = document.getElementById('otp-cd');
                timer = setInterval(() => {
                    remaining--;
                    if (newCd) newCd.textContent = remaining;
                    if (remaining <= 0) {
                        clearInterval(timer);
                        resendBtn.disabled = false;
                        resendBtn.innerHTML = 'Kirim ulang OTP';
                    }
                }, 1000);
                boxes.forEach(b => { b.value = ''; b.classList.remove('filled'); });
                boxes[0].focus();
            } catch (e) {
                setError('Gagal kirim ulang. Coba lagi.');
                resendBtn.disabled = false;
            }
        });

        verifyBtn.addEventListener('click', async () => {
            const token = getOTP();
            if (token.length < digits) {
                setError(`Masukkan ${digits} digit kode OTP`);
                const firstEmpty = boxes.findIndex(b => !b.value);
                if (firstEmpty >= 0) boxes[firstEmpty].focus();
                return;
            }

            verifyBtn.disabled = true;
            verifyBtn.innerHTML = '<i class="fas fa-circle-notch lai-spin"></i> Memverifikasi...';
            setStatus('Memeriksa kode...', 'info');

            try {
                const { data, error } = await window.supabase.auth.verifyOtp({ email, token, type });
                if (error) throw error;

                clearInterval(timer);
                setStatus('Verifikasi berhasil! ✓', 'success');
                verifyBtn.innerHTML = '<i class="fas fa-check-circle"></i> Berhasil!';
                verifyBtn.style.background = '#10B981';
                verifyBtn.style.boxShadow = '0 4px 20px rgba(16,185,129,0.4)';

                setTimeout(() => {
                    closeModal(overlay);
                    onSuccess(data);
                }, 900);

            } catch (e) {
                let msg = 'Terjadi kesalahan. Coba lagi.';
                if (e.message) {
                    const m = e.message.toLowerCase();
                    if (m.includes('expired'))          msg = 'Kode sudah kadaluarsa. Klik kirim ulang.';
                    else if (m.includes('invalid') || m.includes('incorrect')) msg = 'Kode OTP salah. Periksa kembali.';
                    else if (m.includes('rate') || m.includes('limit'))        msg = 'Terlalu banyak percobaan. Tunggu sebentar.';
                    else msg = e.message;
                }
                setError(msg);
                verifyBtn.disabled = false;
                verifyBtn.innerHTML = '<i class="fas fa-check-circle"></i> Verifikasi Kode';
                boxes[0].focus();
            }
        });
    };

})();