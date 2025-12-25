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

// ... existing logging functions ...

// Helper to get key
function getSecretKey() {
    return document.getElementById('inputKey').value;
}

// --- 1. POST (Write) ---
document.getElementById('btnSubmit').addEventListener('click', () => {
    const keyVal = getSecretKey();
    const nameVal = document.getElementById('inputName').value;
    const roleVal = document.getElementById('inputRole').value;
    
    if(!keyVal) {
        alert("Please enter the Secret Key first.");
        return;
    }

    // UI Elements
    
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
        // INCLUDE KEY IN THE BODY
        body: JSON.stringify({ 
            key: keyVal,   // <--- Sending the key
            name: nameVal, 
            role: roleVal 
        }), 
    })
    .then(response => response.json())
    .then(data => {
        logToScreen(`Server Response: ${JSON.stringify(data)}`);

        if(data.status === 'success') {
            logToScreen("Write Successful!");
            document.getElementById('inputName').value = '';
            document.getElementById('inputRole').value = '';
            fetchData(); 
        } else {
            // Handle Auth Error
            logToScreen(`Server Error: ${data.error}`, "error");
            if(data.error.includes("Invalid")) alert("Wrong Password!");
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
    const keyVal = getSecretKey();
    if(!keyVal) {
        document.getElementById('data-display').innerHTML = "<p>Enter Secret Key to load data.</p>";
        return;
    }
    const display = document.getElementById('data-display');

    logToScreen("Fetching data from Google Sheet...");

    const urlWithKey = `${scriptUrl}?key=${encodeURIComponent(keyVal)}`;
        

    fetch(urlWithKey)
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
        logToScreen(`Error: ${err}`, "error");
        document.getElementById('data-display').innerHTML = "<p>Auth Failed or Error.</p>";
    });
}

// We only load when the user clicks Refresh because they need to type the password first.
document.getElementById('btnRefresh').addEventListener('click', fetchData);
