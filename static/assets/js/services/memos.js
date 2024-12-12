const noteList = document.querySelector('#notes .noteList');

window.addEventListener('DOMContentLoaded', async () => {
    noteList.innerHTML = ''; // Clear the list

    const memos = await window.backend.memos.get();
    memos.sort((a, b) => b.lastEditedAt - a.lastEditedAt);

    memos.forEach(memo => {
        const memoDiv = document.createElement('div'); // Create the container div
        memoDiv.classList.add('el'); // Add a class to the div

        const memoSpan = document.createElement('span'); // Create the span for the title
        memoSpan.textContent = memo.title; // Safely set the text content

        memoDiv.appendChild(memoSpan); // Append the span to the div
        noteList.appendChild(memoDiv); // Append the div to the note list
    });
});