window.backend.assistant.initialize('')
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