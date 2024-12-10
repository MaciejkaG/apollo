import Store from 'electron-store';

const store = new Store();

export function setNoteContent(noteIndex, value) {
    let notes = getNotes();

    notes[noteIndex].content = value;
}

export function setNoteTitle(noteIndex, value) {
    let notes = getNotes();

    notes[noteIndex].title = value;
}

export function getNotes() {
    return store.get('notes');
}