document.addEventListener('DOMContentLoaded', () => {

    // --- CONSTANTES Y DATOS ---
    const vpdRanges = {
        clonacion: { optimal_min: 0.8, optimal_max: 1.0, name: 'Clonación / Germinación' },
        vegetativo: { optimal_min: 1.0, optimal_max: 1.3, name: 'Crecimiento Vegetativo' },
        floracion: { optimal_min: 1.2, optimal_max: 1.5, name: 'Floración' }
    };

    // --- SELECCIÓN DE ELEMENTOS DEL DOM ---
    const tempSlider = document.getElementById('temp-slider');
    const tempInput = document.getElementById('temp-input');
    const humiditySlider = document.getElementById('humidity-slider');
    const humidityInput = document.getElementById('humidity-input');
    const stageSelect = document.getElementById('stage');

    const vpdValueEl = document.getElementById('vpd-value');
    const vpdStatusEl = document.getElementById('vpd-status');
    const recommendationsEl = document.getElementById('recommendations');

    // --- FUNCIONES DE CÁLCULO ---
    // Fórmula de Tetens para calcular la Presión de Vapor de Saturación (SVP)
    function calculateSVP(temp) {
        return 0.6108 * Math.exp((17.27 * temp) / (temp + 237.3));
    }

    // Cálculo del VPD en kPa
    function calculateVPDValue(temp, rh) {
        const svp = calculateSVP(temp);
        const vpd = svp * (1 - rh / 100);
        return vpd;
    }

    // --- LÓGICA PRINCIPAL ---
    function updateVPD() {
        const temp = parseFloat(tempInput.value);
        const rh = parseFloat(humidityInput.value);
        const stage = stageSelect.value;

        if (isNaN(temp) || isNaN(rh)) {
            vpdValueEl.textContent = '--';
            vpdStatusEl.textContent = '';
            recommendationsEl.innerHTML = '';
            return;
        }

        const currentVPD = calculateVPDValue(temp, rh);
        const range = vpdRanges[stage];

        // Actualizar valor de VPD
        vpdValueEl.textContent = currentVPD.toFixed(2);

        // Determinar estado y dar recomendaciones
        let status, statusClass, recommendationsHTML = '';

        if (currentVPD >= range.optimal_min && currentVPD <= range.optimal_max) {
            status = '✅ Óptimo';
            statusClass = 'status-optimal';
            recommendationsHTML = `<h3>¡Excelente!</h3><p>El VPD se encuentra dentro del rango ideal para la etapa de <strong>${range.name}</strong>. Tus plantas están en un ambiente perfecto para una transpiración eficiente.</p>`;
        } else if (currentVPD < range.optimal_min) {
            status = '⚠️ Bajo';
            statusClass = 'status-low';
            recommendationsHTML = `<h3>VPD Bajo</h3><p>Un VPD bajo indica que el aire está muy saturado de humedad. Esto puede ralentizar el crecimiento y aumentar el riesgo de moho (botrytis, oídio).</p>`;
            
            // Calcular recomendaciones para subir el VPD
            const targetVPD = range.optimal_min; // Apuntar al mínimo del rango óptimo
            
            // Opción 1: Subir Temperatura (manteniendo HR)
            let recommendedTemp = temp;
            for (let t = temp; t <= 35; t += 0.5) {
                if (calculateVPDValue(t, rh) >= targetVPD) {
                    recommendedTemp = t;
                    break;
                }
            }
            if (recommendedTemp > temp) {
                recommendationsHTML += `<p><strong>Recomendación 1:</strong> Aumenta la temperatura a <strong>${recommendedTemp.toFixed(1)}°C</strong> (manteniendo la humedad en ${rh}%).</p>`;
            }

            // Opción 2: Bajar Humedad (manteniendo Temp)
            const svp = calculateSVP(temp);
            const recommendedRH = 100 * (1 - targetVPD / svp);
            if (recommendedRH < rh && recommendedRH >= 20) {
                 recommendationsHTML += `<p><strong>Recomendación 2:</strong> Reduce la humedad a <strong>${Math.round(recommendedRH)}%</strong> (manteniendo la temperatura en ${temp}°C).</p>`;
            }

        } else { // currentVPD > range.optimal_max
            status = '⚠️ Alto';
            statusClass = 'status-high';
            recommendationsHTML = `<h3>VPD Alto</h3><p>Un VPD alto significa que el aire es muy seco. Esto puede estresar a las plantas, causar que cierre los estomas para no perder agua y detener el crecimiento.</p>`;

            // Calcular recomendaciones para bajar el VPD
            const targetVPD = range.optimal_max; // Apuntar al máximo del rango óptimo

            // Opción 1: Bajar Temperatura (manteniendo HR)
            let recommendedTemp = temp;
            for (let t = temp; t >= 10; t -= 0.5) {
                if (calculateVPDValue(t, rh) <= targetVPD) {
                    recommendedTemp = t;
                    break;
                }
            }
            if (recommendedTemp < temp) {
                recommendationsHTML += `<p><strong>Recomendación 1:</strong> Reduce la temperatura a <strong>${recommendedTemp.toFixed(1)}°C</strong> (manteniendo la humedad en ${rh}%).</p>`;
            }

            // Opción 2: Subir Humedad (manteniendo Temp)
            const svp = calculateSVP(temp);
            const recommendedRH = 100 * (1 - targetVPD / svp);
            if (recommendedRH > rh && recommendedRH <= 80) {
                recommendationsHTML += `<p><strong>Recomendación 2:</strong> Aumenta la humedad a <strong>${Math.round(recommendedRH)}%</strong> (manteniendo la temperatura en ${temp}°C).</p>`;
            }
        }

        // Actualizar la UI
        vpdStatusEl.textContent = status;
        vpdStatusEl.className = `status-message ${statusClass}`;
        recommendationsEl.innerHTML = recommendationsHTML;
    }

    // --- EVENT LISTENERS ---
    // Sincronizar sliders con inputs numéricos
    tempSlider.addEventListener('input', () => {
        tempInput.value = tempSlider.value;
        updateVPD();
    });
    tempInput.addEventListener('input', () => {
        tempSlider.value = tempInput.value;
        updateVPD();
    });

    humiditySlider.addEventListener('input', () => {
        humidityInput.value = humiditySlider.value;
        updateVPD();
    });
    humidityInput.addEventListener('input', () => {
        humiditySlider.value = humidityInput.value;
        updateVPD();
    });

    stageSelect.addEventListener('change', updateVPD);

    // --- INICIALIZACIÓN ---
    updateVPD();
});