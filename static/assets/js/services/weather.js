let city = 'Poznan';

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

        // const prompt = `Podsumuj dzisiejszą prognozę pogody, oraz prognozę na następne 3 dni w maksymalnie 50 słowach dla miejscowości: "${city}"`;
        // const id = 'weather-summary';
        // window.backend.assistant.streamMessage(prompt, id)
        //     .then(() => {
        //         console.log("Streaming completed successfully.");
        //     })
        //     .catch((error) => {
        //         console.error("Streaming error:", error);
        //     });

        // $('#weatherSummary').html('');
        // // Listen for the assistant-chunk events on the window object
        // window.addEventListener(`${id}-assistant-chunk`, (event) => {
        //     const chunk = event.detail;
        //     // Handle each chunk of data as it arrives
        //     console.log("Received chunk:", chunk);
        //     // You can update your UI or process the chunk here
        //     $('#weatherSummary').get(0).innerHTML += chunk;
        // });
    } catch (error) {
        console.error('Error updating weather:', error);
    }
}

updateWeather();
setInterval(updateWeather, 3600000);
