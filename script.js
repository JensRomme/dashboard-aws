document.addEventListener("DOMContentLoaded", function () {
    const API_URL = "https://g7yv4v6972.execute-api.eu-central-1.amazonaws.com/sensorWaarden";
    const WEBSOCKET_URL = "wss://ei4gjm3drk.execute-api.eu-central-1.amazonaws.com/Test/";

    let currentBuoyName = "";
    let websocket = null;
    let buoyList = []; // Opslag voor aangemaakte boeien

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

            // MaterializeCSS opnieuw initialiseren
            M.FormSelect.init(selects);
        }
    }

    // Formulier voor boei aanmaken
    const createBuoyForm = document.getElementById("createBuoyForm");
    createBuoyForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const buoyNameInput = document.getElementById("buoyName");
        const buoyName = buoyNameInput.value.trim();

        if (buoyName) {
            addBuoy(buoyName);

            // Sluit de modal
            const modal = M.Modal.getInstance(document.getElementById("changeModal"));
            modal.close();

            buoyNameInput.value = ""; // Inputveld leegmaken
        }
    });

    // Formulier voor boei selecteren
    const selectBuoyForm = document.getElementById("selectBuoyForm");
    selectBuoyForm.addEventListener("submit", function (event) {
        event.preventDefault();

        const buoySelector = document.getElementById("buoySelector");
        if (buoySelector) {
            currentBuoyName = buoySelector.value;
            console.log(`Boei geselecteerd: ${currentBuoyName}`);
            resetTableAndFetchData(); // Tabel resetten en nieuwe data ophalen
        }

        const modal = M.Modal.getInstance(document.getElementById("selectModal"));
        modal.close();
    });

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
        tableBody.innerHTML = ""; // Wis de tabel

        data.forEach((item) => {
            const row = `
                <tr>
                    <td>${item.turbidity || "N/A"}</td>
                    <td>${item.pH || "N/A"}</td>
                    <td>${item.temperature || "N/A"}</td>
                    <td>${item.oxygen || "N/A"}</td>
                    <td>${new Date(item.Time).toLocaleString() || "N/A"}</td>
                    <td>${item.quality || "Onbekend"}</td>
                </tr>
            `;
            tableBody.insertAdjacentHTML("beforeend", row);
        });
    }

    // Functie om tabel te resetten en data opnieuw op te halen
    function resetTableAndFetchData() {
        const tableBody = document.getElementById("metingTable");
        if (tableBody) {
            tableBody.innerHTML = ""; // Wis de tabel
        }
        fetchData(); // Haal nieuwe gegevens op
    }

    // WebSocket verbinding
    function connectWebSocket() {
        websocket = new WebSocket(WEBSOCKET_URL);
        websocket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            updateTable(data);
        };
    }

    connectWebSocket();
});
