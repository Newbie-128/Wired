document.addEventListener('DOMContentLoaded', () => {
    const toggleGridButton = document.getElementById('toggleGrid');
    const freehandModeButton = document.getElementById('freehandMode');
    const snapModeButton = document.getElementById('snapMode');
    const addDeviceButton = document.getElementById('addDevice');
    const saveDeviceButton = document.getElementById('saveDevice');
    const cancelEditButton = document.getElementById('cancelEdit');
    const inputsContainer = document.getElementById('inputsContainer');
    const outputsContainer = document.getElementById('outputsContainer');
    const canvas = document.getElementById('canvas');
    const gridLines = document.querySelector('.grid-lines');
    const deviceModal = document.getElementById('deviceModal');
    const deviceNameInput = document.getElementById('deviceName');
    const deviceMajorCategorySelect = document.getElementById('deviceMajorCategory');
    const deviceMinorCategorySelect = document.getElementById('deviceMinorCategory');
    const deviceManufacturerInput = document.getElementById('deviceManufacturer');
    const deviceCategorySelect = document.getElementById('deviceCategory');
    const deviceInternalIdInput = document.getElementById('deviceInternalId');
    const deviceList = document.getElementById('deviceList');

    let isFreehandMode = false;
    let isSnapMode = false;
    let isDrawing = false;
    let lastX = 0;
    let lastY = 0;
    let devices = [];
    let editingDeviceIndex = null;

    // 初期表示の入力・出力フィールドを追加
    addInputOutputField(inputsContainer, 'input');
    addInputOutputField(outputsContainer, 'output');

    toggleGridButton.addEventListener('click', () => {
        gridLines.classList.toggle('hidden');
    });

    freehandModeButton.addEventListener('click', () => {
        isFreehandMode = true;
        isSnapMode = false;
        freehandModeButton.classList.add('active-mode');
        snapModeButton.classList.remove('active-mode');
    });

    snapModeButton.addEventListener('click', () => {
        isFreehandMode = false;
        isSnapMode = true;
        snapModeButton.classList.add('active-mode');
        freehandModeButton.classList.remove('active-mode');
    });

    canvas.addEventListener('mousedown', (e) => {
        if (isFreehandMode || isSnapMode) {
            isDrawing = true;
            [lastX, lastY] = [e.offsetX, e.offsetY];
        }
    });

    canvas.addEventListener('mousemove', (e) => {
        if (!isDrawing) return;
        const ctx = canvas.getContext('2d');
        ctx.strokeStyle = '#000';
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        ctx.lineWidth = 2;

        if (isFreehandMode) {
            ctx.beginPath();
            ctx.moveTo(lastX, lastY);
            ctx.lineTo(e.offsetX, e.offsetY);
            ctx.stroke();
            [lastX, lastY] = [e.offsetX, e.offsetY];
        } else if (isSnapMode) {
            const snapX = Math.round(e.offsetX / 20) * 20;
            const snapY = Math.round(e.offsetY / 20) * 20;
            ctx.beginPath();
            ctx.moveTo(lastX, lastY);
            ctx.lineTo(snapX, snapY);
            ctx.stroke();
            [lastX, lastY] = [snapX, snapY];
        }
    });

    canvas.addEventListener('mouseup', () => isDrawing = false);
    canvas.addEventListener('mouseout', () => isDrawing = false);

    addDeviceButton.addEventListener('click', () => {
        editingDeviceIndex = null;
        deviceNameInput.value = '';
        deviceMajorCategorySelect.value = '';
        deviceMinorCategorySelect.value = '';
        deviceManufacturerInput.value = '';
        deviceCategorySelect.value = '';
        deviceInternalIdInput.value = '';
        inputsContainer.innerHTML = '';
        outputsContainer.innerHTML = '';
        addInputOutputField(inputsContainer, 'input');
        addInputOutputField(outputsContainer, 'output');
        deviceModal.style.display = 'flex';
    });

    saveDeviceButton.addEventListener('click', () => {
        const deviceName = deviceNameInput.value.trim();
        const deviceMajorCategory = deviceMajorCategorySelect.value;
        const deviceMinorCategory = deviceMinorCategorySelect.value;
        const deviceManufacturer = deviceManufacturerInput.value.trim();
        const deviceCategory = deviceCategorySelect.value;
        const deviceInternalId = deviceInternalIdInput.value.trim();

        if (!deviceName || !deviceInternalId) return;

        const inputs = [];
        document.querySelectorAll('.input-field').forEach(inputField => {
            const inputName = inputField.querySelector('.input-name').value.trim();
            const inputType = inputField.querySelector('.input-type').value;
            if (inputName && inputType) {
                inputs.push({ name: inputName, type: inputType });
            }
        });

        const outputs = [];
        document.querySelectorAll('.output-field').forEach(outputField => {
            const outputName = outputField.querySelector('.output-name').value.trim();
            const outputType = outputField.querySelector('.output-type').value;
            if (outputName && outputType) {
                outputs.push({ name: outputName, type: outputType });
            }
        });

        const deviceData = {
            id: editingDeviceIndex !== null ? devices[editingDeviceIndex].id : Date.now(),
            name: deviceName,
            majorCategory: deviceMajorCategory,
            minorCategory: deviceMinorCategory,
            manufacturer: deviceManufacturer,
            category: deviceCategory,
            internalId: deviceInternalId,
            inputs,
            outputs
        };

        if (editingDeviceIndex !== null) {
            devices[editingDeviceIndex] = deviceData;
        } else {
            devices.push(deviceData);
            createDeviceElement(deviceData);
        }

        updateDeviceList();
        deviceModal.style.display = 'none';
    });

    cancelEditButton.addEventListener('click', () => {
        deviceModal.style.display = 'none';
    });
    function addInputOutputField(container, type, data = {}) {
        const fieldDiv = document.createElement('div');
        fieldDiv.className = `${type}-field mb-2 flex items-center`;

        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.className = `${type}-name border p-2 mr-2`;
        nameInput.placeholder = `${type.charAt(0).toUpperCase() + type.slice(1)} Name`;
        if (data.name) nameInput.value = data.name;

        const typeSelect = document.createElement('select');
        typeSelect.className = `${type}-type border p-2 mr-2`;
        typeSelect.innerHTML = `
            <option value="">Select Type...</option>
            <option value="HDMI" ${data.type === 'HDMI' ? 'selected' : ''}>HDMI</option>
            <option value="USB" ${data.type === 'USB' ? 'selected' : ''}>USB</option>
            <option value="Ethernet" ${data.type === 'Ethernet' ? 'selected' : ''}>Ethernet</option>
            <!-- 他のタイプも追加 -->
        `;

        const removeButton = document.createElement('button');
        removeButton.className = 'btn-secondary';
        removeButton.innerHTML = '<i class="fas fa-trash-alt"></i>';
        removeButton.addEventListener('click', () => {
            container.removeChild(fieldDiv);
        });

        const addButton = document.createElement('button');
        addButton.className = `btn-secondary add-${type}-btn`;
        addButton.innerHTML = `<i class="fas fa-plus"></i>`;
        addButton.addEventListener('click', () => {
            addInputOutputField(container, type);
        });

        fieldDiv.appendChild(nameInput);
        fieldDiv.appendChild(typeSelect);
        fieldDiv.appendChild(removeButton);
        fieldDiv.appendChild(addButton);
        container.appendChild(fieldDiv);
    }

    function createDeviceElement(device) {
        const li = document.createElement('li');
        li.textContent = device.name;
        li.draggable = true;
        li.dataset.id = device.id;
        li.addEventListener('dragstart', handleDragStart);
        li.addEventListener('dblclick', () => editDevice(device.id));
        deviceList.appendChild(li);
    }

    function editDevice(id) {
        const device = devices.find(d => d.id === id);
        if (!device) return;
        editingDeviceIndex = devices.indexOf(device);
        deviceNameInput.value = device.name;
        deviceMajorCategorySelect.value = device.majorCategory;
        deviceMinorCategorySelect.value = device.minorCategory;
        deviceManufacturerInput.value = device.manufacturer;
        deviceCategorySelect.value = device.category;
        deviceInternalIdInput.value = device.internalId;
        inputsContainer.innerHTML = '';
        outputsContainer.innerHTML = '';
        device.inputs.forEach(input => addInputOutputField(inputsContainer, 'input', input));
        device.outputs.forEach(output => addInputOutputField(outputsContainer, 'output', output));
        deviceModal.style.display = 'flex';
    }

    function handleDragStart(e) {
        e.dataTransfer.setData('text/plain', e.target.dataset.id);
    }

    canvas.addEventListener('dragover', (e) => {
        e.preventDefault();
    });

    canvas.addEventListener('drop', (e) => {
        e.preventDefault();
        const id = e.dataTransfer.getData('text/plain');
        const device = devices.find(d => d.id === id);
        if (!device) return;

        const x = e.offsetX;
        const y = e.offsetY;
        const deviceElement = document.createElement('div');
        deviceElement.textContent = device.name;
        deviceElement.className = 'device';
        deviceElement.style.position = 'absolute';
        deviceElement.style.left = `${x}px`;
        deviceElement.style.top = `${y}px`;
        deviceElement.dataset.id = device.id;
        canvas.appendChild(deviceElement);
    });

    function updateDeviceList() {
        deviceList.innerHTML = '';
        devices.forEach(createDeviceElement);
    }
});
