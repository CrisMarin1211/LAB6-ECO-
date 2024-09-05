// Establecer conexión al servidor
const socket = io('http://localhost:5050', {
	path: '/real-time',
});

// Manejo del inicio de sesión del pasajero
const formularioLogin = document.getElementById('form-login');
const seccionLogin = document.getElementById('login');
const seccionViaje = document.getElementById('viaje');

formularioLogin.addEventListener('submit', (event) => {
	event.preventDefault();
	const nombrePasajeroInput = document.getElementById('name');
	socket.emit('Client:Login', {
		nombre: nombrePasajeroInput.value,
		role: 'passenger',
	});

	localStorage.setItem('nombreUsuario', nombrePasajeroInput.value);
	alert('Has iniciado sesión correctamente.');
	seccionLogin.style.display = 'none';
	nombrePasajeroInput.value = '';
	seccionViaje.style.display = 'block';
});

const contenedorConductores = document.getElementById('drivers');

socket.on('Server:UpdateActiveCars', (conductoresActivos) => {
	contenedorConductores.innerHTML = '';
	if (conductoresActivos.length === 0) {
		contenedorConductores.innerHTML = 'No hay conductores disponibles en este momento.';
	} else {
		conductoresActivos.forEach((conductor) => {
			const itemConductor = document.createElement('div');
			itemConductor.classList.add('conductor-item');
			itemConductor.textContent = `${conductor.driverName} - ${conductor.plate}`;
			contenedorConductores.appendChild(itemConductor);
		});
	}
});

// Solicitar un viaje
const formularioViaje = document.getElementById('form-viaje');
const estadoViaje = document.getElementById('viaje-status');

formularioViaje.addEventListener('submit', (event) => {
	event.preventDefault();
	const puntoOrigen = document.getElementById('origen');
	const puntoDestino = document.getElementById('destino');
	const nombrePasajero = localStorage.getItem('nombreUsuario');

	socket.emit('Client:NewTrip', {
		origen: puntoOrigen.value,
		destino: puntoDestino.value,
		nombrePasajero: nombrePasajero,
	});

	formularioViaje.style.display = 'none';
	puntoOrigen.value = '';
	puntoDestino.value = '';
	estadoViaje.innerHTML = 'Buscando un conductor disponible para ti...';
});

// Manejar la aceptación del viaje
const seccionInicioViaje = document.getElementById('inicio-viaje');
const mensajeInicioViaje = document.getElementById('iniciar-viaje');

socket.on('Server:TripAccepted', ({ message, tripId }) => {
	seccionViaje.style.display = 'none';
	seccionInicioViaje.style.display = 'block';
	mensajeInicioViaje.innerHTML = 'Esperando que el conductor inicie tu viaje...';
	alert(message);
});

// Información del viaje en progreso
const infoViaje = document.getElementById('info-viaje');

socket.on('Server:TripStarted', ({ message, dataTrip }) => {
	mensajeInicioViaje.innerHTML = message;
	alert('El viaje ha comenzado. Por favor, usa el cinturón de seguridad.');
	infoViaje.innerHTML = `
			<p>Conductor: ${dataTrip.driver} - Vehículo: ${dataTrip.plate}</p>
			<p>Desde: ${dataTrip.origen}</p>
			<p>Hasta: ${dataTrip.destino}</p>
			<p>Estado: ${dataTrip.status}</p>
	`;
});

// Manejar la finalización del viaje
socket.on('Server:TripFinished', ({ message, dataTrip }) => {
	mensajeInicioViaje.innerHTML = message;
	alert('El viaje ha terminado. ¡Gracias por usar nuestro servicio!');
	infoViaje.innerHTML = '';

	seccionInicioViaje.style.display = 'none';
	seccionViaje.style.display = 'block';
	formularioViaje.style.display = 'block';
});
