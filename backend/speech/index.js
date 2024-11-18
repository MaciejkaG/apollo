import { SpeechClient } from '@google-cloud/speech';
import record from 'node-record-lpcm16';

// Initialize the Speech client
const client = new SpeechClient();

export function transcribeStream(onTranscript, onFinalResult) {
    // Configure request for streaming recognition
    const request = {
        config: {
            encoding: 'LINEAR16', // Audio encoding
            sampleRateHertz: 16000, // Sample rate
            languageCode: 'pl-PL', // Preferred language
        },
        interimResults: true, // For real-time results
    };

    // Create a readable stream from the microphone
    const audioStream = record
        .record({
            channels: 1,  // Mono audio
            audioType: 'raw',  // Raw PCM data
            sampleRateHertz: 16000,
            threshold: 0, // Silence threshold
            verbose: false,
            recordProgram: 'rec', // 'arecord' or 'rec'
            recorder: 'sox',
            device: null, // Specify device if necessary
        })
        .stream()
        .on('error', console.error);

    let lastSpokenTime = Date.now(); // Track last speech time
    const silenceTimeout = 3000; // Silence threshold (3 seconds)

    // Initialize the streaming recognize client
    let lastTranscript = ''; // To store the last full transcript

    const recognizeStream = client
        .streamingRecognize(request)
        .on('error', console.error)
        .on('data', (data) => {
            lastSpokenTime = Date.now(); // Reset silence timer

            const result = data.results[0];
            const transcript = result?.alternatives[0]?.transcript;
            const isFinal = result?.isFinal;

            if (transcript) {
                // Only output new transcription if it differs from the last one
                if (transcript !== lastTranscript) {
                    onTranscript(transcript);  // Pass the updated transcript to the callback
                    lastTranscript = transcript;
                }
            }

            if (isFinal) {
                // Final transcription callback
                lastSpokenTime = 0; // User doesn't speak
            }
        });

    // Pipe the audio stream to the recognition stream
    audioStream.pipe(recognizeStream);

    // Monitor silence
    const silenceChecker = setInterval(() => {
        if (Date.now() - lastSpokenTime > silenceTimeout) {
            clearInterval(silenceChecker); // Stop checking for silence

            // End recognition and stop recording
            recognizeStream.end();
            audioStream.destroy();
            onFinalResult(lastTranscript);
        }
    }, 300);
}

// Example usage
// transcribeStream((chunk) => {
//     console.log(`${new Date()} Chunk: ${chunk}`);
// }, (transcript) => {
//     console.log(`\n${new Date()} Speech end. Final result: ${transcript}`)
// });