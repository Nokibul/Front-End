'use strict';







//Workout class
class WorkOut {
    date = new Date();
    id = (Date.now() + '').slice(-10);

    constructor(coords,distance,duration) {
        this.coords = coords;
        this.distance = distance; //in km
        this.duration = duration; //in min
    }

    _setPosition(){
        //prettier-ignore
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

        this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${months[this.date.getMonth()]} ${this.date.getDate()}`;
    }
}

//running class
class Running extends WorkOut {
    type = 'running';
    constructor(coords,distance,duration,cadence) {
        super(coords,distance,duration);
        this.cadence = cadence;
        this.calcPace();
        this._setPosition();
    }

    calcPace(){
        // min/km
        this.pace = this.duration / this.distance;
    }
}

//cycling class
class Cycling extends WorkOut {
    type = 'cycling';
    constructor(coords,distance,duration,elevationGain) {
        super(coords,distance,duration);
        this.elevationGain = elevationGain;
        this.calcSpeed();
        this._setPosition();
    }

    calcSpeed(){
        // km/h
        this.speed = this.distance / (this.duration / 60 );
    }
}


// const run1 = new Running([13,-16],61,20,200);
// const cycling1 = new Cycling([13,-16],82,35,500);
// console.log(run1,cycling1);

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

/////////////////////
//APP Architecture//
class App {
    #map;
    #mapEvent;
    #workouts = [];
    constructor(){
        //Get position
        this._getPosition();

        //Get local storage
        this._getLocalStorage();

        form.addEventListener('submit',this._newWorkOut.bind(this));        
        inputType.addEventListener('change',this._toggleElevationField);
        containerWorkouts.addEventListener('click',this._moveTopopup.bind(this));      
    };

    _getPosition() {
        if(navigator.geolocation)
            navigator.geolocation.getCurrentPosition(this._loadMap.bind(this), function() {
                alert('something is wrong');
        });
    }

    _loadMap(position) {
        const {latitude} = position.coords;
        const {longitude} = position.coords;
        const coords = [latitude,longitude];
        this.#map = L.map('map').setView(coords, 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
         attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(this.#map);
        this.#map.on('click',this._showForm.bind(this));
        this.#workouts.forEach(work => { 
            this._renderWorkoutMarker(work);
        });
    }

    _showForm(mapE) {
        this.#mapEvent = mapE;
        form.classList.remove('hidden');
        inputDistance.focus();
    }

    _hideForm(){
        //Clear fields
        inputDistance.value = inputCadence.value = inputDuration.value = inputElevation.value = '';
        form.classList.add('hidden');
    }

    _toggleElevationField() {
        inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
        inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
    }

    _newWorkOut(e) {
        e.preventDefault();
        //------------------>IMPORTANT<------------------s
        const validCheck = (...inputs) => inputs.every(inp => Number.isFinite(inp));
        const positiveCheck = (...inputs) => inputs.every(inp => inp > 0);

        //Get data from form
        const type = inputType.value;
        const distance = +inputDistance.value;
        const duration = +inputDuration.value;
        const {lat,lng} = this.#mapEvent.latlng;
        let workout;
              
        //If its running,create running object 
        if(type === 'running') {
            const cadence = +inputCadence.value;
            //Check the validity 
            if(!validCheck(distance,duration,cadence) || !positiveCheck(distance,duration,cadence)) {
                return alert('Check your inputs please');
            } 

            workout = new Running([lat,lng],distance,duration,cadence);
        }

        //If its cycling,create cycling object
        if(type === 'cycling') {
            const elevation = +inputElevation.value;
            //Check the validity 
            if(!validCheck(distance,duration,elevation) || !positiveCheck(distance,duration,elevation)){
                return alert('Check your inputs please');
            }
            workout = new Cycling([lat,lng],distance,duration,elevation);
        }
        
        //Add new object to workout array
        this.#workouts.push(workout);
        console.log(workout);
          
        //Render workout on map as marker
        this._renderWorkoutMarker(workout);
               
        //Render workout in list
        this._renderWorkout(workout);
        
        //Hide form + clear fields
        this._hideForm();
        
        //set local storage
        this._setLocalStorage();
        
    }

    _moveTopopup(e){
        const workoutEl = e.target.closest('.workout');
        console.log(workoutEl);
        if(!workoutEl) return;
        
        const workout = this.#workouts.find(work => work.id === workoutEl.dataset.id)
        console.log(workout);
        
        form.classList.add('hidden');

        this.#map.setView(workout.coords,13,{
            animate : true,
            pan : {
                duration : 1,
            }
        })
    }

    _renderWorkoutMarker(workout){
        L.marker(workout.coords)
        .addTo(this.#map)
        .bindPopup(L.popup({
            maxWidth : 250,
            minWidth : 100,
            autoClose : false,
            closeOnClick : false,
            className : `${workout.type}-popup`,     
            })
        ).setPopupContent(`${workout.type === 'running' ? '🏃‍♂️'  : '🚴‍♀️'} ${workout.description}`)
        .openPopup();
    }



    _renderWorkout(workout){
        let html = `<li class="workout workout--${workout.type}" data-id="${workout.id}">
        <h2 class="workout__title">${workout.description}</h2>
        <div class="workout__details">
          <span class="workout__icon">${workout.type === 'running' ? '🏃‍♂️' : '🚴‍♀️'}</span>
          <span class="workout__value">${workout.distance}</span>'
          <span class="workout__unit">km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⏱</span>
          <span class="workout__value">${workout.duration}</span>
          <span class="workout__unit">min</span>
        </div>`

        if (workout.type ==='running') {
            html += `<div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.pace.toFixed(1)}</span>
            <span class="workout__unit">min/km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value">${workout.cadence}</span>
            <span class="workout__unit">spm</span>
          </div>
        </li>`
        }

        if (workout.type === 'cycling') {
            html += `<div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.speed.toFixed(1)}</span>
            <span class="workout__unit">km/h</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⛰</span>
            <span class="workout__value">${workout.elevationGain}</span>
            <span class="workout__unit">m</span>
          </div>
        </li>`
        }

        form.insertAdjacentHTML('afterend',html);
    }

    _setLocalStorage() {
        localStorage.setItem('workouts', JSON.stringify(this.#workouts));
    }

    _getLocalStorage() {
        const data = JSON.parse(localStorage.getItem('workouts'));
        console.log(data);

        if(!data) return;

        this.#workouts = data;

        this.#workouts.forEach(work => { 
            this._renderWorkout(work);
        });
    }

    _reset() {
        localStorage.removeItem('workouts')
        location.reload();
    }
}

const app = new App() 


