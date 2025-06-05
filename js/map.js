
const map = L.map('map', {
    gestureHandling: true
}).setView([39.8376017, -4.3978819], 5);

L.tileLayer.provider('CartoDB.Voyager').addTo(map);

const markers = [];

let popup = null;

const f = {
    type: 'Tipo de acción',
    date: 'Fecha de la acción',
    time: 'Hora',
    duration: 'Duración (en horas)',
    address: 'Dirección (calle, número y código postal. Ejemplo: Centro Cultural Gloria Fuertes, C/ Pío Baroja, 72, 28003)',
    locality: 'Municipio',
    coordinates: 'Coordenadas de Google Maps (haz click derecho sobre el lugar del mapa):',
    ref: 'ref',
};

const parseDate = (dateStr) => {
    const parts = dateStr.split('/');
    if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; // Months are zero-based in JS
        const year = parseInt(parts[2], 10);
        return new Date(year, month, day);
    }
    return null;
}

const parseTime = (timeStr) => {
    const parts = timeStr.split(':');
    if (parts.length === 3) {
        const hours = parseInt(parts[0], 10);
        const minutes = parseInt(parts[1], 10);
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }
    return null;
}

const requiredFields = Object.values(f);

d3.csv("data/acciones.csv", (data) => {
    for (const field of requiredFields) {
        if (!(field in data)) {
            console.error(`Missing required field: ${field}`);
            return;
        }
    }
    const date = parseDate(data[f.date]);
    if (!(date instanceof Date) || isNaN(date)) {
        console.error(`Invalid date format: ${data[f.date]} for entry`, data);
        return;
    }
    const time = parseTime(data[f.time]);
    if (!time) {
        console.error(`Invalid time format: ${data[f.time]} for entry`, data);
        return;
    }
    const datetime = new Date(date.getFullYear(), date.getMonth(), date.getDate(), ...time.split(':').map(Number));

    const coordinates = data[f.coordinates].split(',').map(coord => coord.trim());
    if (coordinates.length !== 2 || isNaN(coordinates[0]) || isNaN(coordinates[1])) {
        console.error(`Invalid coordinates format: ${data[f.coordinates]} for entry`, data);
        return;
    }

    const icon = L.icon({ iconUrl: `img/${data[f.type].split(' ')[0]}.png`, iconAnchor: [12.5, 41] });
    const popupClaim = data[f.type] ? `<span class="title">${data[f.type]}</span>` : '';
    const popupAddress = `<span class="address">${data[f.address]}, ${data[f.locality]}</span>`;
    const popupDate = isNaN(datetime)
        ? '<span class="date grey"></span>'
        : `<span class="date">${datetime.getUTCDate()}.${datetime.getUTCMonth()+1}.${datetime.getFullYear()} - ${datetime.toLocaleTimeString()}</span>`;
    const popupDuration = data[f.duration] ? `<span class="date">Duración: ${data[f.duration]} horas</span>` : '';
    const popupButton = `<a href="https://actionnetwork.org/forms/unete-accion-reduccion-jornada-laboral?ref=${data[f.ref]}&source=${data[f.ref]}" target="_blank"><button>Unirme a esta acción</button></a>`;        
    const marker = L.marker([+coordinates[0], +coordinates[1]], { icon });
    marker.addTo(map);
    marker.bindPopup(`${popupClaim}${popupAddress}${popupDate}${popupDuration}${popupButton}`);
    markers.push(marker);
});
