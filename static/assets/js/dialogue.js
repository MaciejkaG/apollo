/* 
    Dialogue 0.0.1
    © 2024 77
*/

let dialogueContainer
document.addEventListener('DOMContentLoaded', () => {
    dialogueContainer = document.createElement('div');
    dialogueContainer.classList.add('dialogueContainer');
    document.body.appendChild(dialogueContainer);

    new Dialogue("Wymagana autoryzacja", "Musisz podać hasło, aby Apollo mógł przyłączyć się do sieci Wi-Fi.");
});

class Dialogue {
    constructor(title, description) {
        // Create the main container
        this.dialogue = document.createElement('div');
        this.dialogue.classList.add('dialogue');

        // Create the header section
        const header = document.createElement('div');
        header.classList.add('header');

        const headerTitle = document.createElement('span');
        headerTitle.classList.add('title');
        headerTitle.textContent = title;

        const headerDescription = document.createElement('span');
        headerDescription.classList.add('description');
        headerDescription.textContent = description;

        header.appendChild(headerTitle);
        header.appendChild(headerDescription);

        // Create the content section
        this.content = document.createElement('div');
        this.content.classList.add('content');

        // Create the footer section
        this.footer = document.createElement('div');
        this.footer.classList.add('footer');

        // Append all sections to the main dialogue container
        this.dialogue.appendChild(header);
        this.dialogue.appendChild(this.content);
        this.dialogue.appendChild(this.footer);

        // Add the dialogue to the body
        dialogueContainer.appendChild(this.dialogue);
        dialogueContainer.classList.add('active');
    }

    // This method allows for modifying the dialogue content in a form of a transition.
    // The callback is ran after the dialogue disappears. It appears back after the callback finishes.
    inTransition(callback) {
        anime({
            targets: this.dialogue,
            translateX: [0, 50],
            opacity: [1, 0],
            easing: 'easeOutSine',
            duration: 300,
            complete: () => {
                callback();
                anime({
                    targets: this.dialogue,
                    translateX: [-50, 0],
                    opacity: [0, 1],
                    easing: 'easeOutSine',
                    duration: 300,
                });
            }
        });
    }

    // This method closes and destroys the dialogue menu
    destroy() {
        anime({
            targets: this.dialogue,
            translateY: [0, -50],
            opacity: [1, 0],
            easing: 'easeOutSine',
            duration: 300,
            complete: () => {
                this.dialogue.remove();
                if (dialogueContainer.children.length === 0) {
                    dialogueContainer.classList.remove('active');
                }
            }
        });
    }
}