/*
=======================================
JavaScript & Web APIs Lab
=======================================
*/

/*  
=======================================
TODO1: Welcome Board
---------------------------------------
When the page loads, display a welcome message 
inside the <p> element with id="t1-msg".

Task:
- Select the element with id "t1-msg".
- Change its text to "Hello, World!".

Hint:
document.getElementById() to change inner HTML;
*/
 
window.addEventListener("DOMContentLoaded", () => {
  const msg = document.getElementById("t1-msg");
  if (msg) msg.textContent = "Hello, World!";
});

/*  
=======================================
TODO2: Interaction Corner
---------------------------------------
There is a button with id="t2-btn".
When the button is clicked, change the text inside 
the <p> with id="t2-status" to:
    "You clicked the button!"

Task:
- Get the button element.
- Add a click event listener.
- Inside the event, change the text of the status paragraph.

Hint:
button.addEventListener("click", function () {
    // change text here
});
*/
const t2Btn = document.getElementById("t2-btn");
const t2Status = document.getElementById("t2-status");

if (t2Btn && t2Status) {
  t2Btn.addEventListener("click", () => {
    t2Status.textContent = "You clicked the button!";
  });
}
 

/*  
=======================================
TODO3: Inspiring Quote Board
---------------------------------------
Use the Quotable API to display a random quote.

API Link:
https://dummyjson.com/quotes/random

Task:
- When the button with id="t3-loadQuote" is clicked:
    - Fetch a random quote from the API.
    - Display the quote text inside the <p> with id="t3-quote".
    - Display the author inside the <p> with id="t3-author".

Hint:
When you fetch from the API, it returns a JSON object like this:
{
  "quote": "Do not watch the clock. Do what it does. Keep going.",
  "author": "Sam Levenson"
}

You do NOT need to create this object manually.
After fetching and converting to JSON, use:
data.quote    // the quote text
data.author   // the author
*/
const t3Btn = document.getElementById("t3-loadQuote");
const t3Quote = document.getElementById("t3-quote");
const t3Author = document.getElementById("t3-author");

if (t3Btn && t3Quote && t3Author) {
  t3Btn.addEventListener("click", async () => {
    try {
      const res = await fetch("https://dummyjson.com/quotes/random");
      if (!res.ok) throw new Error("Failed to fetch quote");
      const data = await res.json();

      t3Quote.textContent = data.quote ?? "";
      t3Author.textContent = data.author ?? "";
    } catch (err) {
      // optional for UX; keep simple for grading
      t3Quote.textContent = "Could not load quote.";
      t3Author.textContent = "";
    }
  });
}
 

/*  
=======================================
TODO4: Dammam Weather Now
=======================================
Use the OpenWeatherMap API to display live weather data.

API Link:
https://api.openweathermap.org/data/2.5/weather?q=Dammam&appid=API_KEY=metric

Replace API_KEY with your actual API key from:
Key: eb143142d18ea165c434cdb10b3d83e6&units

Task:
- When the button with id="t4-loadWx" is clicked:
    - Fetch current weather data for Dammam.
    - Show temperature in the element with id="t4-temp".
    - Show humidity in the element with id="t4-hum".
    - Show wind speed in the element with id="t4-wind".

Hint:
data.main.temp      → temperature (°C)
data.main.humidity  → humidity (%)
data.wind.speed     → wind speed (m/s)
*/

const API_KEY = "REPLACE_WITH_YOUR_KEY"; // keep private in instructor copy
const t4Btn = document.getElementById("t4-loadWx");
const t4Temp = document.getElementById("t4-temp");
const t4Hum = document.getElementById("t4-hum");
const t4Wind = document.getElementById("t4-wind");

if (t4Btn && t4Temp && t4Hum && t4Wind) {
  t4Btn.addEventListener("click", async () => {
    try {
      const url =
        `https://api.openweathermap.org/data/2.5/weather?q=Dammam&appid=${API_KEY}&units=metric`;

      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch weather");
      const data = await res.json();

      t4Temp.textContent = `${data.main.temp}`;
      t4Hum.textContent = `${data.main.humidity}`;
      t4Wind.textContent = `${data.wind.speed}`;
    } catch (err) {
      // optional for UX; keep simple for grading
      t4Temp.textContent = "N/A";
      t4Hum.textContent = "N/A";
      t4Wind.textContent = "N/A";
    }
  });
}