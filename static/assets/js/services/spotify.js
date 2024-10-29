// BUG HERE IF WE GO TO THE START OF THE PLAYLIST AND GO BACK THE FADEOUT STAYS, FIX COMING SOON


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
        this.updateInterval = null;
        this.currentTrackId = null;
        this.animations = {};
        this.currentImageUrl = null;
        
        this.albumArt.style.opacity = '0';
        this.titleSpan.style.opacity = '0';
        this.authorSpan.style.opacity = '0';
        
        this.initializeSpotify();
        this.setupEventListeners();
        this.setupAnimations();
    }

    setupAnimations() {
        // animacja zmiany utworu
        this.animations.trackChange = anime.timeline({
            autoplay: false,
            duration: 300,
            easing: 'easeInOutQuad'
        });

        // animacja wciśnięcia przycisku
        this.animations.buttonPress = anime({
            targets: null,
            scale: [1, 0.95, 1],
            duration: 200,
            easing: 'easeInOutQuad',
            autoplay: false
        });

    }

    async initializeSpotify() {
        try {
            const result = await window.backend.spotify.initialize();
            if (result.success) {
                if (result.qrCode) {
                    const qrCode = $('#spotifyLoginQRCode');
                    qrCode.attr('src', result.qrCode);
                    // pokaż alert logowania
                    anime({
                        targets: '.spotifyLoginAlert',
                        opacity: [0, 1],
                        translateY: [20, 0],
                        duration: 400,
                        begin: () => $('.spotifyLoginAlert').addClass('active')
                    });
                }
            } else {
                console.error('Spotify initialization failed:', result.error);
            }
        } catch (error) {
            console.error('Failed to initialize Spotify:', error);
        }
    }

    setupEventListeners() {
        window.addEventListener('spotify-event', (e) => {
            const { event, data } = e.detail;
            
            // obsługa różnych eventów Spotify
            switch (event) {
                case 'authInitialized':
                    // pokaz kod qr
                    if (data.qrCode) {
                        $('#spotifyLoginQRCode').attr('src', data.qrCode);
                        anime({
                            targets: '.spotifyLoginAlert',
                            opacity: [0, 1],
                            translateY: [20, 0],
                            duration: 400,
                            begin: () => $('.spotifyLoginAlert').addClass('active')
                        });
                    }
                    break;

                case 'authenticated':
                    // schowaj alert logowania
                    anime({
                        targets: '.spotifyLoginAlert',
                        opacity: [1, 0],
                        translateY: [0, -20],
                        duration: 400,
                        complete: () => $('.spotifyLoginAlert').removeClass('active')
                    });
                    break;

                case 'ready':
                    // all done
                    console.log('Spotify ready with device:', data.deviceId);
                    this.startTrackUpdates();
                    break;
            }
        });

        const controlButtons = [this.playButton, this.prevButton, this.nextButton];
        controlButtons.forEach(button => {
            button.addEventListener('click', this.debounce((e) => {
                this.animations.buttonPress.targets = e.currentTarget;
                this.animations.buttonPress.play();
            }, 200));
        });

        // linkujemy przyciski do funkcji
        this.playButton.addEventListener('click', this.debounce(() => this.togglePlayback(), 200));
        this.prevButton.addEventListener('click', this.debounce(() => this.previousTrack(), 200));
        this.nextButton.addEventListener('click', this.debounce(() => this.nextTrack(), 200));
    }

    // debounce do przycisków
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // loop do sprawdzania co aktualnie leci
    startTrackUpdates() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        this.updateCurrentTrack();
        this.updateInterval = setInterval(() => this.updateCurrentTrack(), 1000);
    }

    async togglePlayback() {
        try {
            this.isPlaying = !this.isPlaying;
            this.updatePlayButton();
            
            if (this.isPlaying) {
                await window.backend.spotify.play();
            } else {
                await window.backend.spotify.pause();
            }
        } catch (error) {
            this.isPlaying = !this.isPlaying;
            this.updatePlayButton();
            console.error('Failed to toggle playback:', error);
        }
    }

    // zmień ikonkę play/pause
    updatePlayButton() {
        const iconSpan = this.playButton.querySelector('span');
        iconSpan.textContent = this.isPlaying ? 'pause' : 'play_arrow';
    }

    async previousTrack() {
        try {
            this.nextTrackFadeout();
            await window.backend.spotify.previous();
        } catch (error) {
            console.error('Failed to play previous track:', error);
        }
    }

    async nextTrack() {
        try {
            this.nextTrackFadeout();
            await window.backend.spotify.next();
        } catch (error) {
            console.error('Failed to play next track:', error);
        }
    }

    async nextTrackFadeout() { 
        anime({
            targets: [this.titleSpan, this.authorSpan, this.albumArt],
            opacity: 0,
            translateY: [0, 5],
            duration: 350,
            delay: anime.stagger(50)
        });
    }

    // sprawdza co aktualnie leci i aktualizuje widget
    async updateCurrentTrack() {
        try {
            const [trackResponse, stateResponse] = await Promise.all([
                window.backend.spotify.getCurrentTrack(),
                window.backend.spotify.getCurrentState()
            ]);

            // aktualizuj informacje o utworze jeśli się zmieniły
            if (trackResponse?.success && trackResponse?.track) {
                const track = trackResponse.track;
                
                if (this.currentTrackId !== track.item?.id) {
                    this.currentTrackId = track.item?.id;
                    
                    const newTitle = track.item?.name || 'Unknown Track';
                    const newArtist = track.item?.artists?.map(artist => 
                        artist.name).join(', ') || 'Unknown Artist';
                    
                    // znajdujemy miniaturke (najgorszej jakosci, best for loading tho)
                    let newImageUrl = null;
                    if (track.item?.album?.images?.length > 0) {
                        const smallestImage = track.item.album.images.reduce((prev, current) =>
                            (!prev || current.width < prev.width) ? current : prev
                        );
                        newImageUrl = smallestImage.url;
                    }

                    // aktualizacja widgetu z animacją
                    if (newImageUrl && newImageUrl !== this.currentImageUrl) {
                        await this.updateTrackContent(newTitle, newArtist, newImageUrl);
                    } else {
                        await this.updateTrackContent(newTitle, newArtist, null);
                    }
                }
            }

            // aktualizacja stanu odtwarzania
            if (stateResponse?.success && stateResponse?.state) {
                const newIsPlaying = stateResponse.state.is_playing;
                if (this.isPlaying !== newIsPlaying) {
                    this.isPlaying = newIsPlaying;
                    this.updatePlayButton();
                }
            }
        } catch (error) {
            console.error('Failed to update current track:', error);
        }
    }

    // aktualizuje teksty i miniaturke na widgecie (animacje)
    async updateTrackContent(newTitle, newArtist, newImageUrl) {
        // zamieniamy tresc tytulu i autora
        this.titleSpan.textContent = newTitle;
        this.authorSpan.textContent = newArtist;

        // zaladuj miniaturke jesli jest
        if (newImageUrl) {
            await new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = () => {
                    this.albumArt.src = newImageUrl;
                    this.currentImageUrl = newImageUrl;
                    resolve();
                };
                img.onerror = reject;
                img.src = newImageUrl;
            });
        }

        // miniaturke i teksty odslaniamy razem
        anime({
            targets: [this.titleSpan, this.authorSpan, this.albumArt],
            opacity: 1,
            translateY: [5, 0],
            duration: 350,
            delay: anime.stagger(50)
        });
    }

    // cleanup
    destroy() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        
        // wszystkie animacje zatrzymujemy
        Object.values(this.animations).forEach(animation => animation.pause());
        this.animations = {};
        
        // spotify destroy
        window.backend.spotify.destroy()
            .catch(error => console.error('Failed to destroy Spotify client:', error));
    }
}

// klase odpalamy on load
document.addEventListener('DOMContentLoaded', () => {
    window.spotifyWidget = new SpotifyWidget();
});