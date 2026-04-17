const Toast = {
    show(message, type = 'success', duration = 4000) {
        let container = document.querySelector('.toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        let icon = '🔔';
        if (type === 'success') icon = '✅';
        if (type === 'error')   icon = '❌';

        toast.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <span>${icon}</span>
                <span>${message}</span>
            </div>
        `;

        container.appendChild(toast);

        // Remover após o tempo definido
        setTimeout(() => {
            toast.classList.add('hiding');
            setTimeout(() => toast.remove(), 400); 
        }, duration);
    },

    success(msg) { this.show(msg, 'success'); },
    error(msg)   { this.show(msg, 'error'); },
    info(msg)    { this.show(msg, 'info'); }
};

export default Toast;
