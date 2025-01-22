document.addEventListener('DOMContentLoaded', function () {
    const API_URL = "https://g7yv4v6972.execute-api.eu-central-1.amazonaws.com/sensorWaarden";

    // Functie om gegevens van de API op te halen
    async function fetchData() {
        const loadingIndicator = document.getElementById('loadingIndicator');
        if (loadingIndicator) {
            loadingIndicator.style.display = 'block';
        }

        try {
            console.log('Start API aanroep...');
            const response = await fetch(API_URL, {
                headers: {
                    'Accept': 'application/json',
                }
            });

            console.log('Response status:', response.status);
            console.log('Response headers:', response.headers);

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Ontvangen data:', data);

            if (!Array.isArray(data)) {
                console.error('Ontvangen data is geen array:', data);
                return;
            }

            updateTable(data);
        } catch (error) {
            console.error('Fout bij het ophalen van gegevens:', error);

            // Controleer of de tabel bestaat voordat je de foutmelding toevoegt
            const tableBody = document.getElementById('metingTable');
            if (tableBody) {
                tableBody.innerHTML = `
                    <tr>
                        <td colspan="5">Er is een fout opgetreden bij het ophalen van de gegevens. Probeer het later opnieuw.</td>
                    </tr>
                `;
            }
        } finally {
            if (loadingIndicator) {
                loadingIndicator.style.display = 'none';
            }
        }
    }

    // Functie om de tabel bij te werken met de opgehaalde gegevens
    function updateTable(data) {
        const tableBody = document.getElementById('metingTable');
        if (!tableBody) {
            console.error('Element met ID "metingTable" niet gevonden.');
            return;
        }

        tableBody.innerHTML = ''; // Wis de huidige inhoud

        data.forEach(item => {
            const row = `
                <tr>
                    <td>${item.turbidity || 'N/A'}</td>
                    <td>${item.pH || 'N/A'}</td>
                    <td>${item.temperature || 'N/A'}</td>
                    <td>${item.oxygen || 'N/A'}</td>
                    <td>${item.time || 'N/A'}</td>
                </tr>
            `;
            tableBody.insertAdjacentHTML('beforeend', row);
        });
    }

    // Haal gegevens op bij het laden van de pagina
    fetchData();

    // Vernieuw de gegevens elke 100 seconden (interval was te groot voor 10 seconden, dus aangepast naar juiste waarde)
    setInterval(fetchData, 10000); // 10 seconden
});
