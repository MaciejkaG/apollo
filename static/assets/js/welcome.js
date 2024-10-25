const loader = document.getElementById('welcome');
const welcomeText = document.getElementById('welcomeText');
// Split the text into individual letters
welcomeText.innerHTML = welcomeText.textContent.replace(/./g, "<span class='letter'>$&</span>");

window.addEventListener('load', () => {
    // Startup animation (the nesting is criminal)
    const animationSpacing = 40;
    const letters = loader.querySelectorAll('.letter');
    for (let i = 0; i < letters.length; i++) {
        setTimeout(() => {
            const letter = letters[i];
            letter.style.backgroundColor = 'var(--theme-fg-1)';
            letter.style.color = 'var(--theme-fg-1)';
            setTimeout(() => {
                for (let j = 0; j < letters.length; j++) {
                    setTimeout(() => {
                        const letter = letters[j];
                        letter.style.color = 'var(--theme-bg-1)';

                        setTimeout(() => {
                            for (let j = 0; j < letters.length; j++) {
                                setTimeout(() => {
                                    const letter = letters[j];
                                    letter.style.backgroundColor = 'var(--theme-bg-1)';
                                    letter.style.color = 'var(--theme-fg-1)';
                                }, j * animationSpacing);
                            }

                            setTimeout(() => {
                                $(loader).addClass('hidden');
                            }, letters.length * animationSpacing + 500);
                        }, letters.length * animationSpacing);
                    }, j * animationSpacing);
                }
            }, letters.length * animationSpacing);
        }, i * animationSpacing);
    }
});