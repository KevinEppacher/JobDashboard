import { formatLocation, PRIORITY_LABELS, STATUS_LABELS } from './jobs.js';

export function createJobsMap(elementId, onJobClick) {
  const map = L.map(elementId, { zoomControl: true });
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);

  const markerLayer = L.layerGroup().addTo(map);

  function renderMarkers(jobs) {
    markerLayer.clearLayers();

    const markers = jobs
      .filter((job) => Number.isFinite(job.location?.latitude) && Number.isFinite(job.location?.longitude))
      .map((job) => {
        const marker = L.marker([job.location.latitude, job.location.longitude]);
        const detailsButtonId = `marker-job-${job.id}`;
        marker.bindPopup(`
          <div class="small">
            <div class="fw-semibold mb-1">${job.company}</div>
            <div>${job.position}</div>
            <div>${formatLocation(job.location)}</div>
            <div>Priority: ${PRIORITY_LABELS[job.priority]}</div>
            <div>Status: ${STATUS_LABELS[job.status]}</div>
            <button type="button" class="btn btn-link btn-sm p-0 mt-1" id="${detailsButtonId}">Open details</button>
          </div>
        `);
        marker.on('popupopen', () => {
          const button = document.getElementById(detailsButtonId);
          if (button) {
            button.addEventListener('click', () => onJobClick(job.id));
          }
        });
        marker.addTo(markerLayer);
        return marker;
      });

    if (markers.length > 0) {
      const group = L.featureGroup(markers);
      map.fitBounds(group.getBounds().pad(0.2));
    } else {
      map.setView([20, 0], 2);
    }
  }

  map.setView([20, 0], 2);
  return { renderMarkers };
}
