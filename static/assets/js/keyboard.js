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
    focusedElement.setSelectionRange(valueLength, valueLength);
});
