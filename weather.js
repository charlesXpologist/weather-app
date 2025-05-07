
document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const temperatureField = document.querySelector(".temp p");
    const locationField = document.querySelector(".time_location p:first-child");
    const dateAndTimeField = document.querySelector(".time_location p:nth-child(2)");
    const conditionField = document.querySelector(".condition p:nth-child(2)");
    const searchField = document.getElementById("text");
    const form = document.querySelector("form");



// AUTO-LOCATION FEATURE
if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            fetchResults(`${latitude},${longitude}`);
        },
        (error) => {
            console.warn("Location access denied, using default:", error);
            fetchResults(target); // Fallback to Oregon
        }
    );
} else {
    fetchResults(target); // Old browser fallback
}


 // NEW: Create containers for dynamic content
    const hourlyContainer = document.createElement('div');
    hourlyContainer.className = 'hourly-forecast';
    document.querySelector('.weather_container').appendChild(hourlyContainer);

    // Event Listeners
    form.addEventListener('submit', searchForLocation);

    // Default location
    let target = "Oregon";

    // Initial fetch
    fetchResults(target);

    // MAIN WEATHER FETCH (UPGRADED)
    async function fetchResults(targetLocation) {
        const apiKey = '243fc519aea0461ea75163215250705';
        
        try {
            // NEW: Combined API calls with Promise.all
            const [weatherRes, astroRes] = await Promise.all([
                fetch(`https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${targetLocation}&days=1&aqi=yes&hours=24`),
                fetch(`https://api.weatherapi.com/v1/astronomy.json?key=${apiKey}&q=${targetLocation}`)
            ]);

            if (!weatherRes.ok || !astroRes.ok) throw new Error('API error');

            const weatherData = await weatherRes.json();
            const astroData = await astroRes.json();

            // Extract data
            const locationName = weatherData.location.name;
            const time = weatherData.location.localtime;
            const temp = weatherData.current.temp_c;
            const condition = weatherData.current.condition.text;
            const aqi = weatherData.current.air_quality["us-epa-index"]; // NEW: Air Quality
            const hourlyData = weatherData.forecast.forecastday[0].hour; // NEW: Hourly
            const { sunrise, sunset } = astroData.astronomy.astro; // NEW: Astronomy

            updateDetails(temp, locationName, time, condition, aqi, hourlyData, sunrise, sunset);
            
        } catch(error) {
            console.error("Error:", error);
            alert("Couldn't fetch weather data. Try again later.");
        }
    }

    // UPDATED DETAILS FUNCTION (All new features integrated)
    function updateDetails(temp, locationName, time, condition, aqi, hourlyData, sunrise, sunset) {
        // Original time/date formatting
        const [date, timePart] = time.split(" ");
        const dayName = getDayName(new Date(date).getDay());
        
        temperatureField.textContent = `${temp}°C`;
        locationField.textContent = locationName;
        dateAndTimeField.innerHTML = `${timePart} - ${dayName} ${date}<br>
                                      🌅 ${sunrise} | 🌇 ${sunset}`; // NEW: Astronomy

        conditionField.innerHTML = `${condition}<br>
                                   <span class="aqi">Air Quality: ${getAQIText(aqi)}</span>`; // NEW: AQI

        // NEW: Hourly Forecast
        hourlyContainer.innerHTML = `
            <h3>Next 12 Hours</h3>
            <div class="hourly-scroll">
                ${hourlyData.slice(0, 12).map(hour => `
                    <div class="hour">
                        <p>${hour.time.split(' ')[1].substring(0, 5)}</p>
                        <img src="https:${hour.condition.icon}" alt="${hour.condition.text}">
                        <p>${hour.temp_c}°C</p>
                    </div>
                `).join('')}
            </div>
        `;
    }

    // NEW: Air Quality Text Converter
    function getAQIText(aqi) {
        const levels = ['Good', 'Moderate', 'Unhealthy', 'Very Unhealthy', 'Hazardous'];
        return levels[aqi - 1] || 'Unknown';
    }

    // Rest of your original functions...
    function searchForLocation(e) {
        e.preventDefault();
        target = searchField.value.trim();
        if (target) fetchResults(target);
        else alert("Please enter a location");
    }

    function getDayName(dayNumber) {
        return ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][dayNumber];
    }
});