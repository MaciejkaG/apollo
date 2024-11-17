

document.addEventListener('DOMContentLoaded', () => {
    window.addEventListener('speech-event', (e) => {
        const { event, data } = e.detail;

        console.log(e);

        switch (event) {
            case 'wake':
                alert('Wake word detected!');
                break;
        }
    });
})