function updateKeyboardTargets() {
    $('input').off('focus blur');

    $('input').on('focus', e => {
        if (isTextBox(e.target)) $('.bodyWrapper').addClass('keyboardActive');
    });

    $('input').on('blur', e => {
        if (isTextBox(e.target)) $('.bodyWrapper').removeClass('keyboardActive');
    });
}
setInterval(updateKeyboardTargets, 500);
updateKeyboardTargets();

$('.keyboard').on('mousedown', e => {
    e.preventDefault();
});

$('.keyboard .key').on('mousedown', e => {
    const focusedElement = document.activeElement;
    
    if (!isTextBox(focusedElement)) return;

    switch (e.target.id) {
        case 'shiftKey':
            shiftKeys();
            break;

        case 'backspaceKey':
            focusedElement.value = focusedElement.value.slice(0, -1);
            break;

        default:
            focusedElement.value += e.target.textContent;
            break;
    }

    const valueLength = focusedElement.value.length;
    // Move the cursor to the end of the inserted text
    focusedElement.setSelectionRange(valueLength, valueLength);

    // Force the input field to scroll to the cursor position
    focusedElement.scrollLeft = focusedElement.scrollWidth;
});

let curShift = true;
function shiftKeys(state = null) { // state is a bool indicating the capitalisation to which the keys should be shifted (true = upper)
    const keys = document.querySelectorAll('.keyboard .key:not(.l):not(.xl):not(.xxl)');

    if (state === null) {
        // reverse current shift
        curShift = !curShift;
        // set the desired state to the desired shift state
        state = !curShift;
    }

    keys.forEach((key) => {
        key.textContent = state ? key.textContent.toUpperCase() : key.textContent.toLowerCase();
    });
}

function isTextBox(element) {
    var tagName = element.tagName.toLowerCase();
    if (tagName === 'textarea') return true;
    if (tagName !== 'input') return false;
    var type = element.getAttribute('type').toLowerCase(),
        // if any of these input types is not supported by a browser, it will behave as input type text.
        inputTypes = ['text', 'password', 'number', 'email', 'tel', 'url', 'search', 'date', 'datetime', 'datetime-local', 'time', 'month', 'week']
    return inputTypes.indexOf(type) >= 0;
}

function closeKeyboard() {
    // Close the keyboard
    $(document.activeElement).blur();
}