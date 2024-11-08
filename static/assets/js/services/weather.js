let city = 'Poznan';

const weatherApp = document.getElementById('weatherApp');

weatherApp.addEventListener('appopen', () => {
    if ($('#weatherSummary').html().length === 0) summariseWeather();
});

async function updateWeather() {
    const translations = {
        "clear sky": "czyste niebo",
        "rain": "deszcz",
        "light rain": "mżawka",
        "moderate rain": "umiarkowany deszcz",
        "snow": "śnieg",
        "thunderstorm": "burza",
        "overcast clouds": "zachmurzenie",
        "broken clouds": "pochmurnie",
        "scattered clouds": "rozproszone chmury",
        "few clouds": "troche chmur",
        "partly cloudy": "częściowe zachmurzenie",
        "mist": "mgła",
    };

    const backgrounds = {
        "clear sky": "var(--sunny)",
        "rain": "var(--rainy)",
        "light rain": "var(--rainy)",
        "moderate rain": "var(--rainy)",
        "snow": "var(--rainy)",
        "thunderstorm": "var(--thunderstorm)",
        "overcast clouds": "var(--cloudy)",
        "broken clouds": "var(--cloudy)",
        "scattered clouds": "var(--cloudy)",
        "few clouds": "var(--sunny)",
        "partly cloudy": "var(--cloudy)",
        "mist": "var(--cloudy)",
    };

    try {
        const weatherData = await window.backend.weather.getComplete({ 
            location: city,
            units: 'celsius',
            forecast_days: 3,
            historical_days: 0
        });

        const current = weatherData.data.current;
        const weatherWidget = document.getElementById('weather');
        if (weatherWidget) {
            const description = translations[current.condition.description.toLowerCase()] || current.condition.description.toLowerCase();
            weatherWidget.querySelector('h1').textContent = `${Math.round(current.temperature.value)}° ${description}`;
            $('#weatherApp .currentTemperature').html(`${Math.round(current.temperature.value)}°`);

            // Apply a correct widget and app background according to the current weather.
            document.documentElement.style.cssText = `--active-weather-background: ${backgrounds[current.condition.description.toLowerCase()] || 'var(--cloudy)'}`;
        }

        const forecast = weatherData.data.forecast;
        const forecastContainer = weatherWidget.querySelector('.forecast');
        forecastContainer.innerHTML = '';

        const dayForecast = forecast.slice(0, 8);

        dayForecast.forEach(entry => {
            const forecastTime = new Date(entry.timestamp);
            const hour = forecastTime.getHours();
            const temperature = Math.round(entry.temperature.value);
            const conditionDescription = entry.condition.description.toLowerCase();
            const translatedDescription = translations[conditionDescription] || conditionDescription;

            let iconName = 'partly_cloudy_day';
            switch (conditionDescription) {
                case 'clear sky':
                    iconName = 'clear_day';
                    break;
                case 'rain':
                    iconName = 'rainy';
                    break;
                case 'snow':
                    iconName = 'cloudy_snowing';
                    break;
                case 'thunderstorm':
                    iconName = 'thunderstorm';
                    break;
                case 'overcast clouds':
                case 'broken clouds':
                case 'scattered clouds':
                case 'few clouds':
                    iconName = 'cloudy';
                    break;
            }

            const forecastDiv = document.createElement('div');
            forecastDiv.innerHTML = `
                <span>${hour}:00</span>
                <span class="material-symbols-outlined fill">${iconName}</span>
                <span>${temperature}°C</span>
            `;

            forecastContainer.appendChild(forecastDiv);
        });

        $('#weatherSummary').html('');
    } catch (error) {
        console.error('Error updating weather:', error);
    }
}

updateWeather();
setInterval(updateWeather, 3600000);

function summariseWeather() {
    let time;
    const hours = new Date().getHours();
    if (hours < 6 || hours >= 21) time = 'rano';
    else if (hours < 12) time = 'w południe';
    else if (hours < 18) time = 'popołudnieu';
    else time = 'wieczorem';
    const prompt = `Podsumuj teraźniejszą prognozę pogody, ${time} oraz na następne 3 dni tygodnia dla miejscowości: "${city}". Podziel podsumowanie na maks. 2 akapity względem omawianego okresu. Całość nie może przekroczyć 90 słów. Pamiętaj aby zawrzeć twarde dane tj. niże i wyże temperaturowe, wiatr w km/h, temperaturę odczuwalną. Poza tym dodaj krótką poradę dotyczącą ubioru lub akcesoriów na dzisiaj ${time}, w zależności od pogody. Jeżeli nie uda ci się uzyskać informacji o pogodzie, krótko przeproś i nie oferuj dalszej pomocy.`;
    const id = 'weather-summary';
    window.backend.assistant.streamMessage(prompt, id)
        .then(() => {
            console.log("Streaming completed successfully.");
        })
        .catch((error) => {
            console.error("Streaming error:", error);
        });

    $('#weatherSummary').html('');
    // Listen for the assistant-chunk events on the window object
    window.addEventListener(`${id}-assistant-chunk`, (event) => {
        const chunk = event.detail;

        if (chunk.content) {
            const content = `<span class="animated-word">${chunk.content}</span>`.replace(/\n/g, "<br />");

            // Insert the content as a span into the #weatherSummary element
            $('#weatherSummary').append(content);

            // Animate each new chunk without affecting previous animations
            anime({
                targets: '#weatherSummary .animated-word:not(.animated)', // Only animate new words
                opacity: [0, 1],
                duration: 400,
                easing: 'easeOutQuad',
            });

            $('#weatherSummary .animated-word:not(.animated)').addClass('animated')
        }
    });
}