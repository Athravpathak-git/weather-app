const apiKey = "14a26e2c164d4f36be854129262903";
async function getWeather() {
    const city = document.getElementById("cityInput").value;

    const res = await fetch(`https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${city}`);
    const data = await res.json();

    document.getElementById("city").innerText = data.location.name;
    document.getElementById("temp").innerText = "Temp: " + data.current.temp_c + "°C";
    document.getElementById("condition").innerText = data.current.condition.text;
}
const cities = ["Mumbai","Delhi","Pune","Nagpur","Akola","Bangalore","Chennai","Kolkata"];

async function getAllCitiesWeather() {
    for (let city of cities) {
        const res = await fetch(`https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${city}`);
        const data = await res.json();

        document.body.innerHTML += `<p>📍 ${city} → ${data.current.temp_c}°C</p>`;
    }
}