document.addEventListener('DOMContentLoaded', function () {
    const API_URL = "https://04es5s27rh.execute-api.eu-central-1.amazonaws.com/default/API_Get";

    // Initialiseer de modal van Materialize
    const modals = document.querySelectorAll('.modal');
    M.Modal.init(modals);

    // Functie om API-data op te halen
    async function fetchData() {
        try {
            const response = await fetch(API_URL);
            if (!response.ok) {
                throw new Error(`Fout bij API: ${response.status}`);
            }
            const data = await response.json();
            return data;
        } catch (error) {
            console.error("Fout bij het ophalen van data:", error);
            return [];
        }
    }

    // Functie om de tabel bij te werken
    async function updateTable() {
        const tableBody = document.getElementById('metingTable');
        tableBody.innerHTML = ""; // Reset inhoud

        const data = await fetchData();
        if (data.length > 0) {
            data.forEach(item => {
                const row = `
                    <tr>
                        <td>${item.stroming || 'Onbekend'}</td>
                        <td>${item.pH || 'N/A'}</td>
                        <td>${item.temperatuur || 'N/A'} °C</td>
                        <td>${item.zuurstof || 'N/A'} mg/L</td>
                        <td>${item.troebelheid || 'N/A'} NTU</td>
                    </tr>
                `;
                tableBody.insertAdjacentHTML('beforeend', row);
            });
        } else {
            const row = `<tr><td colspan="5">Geen gegevens beschikbaar</td></tr>`;
            tableBody.insertAdjacentHTML('beforeend', row);
        }
    }

    // Update de tabel elke 5 seconden
    setInterval(updateTable, 5000);

    // Eerste update bij pagina laden
    updateTable();
});
