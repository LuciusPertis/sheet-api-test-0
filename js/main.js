// Ensure config is loaded
if (typeof AppConfig === 'undefined') {
    console.error("Config file not loaded!");
}

const scriptUrl = AppConfig.scriptUrl;

// --- 1. POST (Write) Functionality ---
document.getElementById('btnSubmit').addEventListener('click', () => {
    const nameVal = document.getElementById('inputName').value;
    const roleVal = document.getElementById('inputRole').value;
    const btn = document.getElementById('btnSubmit');

    if(!nameVal || !roleVal) {
        alert("Please fill in all fields");
        return;
    }

    // UI Feedback
    btn.textContent = "Sending...";
    btn.disabled = true;

    // We use 'no-cors' mode usually? NO.
    // For Google Apps Script, we must follow redirects.
    // We send data as a Stringified JSON inside a text/plain body 
    // to prevent the browser from sending an OPTIONS preflight request which GAS hates.
    fetch(scriptUrl, {
        method: 'POST',
        body: JSON.stringify({ name: nameVal, role: roleVal }),
    })
    .then(response => response.json())
    .then(data => {
        console.log("Success:", data);
        alert("Data Saved!");
        // Clear inputs
        document.getElementById('inputName').value = '';
        document.getElementById('inputRole').value = '';
        // Refresh the table
        fetchData();
    })
    .catch(error => {
        console.error('Error:', error);
        alert("Connection Failed. Check Console.");
    })
    .finally(() => {
        btn.textContent = "Send to Sheet";
        btn.disabled = false;
    });
});

// --- 2. GET (Read) Functionality ---
function fetchData() {
    const display = document.getElementById('data-display');
    display.innerHTML = "Fetching...";

    fetch(scriptUrl)
    .then(res => res.json())
    .then(dataObj => {
        if(dataObj.status !== 'success') throw new Error(dataObj.error);

        const rows = dataObj.data;
        
        // Build Table HTML
        let html = '<table>';
        rows.forEach((row, index) => {
            html += '<tr>';
            // Use TH for the first row (headers)
            const tag = index === 0 ? 'th' : 'td';
            row.forEach(cell => {
                html += `<${tag}>${cell}</${tag}>`;
            });
            html += '</tr>';
        });
        html += '</table>';

        display.innerHTML = html;
    })
    .catch(err => {
        console.error(err);
        display.innerHTML = "Error loading data.";
    });
}

// Attach listener to refresh button
document.getElementById('btnRefresh').addEventListener('click', fetchData);

// Initial Load
fetchData();