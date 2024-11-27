$('input').on('focus', e => {
    $('.bodyWrapper').addClass('keyboardActive');
});

$('input').on('blur', e => {
    $('.bodyWrapper').removeClass('keyboardActive');
});

$('.keyboard').on('mousedown', e => {
    e.preventDefault();
});

$('.keyboard .key').on('mousedown', e => {
    const focusedElement = document.activeElement;
    
    focusedElement.value += e.target.textContent;
    // This doesn't work (and I don't know why).
    const valueLength = focusedElement.value.length;
    // Move the cursor to the end of the inserted text
    focusedElement.setSelectionRange(valueLength, valueLength);

    // Force the input field to scroll to the cursor position
    focusedElement.scrollLeft = focusedElement.scrollWidth;
});
