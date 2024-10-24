const loader = document.getElementById('welcome');
const welcomeText = document.getElementById('welcomeText');
// Split the text into individual letters
welcomeText.innerHTML = welcomeText.textContent.replace(/./g, "<span class='letter'>$&</span>");

window.addEventListener('load', () => {
    // Anime.js animation
    anime({
        targets: '#welcomeText .letter',
        opacity: [0, 1],
        easing: "easeInOutQuad",
        duration: 500,
        delay: anime.stagger(50),
        complete: () => {
            setTimeout(() => {
                $(loader).addClass('hidden');

                anime({
                    targets: '.col .widget',
                    opacity: [0, 1],
                    scale: [.8, 1],
                    // translateY: [-50, 0],
                    easing: "easeOutSine",
                    duration: 800,
                    delay: anime.stagger(200),
                });
            }, 500);
        }
    });
});