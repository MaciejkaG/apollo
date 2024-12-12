import memos from '../../../memos/index.js';

export default {
    async execute({
        title,
        contents,
    }) {
        try {
            memos.createNote(title, contents);
            return { success: true };
        } catch (err) {
            return { success: false };
        }
    }
}