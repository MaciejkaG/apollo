function animaText(el) {
    const initialHTML = el.innerHTML;

    const textContent = el.textContent;

    el.innerHTML = textContent
        .split('') // Split the string into an array of characters
        .map(char => `<span style="display: inline-block;">${char}</span>`) // Wrap each character in a span
        .join(''); // Join the array back into a single string

    anime({
        targets: el.children,
        textShadow: [
            '0 0 10px rgba(255, 255, 255, 0.6)', // Bright glow at the start
            '0 0 5px rgba(255, 255, 255, 0.3)', // Dim glow mid-way
            '0 0 0px rgba(255, 255, 255, 0)' // No shadow at the end
        ],
        translateY: [40, 0], // Characters move upwards
        opacity: [0, 1], // Fade in
        easing: 'easeOutCubic',
        duration: 600, // Shortened duration for snappiness
        delay: anime.stagger(20), // Adjusted stagger for smoother flow
        complete: () => {
            // Bring back the initial HTML.
            el.innerHTML = initialHTML;
        }
    });
}