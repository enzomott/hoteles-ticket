// Variables globales
let hotelesData = []; // Ahora contendrá una lista *plana* de todas las habitaciones/tipos de hoteles
let countriesData = [];
let countdownTime = 600; // 10 minutos en segundos para el temporizador
let validationState = {
    fullName: false,
    email: false,
    phone: false,
    birthDate: false,
    country: false,
    // hotel: false, // Eliminado para que no sea requerido
    ticketType: false,
    habitacionQuantity: false,
    cardNumber: false,
    expiryDate: false,
    cvv: false,
    cardName: false
};

// Expresiones regulares
const regexPatterns = {
    fullName: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{3,}$/,
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    phone: /^\d{10}$/,
    birthDate: /^(0[1-9]|[12]\d|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/,
    cardNumber: /^\d{16}$/,
    expiryDate: /^(0[1-9]|1[0-2])\/\d{2}$/,
    cvv: /^\d{3,4}$/,
    cardName: /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]{3,}$/
};

// Inicialización principal
document.addEventListener('DOMContentLoaded', () => {
    loadHoteles(); 
    loadCountries();
    startCountdown();
    setupValidations();
    // Inicializar fechas mínimas para ingreso y salida
    const hoy = new Date();
    const yyyy = hoy.getFullYear();
    const mm = String(hoy.getMonth() + 1).padStart(2, '0');
    const dd = String(hoy.getDate()).padStart(2, '0');
    const minDate = `${yyyy}-${mm}-${dd}`;
    const fechaIngreso = document.getElementById('fechaIngreso');
    const fechaSalida = document.getElementById('fechaSalida');
    if (fechaIngreso) fechaIngreso.setAttribute('min', minDate);
    if (fechaSalida) fechaSalida.setAttribute('min', minDate);
});

// --- FUNCIONES DE CARGA DE DATOS ---

// Carga los países desde paises.json y llena el select de países
function loadCountries() {
    fetch('paises.json')
    .then(res => res.json())
    .then(data => {
        countriesData = data;
        const countrySelect = document.getElementById('country');
        // Limpiar opciones antes de agregar (excepto la primera)
        countrySelect.innerHTML = '<option value="">Selecciona tu pais de residencia</option>';
        data.forEach(country => {
            const option = document.createElement('option');
            option.value = country.iso2;
            option.textContent = country.nameES;
            countrySelect.appendChild(option);
        });
    });
}

// Carga los hoteles desde hoteles.json y llena el select de hoteles

function loadHoteles() {
    fetch('hoteles.json')
    .then(res => res.json())
    .then(data => {
        hotelesData = data;
        const hotelSelect = document.getElementById('hotel');
        hotelSelect.innerHTML = '<option value="">Selecciona el hotel al que deseas hospedarte</option>';
        data.forEach((hotel, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = hotel.hotel;
            hotelSelect.appendChild(option);
        });

        hotelSelect.addEventListener('change', function () {
            const tipoSelect = document.getElementById('ticketType');
            const habitacionesInput = document.getElementById('hotelLocation');
            const cantidadInput = document.getElementById('habitacionQuantity');
            if (this.value !== "") {
                const selectedHotel = hotelesData[this.value];
                document.getElementById('hotelDate').value = selectedHotel.ciudad || "";

                // Poblar tipos de habitación
                tipoSelect.innerHTML = '<option value="">Selecciona el tipo de habitacion</option>';
                selectedHotel.habitaciones.forEach((hab, idx) => {
                    const opt = document.createElement('option');
                    opt.value = hab.tipo;
                    opt.textContent = `${hab.tipo} (${hab.disponibles} disponibles)`;
                    tipoSelect.appendChild(opt);
                });

                // Mostrar resumen de habitaciones disponibles (por tipo)
                let resumen = selectedHotel.habitaciones.map(hab => `${hab.tipo}: ${hab.disponibles}`).join(' | ');
                habitacionesInput.value = resumen;

                // Resetear cantidad y límites
                cantidadInput.value = '';
                cantidadInput.min = 1;
                cantidadInput.max = 1;
                cantidadInput.disabled = true;

                // Ya no se requiere marcar validación para hotel
            } else {
                document.getElementById('hotelDate').value = "";
                tipoSelect.innerHTML = '<option value="">Selecciona el tipo de habitacion</option>';
                habitacionesInput.value = "";
                cantidadInput.value = '';
                cantidadInput.min = 1;
                cantidadInput.max = 6;
                cantidadInput.disabled = true;

                // Ya no se requiere marcar validación para hotel
            }
            updateSubmitButton();
            updateSummary();
        });
    });
}


function validateField(fieldName, value, pattern, errorMessage) {
    const isValid = pattern.test(value);
    if (isValid) {
        showSuccess(fieldName);
        validationState[fieldName] = true;
    } else {
        showError(fieldName, errorMessage);
        validationState[fieldName] = false;
    }
    updateSubmitButton();
}

function showError(fieldName, message) {
    const field = document.getElementById(fieldName);
    const errorElement = document.getElementById(fieldName + 'Error');
    const successElement = document.getElementById(fieldName + 'Success');
    
    if (field && field.parentElement) {
        field.parentElement.classList.remove('success');
        field.parentElement.classList.add('error');
    }

    errorElement.textContent = message;
    errorElement.style.display = 'block';
    successElement.style.display = 'none';
}

function showSuccess(fieldName) {
    const field = document.getElementById(fieldName);
    const errorElement = document.getElementById(fieldName + 'Error');
    const successElement = document.getElementById(fieldName + 'Success');

    if (field && field.parentElement) {
        field.parentElement.classList.remove('error');
        field.parentElement.classList.add('success');
    }

    errorElement.style.display = 'none';
    successElement.style.display = 'block';
}

function updateSubmitButton() {
    const submitBtn = document.getElementById('submitBtn');
    const submitMessage = document.getElementById('submitMessage');
    const allValid = Object.values(validationState).every(state => state === true);

    if (allValid) {
        submitBtn.disabled = false;
        submitMessage.style.display = 'none';
    } else {
        submitBtn.disabled = true;
        submitMessage.style.display = 'block';
        
        const missingFields = [];
        for (const [field, valid] of Object.entries(validationState)) {
            if (!valid) {
                missingFields.push(getFieldDisplayName(field));
            }
        }
        if (missingFields.length > 0) {
            submitMessage.textContent = `Complete correctamente: ${missingFields.join(', ')}`;
        }
    }
}

function getFieldDisplayName(fieldName) {
    const displayNames = {
        fullName: 'Nombre completo',
        email: 'Correo electrónico',
        phone: 'Teléfono',
        birthDate: 'Fecha de nacimiento',
        country: 'País',
    // hotel: 'Hotel',
        ticketType: 'Tipo de habitación',
        habitacionQuantity: 'Cantidad de habitaciones',
        cardNumber: 'Número de tarjeta',
        expiryDate: 'Fecha de vencimiento',
        cvv: 'CVV',
        cardName: 'Nombre en tarjeta'
    };
    return displayNames[fieldName] || fieldName;
}

function updateSummary() {
    const hotelSelect = document.getElementById('hotel');
    const selectedIndex = hotelSelect.value;
    const ticketTypeElement = document.getElementById('ticketType');
    const ticketType = ticketTypeElement ? ticketTypeElement.value : '';
    const quantity = document.getElementById('habitacionQuantity').value;
    const fechaIngreso = document.getElementById('fechaIngreso')?.value || '';
    const fechaSalida = document.getElementById('fechaSalida')?.value || '';

    if (selectedIndex !== "" && ticketType && quantity) {
        const selectedHotel = hotelesData[selectedIndex];
        document.getElementById('summaryBox').style.display = 'block';
        document.getElementById('summaryHotel').textContent = selectedHotel ? selectedHotel.hotel : '-';
        // Mostrar ciudad
        document.getElementById('summaryDate').textContent = selectedHotel ? selectedHotel.ciudad : '-';
        // Mostrar fechas de ingreso y salida
        document.getElementById('summaryFechaIngreso').textContent = fechaIngreso || '-';
        document.getElementById('summaryFechaSalida').textContent = fechaSalida || '-';
        // Mostrar habitaciones disponibles por tipo
        let resumen = selectedHotel.habitaciones.map(hab => `${hab.tipo}: ${hab.disponibles}`).join(' | ');
        document.getElementById('summaryLocation').textContent = resumen;
        document.getElementById('summaryTicketType').textContent = ticketType;
        document.getElementById('summaryQuantity').textContent = quantity;

        // Buscar precio y moneda del tipo de habitación seleccionado
        const hab = selectedHotel.habitaciones.find(h => h.tipo === ticketType);
        let unitPrice = hab ? hab.precio_noche : '-';
        let moneda = hab && hab.moneda ? hab.moneda : 'ARS';

        // Calcular número de noches
        let noches = 1;
        if (fechaIngreso && fechaSalida) {
            const d1 = new Date(fechaIngreso);
            const d2 = new Date(fechaSalida);
            const diff = (d2 - d1) / (1000 * 60 * 60 * 24);
            noches = diff > 0 ? diff : 1;
        }

        let totalPrice = hab ? hab.precio_noche * parseInt(quantity) * noches : '-';
        document.getElementById('summaryUnitPrice').textContent = unitPrice !== '-' ? `${unitPrice} ${moneda}` : '-';
        document.getElementById('summaryTotal').textContent = totalPrice !== '-' ? `${totalPrice} ${moneda}` : '-';
    } else {
        document.getElementById('summaryBox').style.display = 'none';
    }
}

function detectCardType(cardNumber) {
    const cardIcon = document.getElementById('cardIcon');
    cardIcon.className = 'card-icon'; // Reset class

    if (cardNumber.startsWith('4')) {
        // VISA
        cardIcon.classList.add('card-visa');
    } else if (cardNumber.startsWith('5') || cardNumber.startsWith('2')) {
        // MASTERCARD
        cardIcon.classList.add('card-mastercard');
    } else if (cardNumber.startsWith('3')) {
        // AMEX (Asumiendo que '3' es para Amex basado en la clase CSS)
        cardIcon.classList.add('card-amex');
    }
}

// --- FUNCIONES DE TEMPORIZADOR Y VALIDACIÓN ESPECÍFICA ---

function startCountdown() {
    const countdownElement = document.getElementById('countdown');
    const timer = setInterval(() => {
        const minutes = Math.floor(countdownTime / 60);
        const seconds = countdownTime % 60;

        countdownElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        if (countdownTime <= 0) {
            clearInterval(timer);
            countdownElement.textContent = '00:00';
            countdownElement.style.color = '#e74c3c';
            alert('¡Tiempo agotado! Por favor, reinicie el proceso de compra.');
            document.getElementById('submitBtn').disabled = true;
            document.getElementById('submitMessage').textContent = 'Tiempo agotado para completar la compra';
            document.getElementById('submitMessage').style.display = 'block';
        }

        // Cambiar color cuando quedan menos de 2 minutos (120s) o menos de 5 minutos (300s)
        if (countdownTime <= 120) {
            countdownElement.style.color = '#e74c3c';
        } else if (countdownTime <= 300) {
            countdownElement.style.color = '#f39c12';
        }

        countdownTime--;
    }, 1000);
}

function isValidDate(dateStr) {
    const parts = dateStr.split('/');
    if (parts.length !== 3) return false;
    const [dd, mm, yyyy] = parts.map(Number);
    
    // Validar rango lógico
    if (dd < 1 || dd > 31) return false;
    if (mm < 1 || mm > 12) return false;
    // Año mínimo de 1900
    if (yyyy < 1900 || yyyy > new Date().getFullYear()) return false; 
    
    // Crear objeto Date y validar si el día/mes/año coinciden (maneja días en exceso como 31/02)
    const date = new Date(yyyy, mm - 1, dd); 
    return (
        date.getFullYear() === yyyy &&
        date.getMonth() === mm - 1 &&
        date.getDate() === dd
    );
}

function validateAge(dateString) {
    const [day, month, year] = dateString.split('/').map(Number);
    const birthDate = new Date(year, month - 1, day); // month is 0-indexed
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }

    if (age >= 18) {
        showSuccess('birthDate');
        validationState.birthDate = true;
    } else {
        showError('birthDate', 'Debe ser mayor de 18 años');
        validationState.birthDate = false;
    }
    updateSubmitButton();
}

function validateExpiryDate(dateString) {
    const [month, year] = dateString.split('/').map(Number);
    const currentDate = new Date();
    // Convertir a año de dos dígitos (ej. 2025 -> 25)
    const currentYear = currentDate.getFullYear() % 100; 
    const currentMonth = currentDate.getMonth() + 1; // getMonth() es 0-indexado

    // Check if year is in the future OR (year is current AND month is current or future)
    if (year > currentYear || (year === currentYear && month >= currentMonth)) {
        showSuccess('expiryDate');
        validationState.expiryDate = true;
    } else {
        showError('expiryDate', 'La fecha debe estar en el futuro');
        validationState.expiryDate = false;
    }
    updateSubmitButton();
}


function setupValidations() {
    // No agregar validación duplicada aquí, ya se maneja en loadHoteles()
    // Validación fecha de ingreso
    const fechaIngreso = document.getElementById('fechaIngreso');
    const fechaSalida = document.getElementById('fechaSalida');
    if (fechaIngreso) {
        fechaIngreso.addEventListener('change', function () {
            const hoy = new Date();
            hoy.setHours(0,0,0,0);
            const valor = new Date(this.value);
            const errorDiv = document.getElementById('fechaIngresoError');
            const successDiv = document.getElementById('fechaIngresoSuccess');
            if (this.value && valor >= hoy) {
                this.parentElement.classList.remove('error');
                this.parentElement.classList.add('success');
                errorDiv.style.display = 'none';
                successDiv.style.display = 'block';
            } else {
                this.parentElement.classList.remove('success');
                this.parentElement.classList.add('error');
                errorDiv.textContent = 'Debe seleccionar una fecha igual o posterior a hoy';
                errorDiv.style.display = 'block';
                successDiv.style.display = 'none';
            }
            // Actualizar min de salida
            if (fechaSalida) {
                fechaSalida.setAttribute('min', this.value);
                // Si la salida es menor o igual, limpiar
                if (fechaSalida.value && fechaSalida.value <= this.value) {
                    fechaSalida.value = '';
                    document.getElementById('fechaSalidaError').style.display = 'none';
                    document.getElementById('fechaSalidaSuccess').style.display = 'none';
                    fechaSalida.parentElement.classList.remove('success','error');
                }
            }
        });
    }
    // Validación fecha de salida
    if (fechaSalida) {
        fechaSalida.addEventListener('change', function () {
            const ingresoVal = fechaIngreso ? fechaIngreso.value : '';
            const errorDiv = document.getElementById('fechaSalidaError');
            const successDiv = document.getElementById('fechaSalidaSuccess');
            if (this.value && ingresoVal && this.value > ingresoVal) {
                this.parentElement.classList.remove('error');
                this.parentElement.classList.add('success');
                errorDiv.style.display = 'none';
                successDiv.style.display = 'block';
            } else {
                this.parentElement.classList.remove('success');
                this.parentElement.classList.add('error');
                errorDiv.textContent = 'Debe ser posterior al día de ingreso';
                errorDiv.style.display = 'block';
                successDiv.style.display = 'none';
            }
        });
    }
    // Validación nombre completo
    document.getElementById('fullName').addEventListener('input', function () {
        validateField('fullName', this.value, regexPatterns.fullName, 'Debe contener solo letras y espacios, mínimo 3 caracteres');
    });
    
    // Validación email
    document.getElementById('email').addEventListener('input', function () {
        validateField('email', this.value, regexPatterns.email, 'Ingrese un email válido');
    });

    // Validación teléfono
    document.getElementById('phone').addEventListener('input', function () {
        this.value = this.value.replace(/\D/g, ""); // Permitir solo números
        validateField('phone', this.value, regexPatterns.phone, 'Debe contener exactamente 10 dígitos');
    });
    
    // Validación fecha de nacimiento
    document.getElementById('birthDate').addEventListener('input', function () {
        let raw = this.value.replace(/\D/g, "");
        // Format the input (dd/mm/yyyy)
        if (raw.length > 8) {
            raw = raw.slice(0, 8);
        }
        if (raw.length >= 5) {
            this.value = raw.slice(0, 2) + '/' + raw.slice(2, 4) + '/' + raw.slice(4);
        } else if (raw.length >= 3) {
            this.value = raw.slice(0, 2) + '/' + raw.slice(2);
        } else {
            this.value = raw;
        }

        const val = this.value.trim();
        
        if (val.length === 10) {
            if (regexPatterns.birthDate.test(val)) {
                if (isValidDate(val)) {
                    validateAge(val); // This function will call showSuccess or showError itself
                } else {
                    showError('birthDate', 'Fecha inválida (ej. 31/02/1990).'); 
                    validationState.birthDate = false;
                }
            } else {
                showError('birthDate', 'Formato incorrecto. Use dd/mm/yyyy.'); 
                validationState.birthDate = false;
            }
        } else if (val.length === 0) {
            showError('birthDate', 'La fecha de nacimiento es requerida.'); 
            validationState.birthDate = false;
        } else {
            showError('birthDate', 'Formato incompleto. Use dd/mm/yyyy');
            validationState.birthDate = false;
        }
        updateSubmitButton();
    });

    // Validación país
    document.getElementById('country').addEventListener('change', function () {
        validateField('country', this.value, /.+/, 'Debe seleccionar un país');
    });

    // Validación tipo de habitación (El nombre en el HTML es 'ticketType', el texto es la opción)
    document.getElementById('ticketType').addEventListener('change', function () {
        validateField('ticketType', this.value, /.+/, 'Debe seleccionar un tipo de habitación');
        // Limitar cantidad máxima según disponibilidad
        const hotelSelect = document.getElementById('hotel');
        const cantidadInput = document.getElementById('habitacionQuantity');
        if (hotelSelect.value !== "" && this.value !== "") {
            const selectedHotel = hotelesData[hotelSelect.value];
            const hab = selectedHotel.habitaciones.find(h => h.tipo === this.value);
            if (hab) {
                cantidadInput.min = 1;
                cantidadInput.max = hab.disponibles;
                cantidadInput.value = '';
                cantidadInput.disabled = false;
            } else {
                cantidadInput.min = 1;
                cantidadInput.max = 1;
                cantidadInput.value = '';
                cantidadInput.disabled = true;
            }
        } else {
            cantidadInput.min = 1;
            cantidadInput.max = 1;
            cantidadInput.value = '';
            cantidadInput.disabled = true;
        }
        updateSummary();
    });

    // Validación cantidad de habitaciones
    document.getElementById('habitacionQuantity').addEventListener('input', function () {
        const min = parseInt(this.min);
        const max = parseInt(this.max);
        let value = parseInt(this.value);
        if (isNaN(value) || value < min) this.value = min;
        if (value > max) this.value = max;
        // Validar que sea entero y esté en el rango
        const isValid = Number.isInteger(Number(this.value)) && Number(this.value) >= min && Number(this.value) <= max;
        if (isValid) {
            showSuccess('habitacionQuantity');
            validationState.habitacionQuantity = true;
        } else {
            showError('habitacionQuantity', `Debe ser un número entre ${min} y ${max}`);
            validationState.habitacionQuantity = false;
        }
        updateSubmitButton();
        updateSummary();
    });

    // Validación número de tarjeta
    document.getElementById('cardNumber').addEventListener('input', function () {
        let value = this.value.replace(/\D/g, ""); // Permitir solo números
        value = value.replace(/(\d{4})(?=\d)/g, "$1 "); // Formatear con espacios
        this.value = value;
        
        const cleanValue = value.replace(/\s/g, ""); // Valor limpio para validación
        
        if (cleanValue.length === 16) {
            detectCardType(cleanValue);
            validateField('cardNumber', cleanValue, regexPatterns.cardNumber, 'Debe contener exactamente 16 dígitos');
        } else {
            // Limpiar icono si no tiene 16 dígitos
            document.getElementById('cardIcon').className = 'card-icon'; 
            showError('cardNumber', 'Debe contener exactamente 16 dígitos');
            validationState.cardNumber = false;
            updateSubmitButton();
        }
    });

    // Validación fecha de vencimiento
    document.getElementById('expiryDate').addEventListener('input', function () {
        let value = this.value.replace(/\D/g, "");
        if (value.length >= 2) {
            value = value.substring(0, 2) + '/' + value.substring(2, 4);
        }
        this.value = value;
        
        if (regexPatterns.expiryDate.test(value)) {
            validateExpiryDate(value);
        } else {
            showError('expiryDate', 'Formato inválido. Use MM/AA');
            validationState.expiryDate = false;
            updateSubmitButton();
        }
    });

    // Validación CVV
    document.getElementById('cvv').addEventListener('input', function () {
        this.value = this.value.replace(/\D/g, "");
        validateField('cvv', this.value, regexPatterns.cvv, 'Debe contener 3 o 4 dígitos');
    });

    // Validación nombre en tarjeta
    document.getElementById('cardName').addEventListener('input', function () {
        validateField('cardName', this.value, regexPatterns.cardName, 'Debe contener solo letras y espacios, mínimo 3 caracteres');
    });
    
    // Manejar envío del formulario
    document.getElementById('ticketForm').addEventListener('submit', function (e) {
        e.preventDefault();
        if (Object.values(validationState).every(state => state === true)) {
            // Simular procesamiento
            const submitBtn = document.getElementById('submitBtn');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Procesando...';
            submitBtn.disabled = true;
            setTimeout(() => {
                alert('¡Compra realizada exitosamente! Recibirá un email con los detalles de su compra.');
                submitBtn.textContent = originalText;
                submitBtn.disabled = false; // Re-habilitar si se desea permitir otra compra
            }, 2000);
        }
    });
}