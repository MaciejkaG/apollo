import memos from '../../../memos/index.js';

export default {
    async execute() {
        try {
            const notes = memos.getNotes();
            return notes;
        } catch (err) {
            return "Couldn't retrieve notes.";
        }
    }
}