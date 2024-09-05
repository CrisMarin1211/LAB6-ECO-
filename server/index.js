const express = require('express');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');

const app = express(); // Creates HTTP server
app.use(express.json()); // Utility to process JSON in requests
app.use(cors()); // Utility to allow clients to make requests from other hosts or IPs

const httpServer = createServer(app); // Explicitly creates an HTTP server from the Express app

const io = new Server(httpServer, {
	path: '/real-time',
	cors: {
		origin: '*', // Allow requests from any origin
	},
}); // Creates a WebSocket server, using the same HTTP server as the Express app and listening on the /real-time path

const db = {
	drivers: [],
	passengers: [],
	cars: [],
	trips: [],
};

function updateActiveCars() {
	const activeCars = db.cars.filter((car) => car.status === 'active');
	io.emit('Server:UpdateActiveCars', activeCars);
}

function updateTrips() {
	const trips = db.trips.filter(
		(trip) => trip.status !== 'active' && trip.status !== 'started' && trip.status !== 'finished'
	);
	io.emit('Server:UpdateTrips', trips);
}

io.on('connection', (socket) => {
	console.log('A user connected:', socket.id); // This will be printed every time a client connects

	socket.on('Client:Login', (data) => {
		const socketId = socket.id;
		if (data.role === 'driver') {
			db.drivers.push({
				...data,
				socketId,
			});
		} else {
			db.passengers.push({
				...data,
				socketId,
			});
		}
	});

	socket.on('Client:NewCar', (data) => {
		db.cars.push({
			...data,
			socketId: socket.id,
		});
		console.log(db.cars);
	});

	socket.on('Client:DeleteCar', (socketId) => {
		const car = db.cars.find((car) => car.socketId === socketId);
		if (car) {
			db.cars = db.cars.filter((car) => car.socketId !== socketId);
		}
		updateActiveCars();
	});

	socket.on('Client:ActiveCar', (socketId) => {
		const carIndex = db.cars.findIndex((car) => car.socketId === socketId);
		if (carIndex !== -1) {
			db.cars[carIndex] = {
				...db.cars[carIndex],
				status: 'active',
			};
		}
		updateActiveCars();
	});

	socket.emit(
		'Server:UpdateActiveCars',
		db.cars.filter((car) => car.status === 'active')
	);

	socket.on('Client:NewTrip', (data) => {
		db.trips.push({
			...data,
			socketId: socket.id,
		});
		updateTrips();
	});

	socket.emit(
		'Server:UpdateTrips',
		db.trips.filter((trip) => trip.status !== 'accepted' && trip.status !== 'started' && trip.status !== 'finished')
	);

	socket.on('Client:AcceptTrip', ({ passenger, driver, socketIdDriver }) => {
		const tripIndex = db.trips.findIndex((trip) => trip.socketId === passenger);
		if (tripIndex !== -1) {
			const carPlate = db.cars.find((car) => car.socketId === socketIdDriver);
			console.log(carPlate);
			db.trips[tripIndex] = {
				...db.trips[tripIndex],
				status: 'accepted',
				socketIdDriver: socketIdDriver,
				driver: driver,
				plate: carPlate.plate,
			};
		}
		io.to(passenger).emit('Server:TripAccepted', {
			message: `Your trip has been accepted by ${driver}`,
			tripId: db.trips[tripIndex].id,
		});
		io.emit(
			'Server:UpdateTrips',
			db.trips.filter((trip) => trip.status !== 'accepted' && trip.status !== 'started' && trip.status !== 'finished')
		);
	});

	socket.on('Client:InitTrip', ({ passenger }) => {
		const tripIndex = db.trips.findIndex((trip) => trip.socketId === passenger);
		if (tripIndex !== -1) {
			db.trips[tripIndex] = {
				...db.trips[tripIndex],
				status: 'started',
			};
			io.to(passenger).emit('Server:TripStarted', {
				message: 'Your trip has started',
				dataTrip: db.trips[tripIndex],
			});
		}
	});

	socket.on('Client:FinishTrip', ({ passenger }) => {
		const tripIndex = db.trips.findIndex((trip) => trip.socketId === passenger);
		if (tripIndex !== -1) {
			db.trips[tripIndex] = {
				...db.trips[tripIndex],
				status: 'finished',
			};
			io.to(passenger).emit('Server:TripFinished', {
				message: 'Your trip has finished',
				dataTrip: db.trips[tripIndex],
			});
		}
	});

	socket.on('disconnect', () => {
		console.log('User disconnected:', socket.id);
		db.drivers = db.drivers.filter((driver) => driver.socketId !== socket.id);
		db.passengers = db.passengers.filter((passenger) => passenger.socketId !== socket.id);
		db.cars = db.cars.filter((car) => car.socketId !== socket.id);
		db.trips = db.trips.filter((trip) => trip.socketId !== socket.id);
		updateActiveCars();
		updateTrips();
	});
});

httpServer.listen(5050, () => {
	// Starts the server on port 5050
	console.log(`Server is running on http://localhost:${5050}`);
});
