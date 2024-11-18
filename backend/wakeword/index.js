// Speech by mcjk in collaboration with ChatGPT <3

import record from 'node-record-lpcm16';

export default class Speech {
    constructor(porcupine) {
        this.audioBuffer = [];
        this.porcupine = porcupine;
        this.recording = null;
        this.frameSize = porcupine.frameLength;
        // Add buffer threshold to prevent memory leaks
        this.maxBufferSize = this.frameSize * 30; // Store max 30 frames worth of data
    }

    init() {
        return new Promise((resolve, reject) => {
            try {
                // Configure recording with correct format for Porcupine
                this.recording = record.record({
                    sampleRateHertz: this.porcupine.sampleRate,
                    channels: 1,  // Porcupine expects mono audio
                    audioType: 'raw',  // Raw PCM data
                    encoding: 'signed-integer',  // Signed 16-bit integers
                    threshold: 0,
                    verbose: false,
                    recorder: 'sox',  // Explicitly specify recorder
                })
                    .stream()
                    .on('data', (chunk) => {
                        // Convert buffer to Int16Array considering endianness
                        const int16Array = new Int16Array(
                            chunk.buffer,
                            chunk.byteOffset,
                            chunk.length / 2
                        );

                        // Buffer management to prevent memory leaks
                        if (this.audioBuffer.length < this.maxBufferSize) {
                            this.audioBuffer.push(...int16Array);
                        } else {
                            // Remove oldest frame worth of data
                            this.audioBuffer.splice(0, this.frameSize);
                            this.audioBuffer.push(...int16Array);
                        }
                    })
                    .on('error', (err) => {
                        console.error('Recording error:', err);
                        reject(err);
                    });

                resolve();
            } catch (err) {
                console.error('Failed to initialize recording:', err);
                reject(err);
            }
        });
    }

    getNextAudioFrame() {
        if (this.audioBuffer.length >= this.frameSize) {
            // Create a new frame buffer
            const frameBuffer = new Int16Array(this.frameSize);
            // Copy and remove the frame data from the buffer
            frameBuffer.set(this.audioBuffer.slice(0, this.frameSize));
            this.audioBuffer = this.audioBuffer.slice(this.frameSize);
            return frameBuffer;
        }
        return null;
    }

    stop() {
        if (this.recording) {
            try {
                this.recording.stop();
                this.audioBuffer = []; // Clear the buffer
            } catch (err) {
                console.error('Error stopping recording:', err);
            }
        }
    }

    // Add cleanup method
    cleanup() {
        this.stop();
        this.audioBuffer = null;
        this.recording = null;
    }
}