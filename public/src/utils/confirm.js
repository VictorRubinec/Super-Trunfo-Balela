const Confirm = {
    show(title, message, okText = 'Continuar', cancelText = 'Cancelar') {
        return new Promise((resolve) => {
            const modal     = document.getElementById('confirm-modal');
            const elTitle   = document.getElementById('confirm-title');
            const elMsg     = document.getElementById('confirm-message');
            const btnOk     = document.getElementById('btn-confirm-ok');
            const btnCancel = document.getElementById('btn-confirm-cancel');

            if (!modal) return resolve(confirm(message)); // Fallback

            elTitle.textContent = title;
            elMsg.textContent   = message;
            btnOk.textContent   = okText;
            btnCancel.textContent = cancelText;

            modal.classList.add('active');

            const handleOk = () => {
                cleanup();
                resolve(true);
            };

            const handleCancel = () => {
                cleanup();
                resolve(false);
            };

            const cleanup = () => {
                modal.classList.remove('active');
                btnOk.removeEventListener('click', handleOk);
                btnCancel.removeEventListener('click', handleCancel);
            };

            btnOk.addEventListener('click', handleOk);
            btnCancel.addEventListener('click', handleCancel);
        });
    }
};

export default Confirm;
