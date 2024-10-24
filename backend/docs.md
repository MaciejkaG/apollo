# Dokumentacja backendu 

```javascript
// start
await window.backend.assistant.initialize('twój-klucz-api');

// Wysyłanie wiadomości
const odpowiedź = await window.backend.assistant.sendMessage(
    'Twoja wiadomość',
    'id-konwersacji'  // opcjonalne
);

window.addEventListener('assistant-chunk', (e) => {
    console.log(e.detail); // fragment odpowiedzi
});

await window.backend.assistant.streamMessage(
    'Twoja wiadomość',
    'id-konwersacji'  // opcjonalne
);

// Czyszczenie historii
await window.backend.assistant.clearConversation('id-konwersacji');
```