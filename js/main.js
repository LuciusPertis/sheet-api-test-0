// --- HELPER: Debug Logger ---
function logToScreen(msg, type = 'info') {
    const logEl = document.getElementById('console-log');
    const time = new Date().toLocaleTimeString();
    const prefix = type === 'error' ? '❌ ERROR:' : 'ℹ️ INFO:';
    
    // Create new line
    const line = document.createElement('div');
    line.textContent = `[${time}] ${prefix} ${msg}`;
    
    if(type === 'error') line.style.color = '#ff4444'; // Red text for errors
    
    logEl.appendChild(line);
    
    // Auto-scroll to bottom
    logEl.scrollTop = logEl.scrollHeight;
    
    // Also log to browser console
    console.log(`[${time}] ${msg}`);
}

// Ensure config is loaded
if (typeof AppConfig === 'undefined') {
    logToScreen("Config file (js/config.js) not found!", "error");
} else {
    logToScreen("Config loaded. Script URL configured.");
}

const scriptUrl = AppConfig ? AppConfig.scriptUrl : "";

// --- 1. POST (Write) ---
document.getElementById('btnSubmit').addEventListener('click', () => {
    const nameVal = document.getElementById('inputName').value;
    const roleVal = document.getElementById('inputRole').value;
    const btn = document.getElementById('btnSubmit');

    if(!nameVal || !roleVal) {
        logToScreen("Input validation failed: Fields empty.", "error");
        alert("Please fill in all fields");
        return;
    }

    logToScreen(`Attempting to send data: ${nameVal}, ${roleVal}...`);
    btn.textContent = "Sending...";
    btn.disabled = true;

    fetch(scriptUrl, {
        method: 'POST',
        // IMPORTANT: sending as plain text to avoid CORS preflight OPTIONS request
        body: JSON.stringify({ name: nameVal, role: roleVal }), 
    })
    .then(response => response.json())
    .then(data => {
        logToScreen(`Server Response: ${JSON.stringify(data)}`);
        
        if(data.status === 'success') {
            logToScreen("Write Successful!");
            document.getElementById('inputName').value = '';
            document.getElementById('inputRole').value = '';
            fetchData(); // Auto refresh table
        } else {
            logToScreen(`Server Error: ${data.error}`, "error");
        }
    })
    .catch(error => {
        logToScreen(`Fetch Error: ${error}`, "error");
    })
    .finally(() => {
        btn.textContent = "Send to Sheet";
        btn.disabled = false;
    });
});

// --- 2. GET (Read) ---
function fetchData() {
    logToScreen("Fetching data from Google Sheet...");
    const display = document.getElementById('data-display');
    
    fetch(scriptUrl)
    .then(res => res.json())
    .then(dataObj => {
        if(dataObj.status !== 'success') {
            throw new Error(dataObj.error);
        }

        logToScreen(`Data received. Rows found: ${dataObj.data.length}`);
        
        const rows = dataObj.data;
        if(rows.length === 0) {
            display.innerHTML = "<p>No data found.</p>";
            return;
        }

        let html = '<table>';
        rows.forEach((row, index) => {
            html += '<tr>';
            const tag = index === 0 ? 'th' : 'td';
            row.forEach(cell => {
                // formatting dates if needed
                let text = cell;
                if(String(cell).includes("T") && String(cell).includes("Z")) {
                     text = new Date(cell).toLocaleString();
                }
                html += `<${tag}>${text}</${tag}>`;
            });
            html += '</tr>';
        });
        html += '</table>';

        display.innerHTML = html;
    })
    .catch(err => {
        logToScreen(`Read Error: ${err}`, "error");
        display.innerHTML = "<p style='color:red'>Error loading data.</p>";
    });
}

// Initial Load
document.getElementById('btnRefresh').addEventListener('click', fetchData);
fetchData();