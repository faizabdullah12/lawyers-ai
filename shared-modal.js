// ============================================
// shared-modal.js — Lawyers AI v1.0
// Custom Modal System — mengganti confirm() & alert()
// ============================================

(function() {

    // ── CSS ──
    const STYLE_ID = 'lai-modal-styles';
    if (!document.getElementById(STYLE_ID)) {
        const style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = `
            .lai-modal-overlay {
                position: fixed; inset: 0; z-index: 99999;
                display: flex; align-items: center; justify-content: center; padding: 20px;
                background: rgba(0,0,0,0.65);
                backdrop-filter: blur(10px);
                -webkit-backdrop-filter: blur(10px);
                animation: laiMFadeIn 0.18s ease;
            }
            @keyframes laiMFadeIn { from{opacity:0} to{opacity:1} }

            .lai-modal-card {
                background: var(--bg-sidebar, #1E293B);
                border: 1px solid var(--border, rgba(255,255,255,0.08));
                border-radius: 24px;
                padding: 28px 28px 22px;
                width: 100%; max-width: 380px;
                box-shadow: 0 40px 80px rgba(0,0,0,0.5);
                animation: laiMSlideUp 0.22s cubic-bezier(0.16,1,0.3,1);
            }
            body.light .lai-modal-card { background: #FFFFFF; border-color: #E2E8F0; }
            @keyframes laiMSlideUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }

            .lai-modal-icon {
                width: 52px; height: 52px; border-radius: 16px;
                display: flex; align-items: center; justify-content: center;
                font-size: 22px; margin-bottom: 18px; flex-shrink: 0;
            }
            .lai-modal-title {
                font-size: 17px; font-weight: 900; font-style: italic;
                color: var(--text-1, #F1F5F9); margin: 0 0 10px; letter-spacing: -0.3px;
                font-family: inherit;
            }
            body.light .lai-modal-title { color: #0F172A; }

            .lai-modal-body {
                font-size: 13px; color: var(--text-2, #94A3B8);
                line-height: 1.7; margin: 0 0 24px; font-family: inherit;
            }
            body.light .lai-modal-body { color: #475569; }

            .lai-modal-input {
                width: 100%; padding: 12px 14px;
                background: var(--bg-input, rgba(255,255,255,0.05));
                border: 1px solid var(--border, rgba(255,255,255,0.08));
                border-radius: 12px; color: var(--text-1, #F1F5F9);
                font-size: 13px; font-weight: 600; font-family: inherit;
                outline: none; margin-bottom: 20px; box-sizing: border-box;
                transition: border-color 0.2s;
            }
            body.light .lai-modal-input { background: #F8FAFC; border-color: #E2E8F0; color: #0F172A; }
            .lai-modal-input:focus { border-color: #3B82F6; }
            .lai-modal-input::placeholder { color: var(--text-4, #334155); }

            .lai-modal-actions { display: flex; gap: 10px; justify-content: flex-end; flex-wrap: wrap; }

            .lai-modal-btn {
                padding: 11px 22px; border-radius: 12px;
                font-size: 11px; font-weight: 800;
                text-transform: uppercase; letter-spacing: 0.08em;
                cursor: pointer; border: none; font-family: inherit;
                transition: all 0.15s; white-space: nowrap;
            }
            .lai-modal-btn:active { transform: scale(0.96); }

            .lai-modal-btn-cancel {
                background: var(--bg-input, rgba(255,255,255,0.05));
                border: 1px solid var(--border, rgba(255,255,255,0.08));
                color: var(--text-3, #64748B);
            }
            body.light .lai-modal-btn-cancel { background: #F1F5F9; border-color: #E2E8F0; color: #64748B; }
            .lai-modal-btn-cancel:hover { color: var(--text-2, #94A3B8); border-color: var(--border-hover, rgba(255,255,255,0.15)); }

            .lai-modal-btn-danger  { background: #EF4444; color: #fff; box-shadow: 0 4px 14px rgba(239,68,68,0.3); }
            .lai-modal-btn-danger:hover  { background: #DC2626; }
            .lai-modal-btn-primary { background: #2563EB; color: #fff; box-shadow: 0 4px 14px rgba(37,99,235,0.3); }
            .lai-modal-btn-primary:hover { background: #1d4ed8; }
            .lai-modal-btn-warning { background: #F59E0B; color: #fff; box-shadow: 0 4px 14px rgba(245,158,11,0.3); }
            .lai-modal-btn-warning:hover { background: #D97706; }
            .lai-modal-btn-success { background: #10B981; color: #fff; box-shadow: 0 4px 14px rgba(16,185,129,0.3); }
            .lai-modal-btn-success:hover { background: #059669; }

            /* closing animation */
            .lai-modal-overlay.closing { animation: laiMFadeOut 0.15s ease forwards; }
            @keyframes laiMFadeOut { to{opacity:0} }
        `;
        document.head.appendChild(style);
    }

    // ── ICON CONFIG ──
    const ICONS = {
        danger:  { bg: 'rgba(239,68,68,0.12)',  color: '#F87171', icon: 'fa-trash-can' },
        warning: { bg: 'rgba(245,158,11,0.12)', color: '#FBBF24', icon: 'fa-exclamation-triangle' },
        info:    { bg: 'rgba(59,130,246,0.12)', color: '#60A5FA', icon: 'fa-circle-info' },
        success: { bg: 'rgba(16,185,129,0.12)', color: '#34D399', icon: 'fa-circle-check' },
        logout:  { bg: 'rgba(239,68,68,0.12)',  color: '#F87171', icon: 'fa-right-from-bracket' },
    };

    function closeModal(overlay, resolve, val) {
        overlay.classList.add('closing');
        setTimeout(() => { overlay.remove(); resolve(val); }, 150);
    }

    // ── laiConfirm ──
    window.laiConfirm = function({ type = 'danger', title = 'Konfirmasi', message = '', confirmText = 'Ya, Lanjutkan', cancelText = 'Batal' } = {}) {
        return new Promise(resolve => {
            const cfg = ICONS[type] || ICONS.danger;
            const btnClass = ['danger','logout'].includes(type) ? 'danger' : type === 'warning' ? 'warning' : type === 'success' ? 'success' : 'primary';
            const overlay = document.createElement('div');
            overlay.className = 'lai-modal-overlay';
            overlay.innerHTML = `
                <div class="lai-modal-card">
                    <div class="lai-modal-icon" style="background:${cfg.bg};">
                        <i class="fas ${cfg.icon}" style="color:${cfg.color};"></i>
                    </div>
                    <p class="lai-modal-title">${title}</p>
                    <p class="lai-modal-body">${message}</p>
                    <div class="lai-modal-actions">
                        <button class="lai-modal-btn lai-modal-btn-cancel" id="lai-cancel">${cancelText}</button>
                        <button class="lai-modal-btn lai-modal-btn-${btnClass}" id="lai-confirm">${confirmText}</button>
                    </div>
                </div>`;
            document.body.appendChild(overlay);
            overlay.querySelector('#lai-confirm').onclick = () => closeModal(overlay, resolve, true);
            overlay.querySelector('#lai-cancel').onclick  = () => closeModal(overlay, resolve, false);
            overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(overlay, resolve, false); });
        });
    };

    // ── laiAlert ──
    window.laiAlert = function({ type = 'info', title = 'Informasi', message = '', okText = 'Oke, Mengerti' } = {}) {
        return new Promise(resolve => {
            const cfg = ICONS[type] || ICONS.info;
            const overlay = document.createElement('div');
            overlay.className = 'lai-modal-overlay';
            overlay.innerHTML = `
                <div class="lai-modal-card">
                    <div class="lai-modal-icon" style="background:${cfg.bg};">
                        <i class="fas ${cfg.icon}" style="color:${cfg.color};"></i>
                    </div>
                    <p class="lai-modal-title">${title}</p>
                    <p class="lai-modal-body">${message}</p>
                    <div class="lai-modal-actions">
                        <button class="lai-modal-btn lai-modal-btn-primary" id="lai-ok">${okText}</button>
                    </div>
                </div>`;
            document.body.appendChild(overlay);
            overlay.querySelector('#lai-ok').onclick = () => closeModal(overlay, resolve, true);
            overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(overlay, resolve, true); });
        });
    };

    // ── laiPrompt — custom input modal (ganti prompt()) ──
    window.laiPrompt = function({ type = 'warning', title = 'Konfirmasi', message = '', placeholder = '', expectedValue = null, confirmText = 'Konfirmasi', cancelText = 'Batal' } = {}) {
        return new Promise(resolve => {
            const cfg = ICONS[type] || ICONS.warning;
            const overlay = document.createElement('div');
            overlay.className = 'lai-modal-overlay';
            overlay.innerHTML = `
                <div class="lai-modal-card">
                    <div class="lai-modal-icon" style="background:${cfg.bg};">
                        <i class="fas ${cfg.icon}" style="color:${cfg.color};"></i>
                    </div>
                    <p class="lai-modal-title">${title}</p>
                    <p class="lai-modal-body">${message}</p>
                    <input class="lai-modal-input" id="lai-prompt-input" type="text" placeholder="${placeholder}" autocomplete="off">
                    <div class="lai-modal-actions">
                        <button class="lai-modal-btn lai-modal-btn-cancel" id="lai-cancel">${cancelText}</button>
                        <button class="lai-modal-btn lai-modal-btn-danger" id="lai-confirm">${confirmText}</button>
                    </div>
                </div>`;
            document.body.appendChild(overlay);
            const input = overlay.querySelector('#lai-prompt-input');
            const confirmBtn = overlay.querySelector('#lai-confirm');

            // Jika ada expectedValue, validasi dulu sebelum confirm bisa diklik
            if (expectedValue) {
                confirmBtn.style.opacity = '0.4';
                confirmBtn.style.cursor = 'not-allowed';
                input.addEventListener('input', () => {
                    const match = input.value === expectedValue;
                    confirmBtn.style.opacity = match ? '1' : '0.4';
                    confirmBtn.style.cursor  = match ? 'pointer' : 'not-allowed';
                });
            }

            confirmBtn.onclick = () => {
                if (expectedValue && input.value !== expectedValue) return;
                closeModal(overlay, resolve, input.value);
            };
            overlay.querySelector('#lai-cancel').onclick = () => closeModal(overlay, resolve, null);
            overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(overlay, resolve, null); });
            setTimeout(() => input.focus(), 100);
            input.addEventListener('keydown', e => {
                if (e.key === 'Enter') confirmBtn.click();
                if (e.key === 'Escape') overlay.querySelector('#lai-cancel').click();
            });
        });
    };

})();