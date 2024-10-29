class SpotifyWidget {
    constructor() {
        this.widget = document.getElementById('spotify');
        this.albumArt = this.widget.querySelector('img');
        this.titleSpan = this.widget.querySelector('.title');
        this.authorSpan = this.widget.querySelector('.author');
        this.playButton = this.widget.querySelector('.controls button:nth-child(2)');
        this.prevButton = this.widget.querySelector('.controls button:nth-child(1)');
        this.nextButton = this.widget.querySelector('.controls button:nth-child(3)');
        this.isPlaying = false;

        this.initializeSpotify();
        this.setupEventListeners();
    }

    async initializeSpotify() {
        try {
            const result = await window.backend.spotify.initialize({});
            
            if (result.success) {
                console.log(result);
                $('#spotifyLoginQRCode').attr('src', result.qrCode);
                await window.backend.spotify.authenticate();
            }
        } catch (error) {
            console.error('Failed to initialize Spotify:', error);
        }
    }

    setupEventListeners() {
        window.addEventListener('spotify-event', (e) => {
            const { event, data } = e.detail;
            
            switch (event) {
                case 'authenticated':
                    console.log('Authentication successful');
                    $('.spotifyLoginAlert').removeClass('active');
                    this.updateCurrentTrack();
                    break;
                    
                case 'error':
                    if (data === 'Authentication timeout') {
                        setTimeout(() => {
                            this.initializeSpotify();
                        }, 2000);
                    }
                    console.error('Spotify error:', data);
                    break;
            }
        });

        this.playButton.addEventListener('click', () => this.togglePlayback());
        this.prevButton.addEventListener('click', () => this.previousTrack());
        this.nextButton.addEventListener('click', () => this.nextTrack());

        setInterval(() => this.updateCurrentTrack(), 1000);
    }

    async togglePlayback() {
        try {
            if (this.isPlaying) {
                await window.backend.spotify.pause();
                this.playButton.querySelector('span').textContent = 'play_arrow';
            } else {
                await window.backend.spotify.play();
                this.playButton.querySelector('span').textContent = 'pause';
            }
            this.isPlaying = !this.isPlaying;
        } catch (error) {
            console.error('Failed to toggle playback:', error);
        }
    }

    async previousTrack() {
        try {
            await window.backend.spotify.previous();
        } catch (error) {
            console.error('Failed to play previous track:', error);
        }
    }

    async nextTrack() {
        try {
            await window.backend.spotify.next();
        } catch (error) {
            console.error('Failed to play next track:', error);
        }
    }

    async updateCurrentTrack() {
        try {
            const response = await window.backend.spotify.getCurrentTrack();
            console.log(response)
            if (response?.success && response?.track) {
                const track = response.track;
                
                if (track.item?.album?.images?.[0]?.url) {
                    this.albumArt.src = track.item.album.images[0].url;
                }

                if (track.item.name) {
                    this.titleSpan.textContent = track.item.name;
                }
                
                if (track.item?.artists) {
                    this.authorSpan.textContent = track.item.artists.map(artist => artist.name).join(', ');
                }
                

                const state = await window.backend.spotify.getCurrentState();
                if (state?.success && state?.state) {
                    this.isPlaying = state.state.is_playing;
                    this.playButton.querySelector('span').textContent = 
                        this.isPlaying ? 'pause' : 'play_arrow';
                }
            }
        } catch (error) {
            console.error('Failed to update current track:', error);
        }
    }
}


document.addEventListener('DOMContentLoaded', () => {
    new SpotifyWidget();
});