# JavaScript Basics & Web APIs Lab

## 1) Introduction
This lab gives you hands-on practice with the essentials of client-side JavaScript:
- Placing JavaScript in external files and running it at the right time
- Selecting and updating DOM content
- Handling user events
- Fetching JSON from web APIs and displaying key fields

You’ll build four small, real-world features on one page:
1) a welcome message on load  
2) a simple interaction triggered by a button  
3) an inspirational quote fetched from an API (with a safe fallback)  
4) live weather for Dammam using the OpenWeatherMap API

> **Setup tips:**  
> - Open the page via a local server (e.g., VS Code “Live Server”) or in the Google Chrome using dev tool.  
> - Use the links in the TODO's task to connect with API's.

> **Note:**  
> Please use script.js file to perform TODOs and follow the steps strictly to gain good marks in the assignment.  
>  
> **Due Date:** 16 Feb, 2026, **11:59 PM**

---

## 2) Reading Assignment
Read the following **sections** from the Zybooks.

- 5.1 Using JavaScript with HTML
- 5.2 Document Object Model (DOM)
- 5.3 Using third-party web APIs (JavaScript)
- 5.4 JavaScript Object Notation (JSON)

---

## 3) Concept Overview

Below are the **core concepts used in this lab**, why they matter, and the **syntax** you’ll need.  

### 3.1 External JavaScript & Safe Load
```html
<!-- Put in <head> so parsing is non-blocking -->
<script src="script.js" defer></script>
```
```javascript
// Ensure DOM is ready before touching elements
document.addEventListener("DOMContentLoaded", function () {
  // code that accesses the DOM
});
```

### 3.2 Selecting & updating the DOM
The **DOM** is the in‑memory representation of your page. You can get elements and change what they show.

```javascript
// Get elements
const el = document.getElementById("element-id");   // by id (fast)
const box = document.querySelector(".className");    // by CSS selector

// Change content
el.textContent = "Plain text";                       // text only
el.innerHTML   = "<strong>HTML content</strong>";    // parses HTML
```
Use `textContent` for regular text. Use `innerHTML` only when you intentionally insert HTML.

---

### 3.3 Handling user events
Events let your page react when the user does something (clicks, types, etc.).

```javascript
const btn = document.getElementById("button-id");
btn.addEventListener("click", function () {
  // run code when the button is clicked
});
```

---

### 3.4 Getting data with `fetch` (Promise style)
`fetch(url)` asks a server for data. You check the response, then convert it to JSON so you can read it in JavaScript.

```javascript
fetch("https://example.com/api")
  .then(function (response) {
    if (!response.ok) {                 // not 2xx → treat as an error
      throw new Error("HTTP " + response.status);
    }
    return response.json();             // turn response body into JS object
  })
  .then(function (data) {
    // use the JSON data here
  })
  .catch(function (err) {
    // show a friendly message or handle the error
  });
```

---

### 3.5 Getting data with `fetch` (async/await style)
Same idea, just easier to read. Wrap calls in `try/catch` to handle errors.

```javascript
async function loadData() {
  try {
    const res  = await fetch("https://example.com/api");
    if (!res.ok) throw new Error("HTTP " + res.status);
    const data = await res.json();
    // use the JSON data here
  } catch (err) {
    // handle any network or HTTP errors
  }
}
```

---

### 3.6 Understanding JSON
APIs usually send back **JSON**. In JavaScript, JSON becomes objects/arrays you can read with dot notation.

```javascript
// Example object you might get back
const obj = { main: { temp: 25, humidity: 60 }, wind: { speed: 4.5 } };

// Read fields
obj.main.temp;      // 25
obj.main.humidity;  // 60
obj.wind.speed;     // 4.5

// Optional chaining avoids errors if something is missing:
const maybeTemp = obj?.main?.temp;
```

---

### 3.7 Building API URLs with query parameters
Many APIs expect inputs in the URL (like city name, units, or an API key). Use template strings to build the URL, and `encodeURIComponent` for user input.

```javascript
const base  = "https://api.openweathermap.org/data/2.5/weather";
const city  = "Dammam";
const units = "metric";
const key   = "YOUR_API_KEY";  // replace with your key for this lab

const url = `${base}?q=${encodeURIComponent(city)}&appid=${key}&units=${units}`;
```

---

### 3.8 HTTP status and friendly errors
Not all responses are successful. Common codes:
- **200**: OK
- **401**: Unauthorized (e.g., bad/missing API key)
- **404**: Not found (e.g., city misspelled)

Check and handle them so your page shows helpful messages.

```javascript
if (!response.ok) {
  throw new Error("HTTP " + response.status);
}
```

---

### 3.9 Simple loading states in the UI
While `fetch` is running, disable the button and show “Loading…”. Re‑enable and update the text after you finish (success or error).

```javascript
button.disabled = true;          // prevent double clicks
statusEl.textContent = "Loading…";

// after success or failure
button.disabled = false;
statusEl.textContent = "";       // or your final message
```

---

### 3.10 API keys (used in the weather feature)
Some APIs require a key to identify your app. For this lab the key is already placed in the URL. (In real projects you would keep keys on a server.)

```javascript
const url = "https://api.openweathermap.org/data/2.5/weather"
          + "?q=Dammam"
          + "&appid=YOUR_API_KEY"
          + "&units=metric";
```

> These explanations are building blocks only—apply them to your page’s elements and buttons when completing the lab tasks.

---

## 4) Submission Checklist

Use this list to verify everything before you submit:

### Project & Files
- [ ] **One external JS file** (e.g., `script.js`) linked.
- [ ] All required element **IDs** in HTML match those used in JS.

### Feature 1 — Welcome Message
- [ ] On page load, a greeting appears in the designated element.
- [ ] No console errors on load.

### Feature 2 — Button Interaction
- [ ] Clicking the interaction button updates the target text.
- [ ] Event is attached via `addEventListener`, not inline attributes.

### Feature 3 — Inspirational Quote
- [ ] Clicking the **Inspire Me** button fetches a quote and displays both text and author.
- [ ] No blocking popups; no console errors.

### Feature 4 — Dammam Weather
- [ ] Weather button fetches current **temperature**, **humidity**, and **wind speed** for Dammam.
- [ ] You should use the given **Weather API URL**.
- [ ] Values display with appropriate units (°C, %, m/s).
- [ ] Errors are handled gracefully (a visible message if something goes wrong).

### General Quality
- [ ] Console is clean (no unhandled errors).
- [ ] UI is readable and consistent with the provided styles.