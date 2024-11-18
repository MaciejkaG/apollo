window.backend.assistant.initialize()
    .then((response) => {
        if (response.success) {
            console.log('Assistant initialized successfully');
        } else {
            console.error('Error initializing Assistant:', response.error || 'Unknown error');
        }
    })
    .catch((error) => {
        console.error('Unexpected error during Assistant initialization:', error);
    });

// Update example prompt
window.addEventListener('DOMContentLoaded', async () => {
    const response = await window.backend.assistant.sendMessage('Napisz przykładowy zwrot do asystenta głosowego Apollo np. "Apollo, czy powinienem jutro zabrać parasol?". Pytanie powinno zaczynać się zwrotem bezpośrednim "Apollo". Zapytanie powinno nawiązywać do ostatnich globalnych wydarzeń lub do wydarzeń związanych z Polską (np. pytanie o informacje polityczne, wiadomości, pogodę). Odpowiedz samym zwrotem. Pytanie powinno być gruntownie proste i nie może przekraczać 15 słów.');

    $('#examplePrompt').html(response.message);
});

// Wakeword handling
document.addEventListener('DOMContentLoaded', () => {
    window.addEventListener('wake-event', (e) => {
        const { event, data } = e.detail;

        switch (event) {
            case 'wake':
                listen();
                break;
        }
    });
});

// This function makes Apollo listen (obviously).
function listen() {
    $('#apolloScreen .idleScreen').removeClass('active');

    window.backend.speech.transcribeStream();

    window.addEventListener('speech-event', (e) => {
        const { event, data } = e.detail;

        switch (event) {
            case 'chunk':
                $('#transcript').html(data);
                break;

            case 'finished':
                // Stream finished. Send the query to GPT through window.backend.assistant.
                break;
        }
    });
}