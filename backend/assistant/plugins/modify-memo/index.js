import memos from '../../../memos/index.js';

export default {
    async execute({
        memoIndex,
        title,
        contents,
    }) {
        try {
            memos.setNoteTitle(memoIndex, title);
            memos.setNoteContent(memoIndex, contents);
            console.log('modified', memoIndex, title, contents);
            return { success: true };
        } catch (err) {
            return { success: false };
        }
    }
}