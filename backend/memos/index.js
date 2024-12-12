import Store from 'electron-store';

const store = new Store();

const getNotes = () => {
    return store.get('notes');
};

export default {
    setNoteContent: (noteIndex, value) => {
        let notes = getNotes();

        notes[noteIndex].content = value;
        notes[noteIndex].lastEditedAt = nowMillis();

        store.set('notes', notes);
    },
    setNoteTitle: (noteIndex, value) => {
        let notes = getNotes();

        notes[noteIndex].title = value;
        notes[noteIndex].lastEditedAt = nowMillis();

        store.set('notes', notes);
    },
    createNote: (title, content) => {
        let notes = getNotes();

        notes.push({
            title,
            content,
            lastEditedAt: nowMillis()
        });

        store.set('notes', notes);
    },

    getNotes,
}

function nowMillis() {
    const now = new Date();
    return now.getTime();
}