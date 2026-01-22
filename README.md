# HN_TERMINAL

A high-performance, cyberpunk-inspired **Hacker News reader** built for power users. It features a distraction-free terminal interface, automatic content classification, and local bookmarking persistence.

## ⚡ Features

### Core Experience

* **Terminal Aesthetic:** A dark, monospaced UI designed for high information density and readability.
* **Smart Classification:** An internal regex engine automatically tags stories with categories like `#AI`, `#DEV`, `#SEC`, `#SCI`, and `#BIZ` based on the title.
* **Live Dashboard:** Auto-refresh intervals (30s, 1m, 5m) to keep the feed alive on a second monitor.

### Power Tools

* **Local Persistence (IndexedDB):** Save stories to a local "Read Later" list. Bookmarks include a **deadline system** (3 days) to encourage reading.
* **Read Status Tracking:** visual indicators for stories you have already read.
* **User Intelligence:** Hover over any username to instantly fetch their Karma, Account Age, and Bio without leaving the page.
* **Advanced Sorting:** Sort feeds by Rank, Time, Popularity (Score), or Discussion level (Comment count).

### Reader View

* **Threaded Comments:** Deeply nested comment visualization with collapsible threads and syntax highlighting support for code blocks.
* **Distraction Free:** Reading mode that focuses purely on the content.

## 🛠️ Tech Stack

* **Framework:** React 18 + Vite
* **Styling:** Tailwind CSS v4 + PostCSS
* **Icons:** Lucide React
* **State/Storage:** React Hooks + IndexedDB API
* **API:** Official Hacker News Firebase API

## 🚀 Getting Started

### Prerequisites

* Node.js (v18 or higher)
* npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/matiaslopezd/hn-terminal.git
cd hn-terminal

```


2. **Install dependencies**
```bash
npm install

```


3. **Run the development server**
```bash
npm run dev

```


4. Open your browser at `http://localhost:5173`

## 📂 Project Structure

```text
src/
├── api.js           # Hacker News API wrapper
├── bookmark.js      # IndexedDB wrapper for local persistence
├── utils.js         # Helper functions (TimeAgo, ClassifyStory)
├── styles.css       # Tailwind directives and custom scrollbars
└── main.jsx         # Main application logic and components

```

## ⚙️ Configuration

You can customize the **Classification Engine** in `utils.js` (or within the main component logic) by modifying the `CATEGORY_RULES` object:

```javascript
const CATEGORY_RULES = {
  DEV: [/rust/, /python/, /javascript/, ...],
  AI: [/llm/, /gpt/, /transformer/, ...],
  // Add your own custom regex rules here
};

```

## ⌨️ Shortcuts & Interaction

* **Click Title:** Opens the story details view (or external link, depending on settings).
* **Click Domain:** Opens the external link directly.
* **Hover User:** Shows user stats popup.
* **Save Button:** Toggles bookmark status.

## 🤝 Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## 📄 License

[MIT](https://choosealicense.com/licenses/mit/)