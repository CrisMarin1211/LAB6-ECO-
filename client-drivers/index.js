const socket = io('http://localhost:5050', {
	path: '/real-time',
});

// Elementos del DOM
const divLogin = document.getElementById('login');
const divCarSelection = document.getElementById('car');
const formLogin = document.getElementById('formlogin');

formLogin.addEventListener('submit', (event) => {
	event.preventDefault();
	const driverNameInput = document.getElementById('driver-name');
	socket.emit('Client:Login', {
		driverName: driverNameInput.value,
		role: 'driver',
	});
	localStorage.setItem('driverName', driverNameInput.value);
	alert('Inicio de sesión exitoso');
	divLogin.style.display = 'none';
	driverNameInput.value = '';
	divCarSelection.style.display = 'block';
});

const divCarStatus = document.getElementById('vehicle-status');
const h1CarStatus = document.getElementById('h1-vehicle-status');
const formVehicle = document.getElementById('formvehicle');

formVehicle.addEventListener('submit', (event) => {
	event.preventDefault();
	const plate = document.getElementById('placa');
	const driverName = localStorage.getItem('driverName');
	socket.emit('Client:NewCar', {
		plate: plate.value,
		driverName: driverName,
	});
	alert('Vehículo registrado exitosamente');
	divCarSelection.style.display = 'none';
	plate.value = '';
	divCarStatus.style.display = 'block';
	h1CarStatus.innerHTML = `Vehículo ${plate.value} en línea`;
});

const btnDeactivateVehicle = document.getElementById('bt-inactivo');
const pCarStatus = document.getElementById('status-vehicle');

btnDeactivateVehicle.addEventListener('click', () => {
	socket.emit('Client:DeleteCar', socket.id);
	alert('Vehículo desactivado exitosamente');
	divCarStatus.style.display = 'none';
	pCarStatus.innerHTML = '';
	divCarSelection.style.display = 'block';
});

const btnActivateVehicle = document.getElementById('bt-activo');
const divNewTrip = document.getElementById('nueva-ruta');

btnActivateVehicle.addEventListener('click', () => {
	socket.emit('Client:ActiveCar', socket.id);
	pCarStatus.innerHTML = 'Esperando nuevos viajes...';
	divCarStatus.style.display = 'none';
	divNewTrip.style.display = 'block';
});

const tripsContainer = document.getElementById('viajes');
const divOngoingTrip = document.getElementById('inicia-viaje');
const divTripInfo = document.getElementById('informacion-viaje');

socket.on('Server:UpdateTrips', (trips) => {
	tripsContainer.innerHTML = '';
	if (trips.length === 0) {
		tripsContainer.innerHTML = 'No hay viajes disponibles';
	} else {
		trips.forEach((trip) => {
			const tripElement = document.createElement('div');
			tripElement.classList.add('trip-item');
			tripElement.innerHTML = `
							<p>Pasajero: ${trip.nombrePasajero}</p>
							<p>Origen: ${trip.origen}</p>
							<p>Destino: ${trip.destino}</p>
							<button class="accept-trip">Aceptar Viaje</button>
					`;
			const acceptButton = tripElement.querySelector('.accept-trip');
			const driverName = localStorage.getItem('driverName');
			acceptButton.addEventListener('click', () => {
				socket.emit('Client:AcceptTrip', {
					passanger: trip.socketId,
					driver: driverName,
					socketIdDriver: socket.id,
				});
				alert(`Aceptaste el viaje de ${trip.nombrePasajero}`);
				divNewTrip.style.display = 'none';
				divTripInfo.innerHTML = `
									<p>Pasajero: ${trip.nombrePasajero}</p>
									<p>Origen: ${trip.origen}</p>
									<p>Destino: ${trip.destino}</p>
							`;
				divOngoingTrip.style.display = 'block';
				const btnStartTrip = document.getElementById('button-iniciar-viaje');
				const btnEndTrip = document.getElementById('button-finalizar-viaje');
				btnStartTrip.addEventListener('click', () => {
					startTrip(trip.socketId);
					btnStartTrip.style.display = 'none';
					btnEndTrip.style.display = 'block';
				});
				btnEndTrip.addEventListener('click', () => {
					endTrip(trip.socketId);
					btnEndTrip.style.display = 'none';
					const pInitTrip = document.getElementById('inicializar-viaje');
					pInitTrip.innerHTML = 'Viaje finalizado';
				});
			});
			tripsContainer.appendChild(tripElement);
		});
	}
});

function startTrip(passangerSocketId) {
	socket.emit('Client:InitTrip', {
		passanger: passangerSocketId,
	});
}

function endTrip(passangerSocketId) {
	socket.emit('Client:FinishTrip', {
		passanger: passangerSocketId,
	});
}
