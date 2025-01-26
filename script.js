document.addEventListener("DOMContentLoaded", function () {
    const API_URL = "https://g7yv4v6972.execute-api.eu-central-1.amazonaws.com/sensorWaarden";
    const POST_API_URL = "https://g7yv4v6972.execute-api.eu-central-1.amazonaws.com/RDS_POST";
    const WEBSOCKET_URL = "wss://ei4gjm3drk.execute-api.eu-central-1.amazonaws.com/Test/";
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

    // Dynamisch aanpassen van formulier velden op basis van geselecteerde tabel
    const tableSelector = document.getElementById("tableSelector");
    if (tableSelector) {
        tableSelector.addEventListener("change", function () {
            const selectedTable = tableSelector.value;

            // Verberg alle inputvelden
            document.querySelectorAll(".dynamic-input").forEach((input) => {
                input.style.display = "none";
            });

            // Toon specifieke inputvelden voor de geselecteerde tabel
            if (selectedTable === "Boei") {
                document.getElementById("ownerNameField").style.display = "block";
                document.getElementById("hasGPSField").style.display = "block";
            } else if (selectedTable === "BoeiSensor") {
                document.getElementById("productNumberField").style.display = "block";
                document.getElementById("pinTypeField").style.display = "block";
                document.getElementById("pinNumberField").style.display = "block";
            } else if (selectedTable === "Sensor") {
                document.getElementById("productNumberField").style.display = "block";
                document.getElementById("sensorNameField").style.display = "block";
                document.getElementById("measurementValueField").style.display = "block";
            }
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
            const timestamp = item.time || "N/A"; // Gebruik het veld 'time' vanuit de API-respons
    
            let waterQuality = "Goed";
            let waterQualityColor = "background-color: lightgreen;";
            const messages = [];
    
            if (pH < 6.0 || pH > 9.0) {
                waterQuality = "Slecht";
                waterQualityColor = "background-color: lightcoral;";
               // messages.push(`pH-waarde is ${pH} (acceptabele range: 6.0 - 9.0)`); 
            }
            if (oxygen < 5 || oxygen > 11) {
                waterQuality = "Slecht";
                waterQualityColor = "background-color: lightcoral;";
                //messages.push(`Zuurstofgehalte is ${oxygen} mg/L (acceptabele range: 5 - 11 mg/L)`);
            }
            if (turbidity > 25) {
                waterQuality = "Slecht";
                waterQualityColor = "background-color: lightcoral;";
                //messages.push(`Troebelheid is ${turbidity} NTU (acceptabel niveau: ≤25 NTU)`);
            }
    
            // Format de tijd naar een leesbaar formaat
            const formattedTime = timestamp !== "N/A" ? new Date(timestamp).toLocaleString() : "N/A";
    
            const row = `
                <tr>
                    <td>${turbidity !== undefined ? turbidity : "N/A"}</td>
                    <td>${pH !== undefined ? pH : "N/A"}</td>
                    <td>${item.temperature !== undefined ? item.temperature : "N/A"}</td>
                    <td>${oxygen !== undefined ? oxygen : "N/A"}</td>
                    <td>${formattedTime}</td>
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

    // Functie om productnummer te valideren
    async function validateProductNumber(productNumber) {
        try {
            const response = await fetch(`${API_URL}?table_name=Sensor&productnummer=${encodeURIComponent(productNumber)}`);
            if (!response.ok) {
                return false;
            }
            const data = await response.json();
            return data.length > 0;
        } catch (error) {
            console.error("Fout bij validatie van productnummer:", error);
            return false;
        }
    }

    // Event listener voor Opslaan Formulier
    const saveDataForm = document.getElementById("saveDataForm");
    if (saveDataForm) {
        saveDataForm.addEventListener("submit", async function (event) {
            event.preventDefault();

            const selectedTable = document.getElementById("tableSelector").value;
            let payloadData = {};

            if (selectedTable === "Boei") {
                payloadData = {
                    table_name: "Boei",
                    data: {
                        deveui: currentBuoyName,
                        eigenaar: document.getElementById("ownerName").value.trim(),
                        heeft_gps: document.getElementById("hasGPS").value === "true"
                    }
                };
            } else if (selectedTable === "BoeiSensor") {
                const productnummer = document.getElementById("productNumber").value.trim();

                // Valideer productnummer
                const isValid = await validateProductNumber(productnummer);
                if (!isValid) {
                    alert("Het ingevoerde productnummer bestaat niet in de Sensor-tabel.");
                    return;
                }

                payloadData = {
                    table_name: "BoeiSensor",
                    data: {
                        deveui: currentBuoyName,
                        productnummer: productnummer,
                        pin_type: document.getElementById("pinType").value.trim(),
                        pin_nummer: document.getElementById("pinNumber").value.trim()
                    }
                };
            } else if (selectedTable === "Sensor") {
                payloadData = {
                    table_name: "Sensor",
                    data: {
                        productnummer: document.getElementById("productNumber").value.trim(),
                        naam: document.getElementById("sensorName").value.trim(),
                        meet_waarden: document.getElementById("measurementValue").value.trim()
                    }
                };
            }

            try {
                console.log("Verzonden payload:", JSON.stringify(payloadData));
                const response = await fetch(POST_API_URL, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "x-api-key": API_KEY
                    },
                    body: JSON.stringify(payloadData)
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`Fout bij opslaan: ${response.status}, ${errorText}`);
                }

                alert("Gegevens succesvol opgeslagen!");
                saveDataForm.reset();
                document.querySelectorAll(".dynamic-input").forEach((input) => {
                    input.style.display = "none";
                });
            } catch (error) {
                console.error("Fout bij opslaan:", error.message);
                alert("Er is een fout opgetreden bij het opslaan van de gegevens.");
            }
        });
    }

    connectWebSocket();
});
