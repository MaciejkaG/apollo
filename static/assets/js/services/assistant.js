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

class ApolloUI {
    constructor() {
        this.currentScreen = 'idle';
        this.messages = [];
        this.examplePrompts = [
            "Apollo, jaka będzie dzisiaj pogoda w Poznaniu?",
            "Apollo, opowiedz mi żart",
            "Apollo, co nowego w technologii?",
            "Apollo, jak się masz?",
        ];
        this.currentPromptIndex = 0;

        this.setupEventListeners();
        this.startPromptCycle();
        this.setupAnimations();
    }

    setupEventListeners() {
        // Wake word detection
        window.addEventListener('wake-event', (e) => {
            const { event } = e.detail;
            if (event === 'wake') {
                console.log('aa')
                this.startListening();
            }
        });

        // Speech events
        window.addEventListener('speech-event', (e) => {
            const { event, data } = e.detail;
            switch (event) {
                case 'chunk':
                    this.updateTranscript(data);
                    break;
                case 'finished':
                    this.handleFinishedSpeech(data);
                    break;
            }
        });
    }

    setupAnimations() {
        // Listening indicator animation
        anime({
            targets: '.listening-indicator .circle',
            scale: [1, 1.4, 1],
            opacity: [1, 0.5, 1],
            delay: anime.stagger(100),
            loop: true,
            easing: 'easeInOutSine',
            duration: 1000
        });

        // Processing spinner animation
        anime({
            targets: '.processing-spinner',
            rotate: '360deg',
            loop: true,
            duration: 1000,
            easing: 'linear'
        });

        // Typing indicator animation
        anime({
            targets: '.typing-indicator .dot',
            translateY: [0, -10, 0],
            delay: anime.stagger(100),
            loop: true,
            easing: 'easeInOutSine',
            duration: 600
        });
    }

    startPromptCycle() {
        const cycleExamplePrompts = () => {
            anime({
                targets: '#examplePrompt',
                opacity: [1, 0],
                duration: 500,
                easing: 'easeOutQuad',
                complete: () => {
                    this.currentPromptIndex = (this.currentPromptIndex + 1) % this.examplePrompts.length;
                    document.getElementById('examplePrompt').textContent = this.examplePrompts[this.currentPromptIndex];
                    anime({
                        targets: '#examplePrompt',
                        opacity: [0, 1],
                        duration: 500,
                        easing: 'easeInQuad'
                    });
                }
            });
        };

        cycleExamplePrompts();
        setInterval(cycleExamplePrompts, 3000);
    }

    switchScreen(screenName) {
        const screens = document.querySelectorAll('.screen');
        screens.forEach(screen => screen.classList.remove('active'));

        const newScreen = document.querySelector(`.${screenName}Screen`);
        newScreen.classList.add('active');

        this.currentScreen = screenName;
    }

    startListening() {
        this.switchScreen('listening');
        window.backend.speech.transcribeStream();
    }

    updateTranscript(text) {
        const transcript = document.getElementById('transcript');
        transcript.textContent = text;
    }

    async handleFinishedSpeech(finalTranscript) {
        this.switchScreen('processing');
        await this.handleQuery(finalTranscript);
    }

    async handleQuery(query) {
        this.addMessage('user', query);

        try {
            const streamId = 'apollo-response-' + Date.now();
            let currentResponse = '';

            // Show typing indicator
            document.getElementById('typingIndicator').classList.remove('hidden');

            // Listen for streaming chunks
            window.addEventListener(streamId + '-assistant-chunk', (e) => {
                const chunk = e.detail;
                if (chunk.content) {
                    currentResponse += e.detail.content;
                    this.updateLastAssistantMessage(currentResponse);
                }
            });

            this.addMessage('assistant', '');
            this.switchScreen('chat');

            await window.backend.assistant.streamMessage(query, streamId);

            // Hide typing indicator
            document.getElementById('typingIndicator').classList.add('hidden');

            // Clear the previous transcript.
            this.updateTranscript('');

            // Synthesize the full response.
            window.backend.speech.synthesize(currentResponse);
        } catch (error) {
            console.error('Error getting response:', error);
            this.addMessage('assistant', 'Przepraszam, wystąpił błąd. Spróbuj ponownie.');
        }
    }

    addMessage(role, content) {
        const messagesContainer = document.getElementById('messagesContainer');
        const messageElement = document.createElement('div');
        messageElement.className = `message ${role}`;

        if (role === 'assistant' && !content) {
            // Add typing indicator inside the message
            messageElement.innerHTML = `
            <span class="message-content"></span>
            <div class="typing-indicator">
                <div class="dot"></div>
                <div class="dot"></div>
                <div class="dot"></div>
            </div>
        `;
        } else {
            messageElement.innerHTML = `<span class="message-content">${content}</span>`;
        }

        messagesContainer.appendChild(messageElement);

        // Scroll to bottom
        const chatContainer = document.getElementById('chatContainer');
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    updateLastAssistantMessage(content) {
        const messages = document.querySelectorAll('.message.assistant');
        if (messages.length > 0) {
            const lastMessage = messages[messages.length - 1];
            const messageContent = lastMessage.querySelector('.message-content');
            const typingIndicator = lastMessage.querySelector('.typing-indicator');

            // For the first chunk, remove typing indicator
            if (typingIndicator && !messageContent.textContent) {
                typingIndicator.remove();
            }

            // Create and append new animated span for the chunk
            const chunkSpan = document.createElement('span');
            chunkSpan.className = 'animated-word';
            chunkSpan.textContent = content.slice(messageContent.textContent.length); // Only new content
            messageContent.appendChild(chunkSpan);

            // Animate the new chunk
            anime({
                targets: chunkSpan,
                opacity: [0, 1],
                duration: 400,
                easing: 'easeOutQuad'
            });
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.apollo = new ApolloUI();
});