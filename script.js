document.addEventListener("DOMContentLoaded", function () {
    const API_URL = "https://g7yv4v6972.execute-api.eu-central-1.amazonaws.com/sensorWaarden";
    const WEBSOCKET_URL = "wss://ei4gjm3drk.execute-api.eu-central-1.amazonaws.com/Test/";
    const POST_API_URL = "https://g7yv4v6972.execute-api.eu-central-1.amazonaws.com/RDS_POST";
    const API_KEY = "AvansGroep7Wachtwoord343";

    let currentBuoyName = "";
    let buoyList = [];

    // MaterializeCSS initialisaties
    const modals = document.querySelectorAll(".modal");
    M.Modal.init(modals);

    const selects = document.querySelectorAll("select");
    M.FormSelect.init(selects);

    // Functie om een nieuwe boei toe te voegen
    function addBuoy(buoyName) {
        if (!buoyList.includes(buoyName)) {
            buoyList.push(buoyName);
            const buoySelector = document.getElementById("buoySelector");
            if (buoySelector) {
                const option = document.createElement("option");
                option.value = buoyName;
                option.textContent = buoyName;
                buoySelector.appendChild(option);
            }
            M.FormSelect.init(selects);
        }
    }

    // Formulier voor boei aanmaken
    const createBuoyForm = document.getElementById("createBuoyForm");
    if (createBuoyForm) {
        createBuoyForm.addEventListener("submit", function (event) {
            event.preventDefault();
            const buoyNameInput = document.getElementById("buoyName");
            const buoyName = buoyNameInput.value.trim();
            if (buoyName) {
                addBuoy(buoyName);
                const modal = M.Modal.getInstance(document.getElementById("changeModal"));
                if (modal) modal.close();
                buoyNameInput.value = "";
            }
        });
    }

    // Formulier voor boei selecteren
    const selectBuoyForm = document.getElementById("selectBuoyForm");
    if (selectBuoyForm) {
        selectBuoyForm.addEventListener("submit", function (event) {
            event.preventDefault();
            const buoySelector = document.getElementById("buoySelector");
            if (buoySelector) {
                currentBuoyName = buoySelector.value;
                console.log(`Boei geselecteerd: ${currentBuoyName}`);
                resetTableAndFetchData();
            }
            const modal = M.Modal.getInstance(document.getElementById("selectModal"));
            if (modal) modal.close();
        });
    }

    // Functie om gegevens op te halen
    async function fetchData() {
        try {
            console.log(`Ophalen van data voor boei: ${currentBuoyName}`);
            const response = await fetch(`${API_URL}?buoy=${encodeURIComponent(currentBuoyName)}`);
            if (!response.ok) {
                throw new Error(`Fout: ${response.status}`);
            }
            const data = await response.json();
            updateTable(data);
        } catch (error) {
            console.error("Fout bij ophalen gegevens:", error);
        }
    }

    // Functie om de tabel bij te werken
    function updateTable(data) {
        const tableBody = document.getElementById("metingTable");
        if (!tableBody) return;
        tableBody.innerHTML = "";
        data.forEach((item) => {
            const pH = item.pH;
            const oxygen = item.oxygen;
            const turbidity = item.turbidity;
            let waterQuality = "Goed";
            let waterQualityColor = "background-color: lightgreen;";
            const messages = [];

            if (pH < 6.0 || pH > 9.0) {
                waterQuality = "Slecht";
                waterQualityColor = "background-color: lightcoral;";
                messages.push(`pH-waarde is ${pH} (acceptabele range: 6.0 - 9.0)`);
            }
            if (oxygen < 5 || oxygen > 11) {
                waterQuality = "Slecht";
                waterQualityColor = "background-color: lightcoral;";
                messages.push(`Zuurstofgehalte is ${oxygen} mg/L (acceptabele range: 5 - 11 mg/L)`);
            }
            if (turbidity > 25) {
                waterQuality = "Slecht";
                waterQualityColor = "background-color: lightcoral;";
                messages.push(`Troebelheid is ${turbidity} NTU (acceptabel niveau: ≤25 NTU)`);
            }

            const row = `
                <tr>
                    <td>${turbidity !== undefined ? turbidity : "N/A"}</td>
                    <td>${pH !== undefined ? pH : "N/A"}</td>
                    <td>${item.temperature !== undefined ? item.temperature : "N/A"}</td>
                    <td>${oxygen !== undefined ? oxygen : "N/A"}</td>
                    <td>${item.Time ? new Date(item.Time).toLocaleString() : "N/A"}</td>
                    <td style="${waterQualityColor}">${waterQuality}</td>
                </tr>
            `;
            tableBody.insertAdjacentHTML("beforeend", row);

            if (messages.length > 0) {
                console.log("Waterkwaliteit waarschuwingen:", messages.join("; "));
            }
        });
    }

    function resetTableAndFetchData() {
        const tableBody = document.getElementById("metingTable");
        if (tableBody) tableBody.innerHTML = "";
        fetchData();
    }

    function connectWebSocket() {
        const websocket = new WebSocket(WEBSOCKET_URL);
        websocket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                updateTable(data);
            } catch (error) {
                console.error("WebSocket data parsing fout:", error);
            }
        };
        websocket.onerror = (error) => console.error("WebSocket fout:", error);
    }

    connectWebSocket();

    const historyButton = document.querySelector(".history-button");
    if (historyButton) {
        historyButton.addEventListener("click", async function () {
            if (!currentBuoyName) {
                alert("Selecteer eerst een boei om de gegevens op te slaan.");
                return;
            }
            try {
                const payload = {
                    headers: {
                        "x-api-key": API_KEY
                    },
                    body: JSON.stringify({
                        table_name: "Boei",
                        data: {
                            deveui: currentBuoyName,
                            eigenaar: "Eigenaar Naam",
                            heeft_gps: true
                        }
                    })
                };
                const response = await fetch(POST_API_URL, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "x-api-key": API_KEY
                    },
                    body: payload.body
                });
                if (!response.ok) {
                    throw new Error(`Fout bij opslaan: ${response.status}`);
                }
                const result = await response.json();
                console.log("Opslagresultaat:", result);
                fetchHistory();
            } catch (error) {
                console.error("Fout bij het opslaan van gegevens:", error);
                alert("Er is een fout opgetreden bij het opslaan van de gegevens.");
            }
        });
    }

    async function fetchHistory() {
        try {
            console.log("Geschiedenis ophalen...");
            const response = await fetch(`${API_URL}?table_name=Boei`);
            if (!response.ok) {
                throw new Error(`Fout bij ophalen geschiedenis: ${response.status}`);
            }
            const data = await response.json();
            updateHistoryTable(data);
        } catch (error) {
            console.error("Fout bij ophalen geschiedenis:", error);
        }
    }

    function updateHistoryTable(data) {
        const historyTableBody = document.getElementById("historyTable");
        if (!historyTableBody) {
            console.error("Error: historyTableBody bestaat niet in de DOM.");
            return;
        }
        historyTableBody.innerHTML = "";
        data.forEach((item) => {
            const row = `
                <tr>
                    <td>${item.deveui || "N/A"}</td>
                    <td>${item.eigenaar || "N/A"}</td>
                    <td>${item.heeft_gps ? "Ja" : "Nee"}</td>
                    <td>${item.productnummer || "N/A"}</td>
                    <td>${item.pin_type || "N/A"}</td>
                    <td>${item.pin_nummer || "N/A"}</td>
                    <td>${item.naam || "N/A"}</td>
                    <td>${item.meet_waarden || "N/A"}</td>
                </tr>
            `;
            historyTableBody.insertAdjacentHTML("beforeend", row);
        });
    }

    const dataTabButton = document.querySelector(".data-tab-button");
    if (dataTabButton) {
        dataTabButton.addEventListener("click", async function () {
            try {
                console.log("Data tab openen en gegevens ophalen...");
                const response = await fetch(`${API_URL}?table_name=Boei`);
                if (!response.ok) {
                    throw new Error(`Fout bij ophalen data tab gegevens: ${response.status}`);
                }
                const data = await response.json();
                updateDataTab(data);
            } catch (error) {
                console.error("Fout bij ophalen gegevens voor data tab:", error);
            }
        });
    }

    function updateDataTab(data) {
        const dataTabBody = document.getElementById("dataTabTable");
        if (!dataTabBody) {
            console.error("Error: dataTabTable bestaat niet in de DOM.");
            return;
        }
        dataTabBody.innerHTML = "";
        data.forEach((item) => {
            const row = `
                <tr>
                    <td>${item.deveui || "N/A"}</td>
                    <td>${item.eigenaar || "N/A"}</td>
                    <td>${item.heeft_gps ? "Ja" : "Nee"}</td>
                    <td>${item.productnummer || "N/A"}</td>
                    <td>${item.pin_type || "N/A"}</td>
                    <td>${item.pin_nummer || "N/A"}</td>
                    <td>${item.naam || "N/A"}</td>
                    <td>${item.meet_waarden || "N/A"}</td>
                </tr>
            `;
            dataTabBody.insertAdjacentHTML("beforeend", row);
        });
    }
});
