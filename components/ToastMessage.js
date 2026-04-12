export const ToastMessage = {
    props: ['visible', 'message'],
    template: `
        <div v-if="visible" class="toast-message">{{ message }}</div>
    `
};