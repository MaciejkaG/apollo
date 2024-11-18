// Voice recognition
import { SpeechClient } from '@google-cloud/speech';
import record from 'node-record-lpcm16';

// TTS
import OpenAI from 'openai';
import { spawn } from 'child_process';

// Initialise the Speech client
const client = new SpeechClient();

// Initialise the OpenAI SDK and a sound player
const openai = new OpenAI();

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
    const silenceTimeout = 2000; // Silence threshold (2 seconds)

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

export async function synthesize(text, voiceName = 'alloy') {
    const response = await openai.audio.speech.create({
        model: 'tts-1',
        voice: voiceName,
        input: text,
        response_format: 'opus'
    });

    const ffplay = spawn('ffplay', [
        '-i', 'pipe:0',  // read from stdin
        '-nodisp',       // no video display
        '-autoexit'      // exit when playback is done
    ], { stdio: ['pipe', 'ignore', 'ignore'] });

    for await (const chunk of response.body) {
        ffplay.stdin.write(chunk);
    }
    ffplay.stdin.end();

    return new Promise((resolve, reject) => {
        ffplay.on('close', (code) => {
            code === 0 ? resolve() : reject(new Error(`ffplay exited with code ${code}`));
        });
    });
}

// Example usage
// transcribeStream((chunk) => {
//     console.log(`${new Date()} Chunk: ${chunk}`);
// }, (transcript) => {
//     console.log(`\n${new Date()} Speech end. Final result: ${transcript}`)
// });

// synthesize('This is a test of the TTS service.', 'nova');