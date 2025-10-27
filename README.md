README.md — Money Management Website

MoneyMan — a simple, responsive money-management web app built with HTML, CSS, and JavaScript.
Tracks income, expenses, categories, and shows a running balance and simple charts (no backend — data stored in browser localStorage).

Table of contents

Demo

Features

Tech stack

Getting started

Folder structure

Usage

Data & storage

Customisation

Testing & linting

Deployment

Contributing

License

Demo

Include screenshots or a live link here (e.g. GitHub Pages).
https://username.github.io/moneyman (replace with your actual URL)

Features

Add / edit / delete transactions (income & expense)

Categorise transactions (e.g., Salary, Food, Transport, Bills)

Filter by date / category / type

Running balance and totals (income, expenses)

Simple visualisation (pie or bar chart) using a lightweight JS chart (or hand-coded SVG/Canvas)

Responsive layout for desktop & mobile

Persistent data with localStorage

Input validation and user-friendly UI

Tech stack

HTML5 (semantic markup)

CSS3 (responsive layout, Flexbox/Grid; optional: CSS variables)

JavaScript (ES6+) (DOM, localStorage, modules if desired)

Optional libraries:

Charting: Chart.js or a lightweight chart helper (or custom Canvas/SVG)

Icons: Font Awesome or inline SVGs

Getting started
Prerequisites

No build tools required — the app runs in any modern browser. If you choose to use modules or a bundler, install Node.js.

Quick run (no build)

Clone the repo:

git clone https://github.com/<your-username>/moneyman.git
cd moneyman


Open index.html in a browser.

Run with a simple local server (recommended for modules / fetch)
# using Python 3
python -m http.server 5500
# then open http://localhost:5500

Folder structure
moneyman/
├─ index.html
├─ README.md
├─ assets/
│  ├─ css/
│  │  └─ styles.css
│  ├─ js/
│  │  ├─ app.js
│  │  ├─ storage.js
│  │  ├─ ui.js
│  │  └─ charts.js
│  └─ images/
├─ data/
│  └─ sample-data.json
└─ LICENSE

Usage (user flow)

Open the app and create your first category (optional — defaults provided).

Click Add Transaction and enter:

Title/description

Amount (positive number)

Type: Income / Expense

Category

Date

Submit — the transaction appears in the list, totals update, and the chart refreshes.

Edit or delete transactions using the inline controls.

Use filters to view a date range or specific categories.
