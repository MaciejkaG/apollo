setInterval(() => {
    const now = new Date();

    // Format hours and minutes with leading zeros if needed
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');

    // Format the date
    const days = ['Niedziela', 'Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota'];

    const dayName = days[now.getDay()];
    const dayNumber = now.getDate();

    // Short month format based on locale
    const shortMonth = now.toLocaleString('pl-PL', { month: 'short' });

    // Full month and year for detailed format
    const fullMonth = now.toLocaleString('pl-PL', { month: 'long' });
    const year = now.getFullYear();

    // Timezone based on the user's system
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    // Update the time widget
    $('#time .hour').html(`${hours}:${minutes}`);
    $('#time .date').html(`${dayName} ${dayNumber} ${shortMonth}.`);

    // Update the time app
    $('#timeApp h1').html(`${hours}:${minutes}:${seconds}`);
    $('#timeApp h3').html(`${dayName} ${dayNumber} ${fullMonth} ${year}<br>${timeZone}`);
}, 1000);  // Refresh every second