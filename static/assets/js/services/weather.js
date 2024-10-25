async function updateWeather() {
    const translations = {
        "clear sky": "czyste niebo",
        "rain": "deszcz",
        "snow": "śnieg",
        "thunderstorm": "burza",
        "overcast clouds": "zachmurzenie",
        "broken clouds": "pochmurnie",
        "scattered clouds": "rozproszone chmury",
        "few clouds": "mało chmur",
        "partly cloudy": "częściowe zachmurzenie"
    };

    try {
        const weatherData = await window.backend.weather.getComplete({ 
            location: 'Kamionki',
            units: 'celsius',
            forecast_days: 1,
            historical_days: 0
        });

        const current = weatherData.data.current;
        const weatherWidget = document.getElementById('weather');
        if (weatherWidget) {
            const description = translations[current.condition.description.toLowerCase()] || current.condition.description.toLowerCase();
            weatherWidget.querySelector('h1').textContent = `${Math.round(current.temperature.value)}°C, ${description}`;
        }

        const forecast = weatherData.data.forecast;
        const forecastContainer = weatherWidget.querySelector('.forecast');
        forecastContainer.innerHTML = '';

        forecast.forEach(entry => {
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
    } catch (error) {
        console.error('Error updating weather:', error);
    }
}

updateWeather();
setInterval(updateWeather, 3600000);
